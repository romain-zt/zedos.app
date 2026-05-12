export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { DrizzleUserStoryCorpusRepository } from '@infrastructure/persistence/user-story-corpus-repository';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import { CheckCreditsUseCase } from '@application/credits/check-credits-usecase';
import { DeductCreditsUseCase } from '@application/credits/deduct-credits-usecase';
import { GenerateUserStoryDraftUseCase } from '@application/user-stories/generate-user-story-draft-usecase';
import {
  GenerateUserStoriesRequestSchema,
  GenerateUserStoriesResponseSchema,
} from '@repo/contracts/user-stories/generate';
import { ApplicationError } from '@shared/errors/application-error';
import { corpusMutationBody } from '../_lib/corpus-response';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = GenerateUserStoriesRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const creditsRepo = new DrizzleCreditsRepository();
  const useCase = new GenerateUserStoryDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository(),
    new DrizzleUserStoryCorpusRepository(),
    new CheckCreditsUseCase(creditsRepo),
    new DeductCreditsUseCase(creditsRepo)
  );

  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return toErrorResponse(result.error);

  const dto = GenerateUserStoriesResponseSchema.safeParse(corpusMutationBody(result.unwrap()));
  if (!dto.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(dto.data);
}
