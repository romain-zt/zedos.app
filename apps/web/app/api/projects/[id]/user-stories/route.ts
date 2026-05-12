export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { DrizzleUserStoryCorpusRepository } from '@infrastructure/persistence/user-story-corpus-repository';
import { GetUserStoryCorpusUseCase } from '@application/user-stories/get-user-story-corpus-usecase';
import { SaveUserStoryCorpusUseCase } from '@application/user-stories/save-user-story-corpus-usecase';
import {
  GetUserStoryCorpusQuerySchema,
  GetUserStoryCorpusResponseSchema,
  SaveUserStoryCorpusRequestSchema,
} from '@repo/contracts/user-stories/corpus';
import { GenerateUserStoriesResponseSchema } from '@repo/contracts/user-stories/generate';
import { ApplicationError } from '@shared/errors/application-error';
import { corpusMutationBody } from './_lib/corpus-response';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const qp = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = GetUserStoryCorpusQuerySchema.safeParse(qp);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new GetUserStoryCorpusUseCase(
    new DrizzleProjectRepository(),
    new DrizzleUserStoryCorpusRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.featureSplitClusterId);
  if (result.isErr()) return toErrorResponse(result.error);

  const corpus = result.unwrap();
  const body = corpus ? corpusMutationBody(corpus) : { corpus: null };
  const out = GetUserStoryCorpusResponseSchema.safeParse(body);
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SaveUserStoryCorpusRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new SaveUserStoryCorpusUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository(),
    new DrizzleUserStoryCorpusRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return toErrorResponse(result.error);

  const wrapped = corpusMutationBody(result.unwrap());
  const dto = GenerateUserStoriesResponseSchema.safeParse(wrapped);
  if (!dto.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(dto.data);
}
