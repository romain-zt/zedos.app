export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GetUserStoryCorpusQuerySchema,
  SaveUserStoryCorpusRequestSchema,
  UserStoryCorpusSchema,
} from '@repo/contracts/user-stories';
import {
  GetUserStoryCorpusUseCase,
  SaveUserStoryCorpusUseCase,
} from '@application/user-stories';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { DrizzleUserStoryCorpusRepository } from '@infrastructure/persistence/user-story-corpus-repository';
import { ApplicationError } from '@shared/errors/application-error';
import type { SaveUserStoryLineInput } from '@domain/user-stories/user-story-corpus';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { mapUserStoryCorpusDomainToDto } from './_lib/map-corpus-to-contract';

const logger = createLogger({ operation: 'user-stories' });

function toErrorResponse(
  e: ApplicationError,
  context: { projectId: string; userId: string },
  message: string
) {
  logger.warn(message, { ...context, statusCode: e.statusCode });
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const query = GetUserStoryCorpusQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!query.success) {
    logger.warn('User stories GET validation failed', validationFailureData(query.error.flatten()));
    return NextResponse.json({ error: 'Invalid query', details: query.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new GetUserStoryCorpusUseCase(
    new DrizzleProjectRepository(),
    new DrizzleUserStoryCorpusRepository()
  );
  const result = await useCase.execute(params.id, userId, query.data.featureSplitClusterId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'User stories GET failed');

  const corpus = result.unwrap();
  if (corpus === null) {
    return NextResponse.json({ error: 'User story corpus not found' }, { status: 404 });
  }

  const dto = mapUserStoryCorpusDomainToDto(corpus);
  const out = UserStoryCorpusSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('User stories GET outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    logger.warn('User stories PUT validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new SaveUserStoryCorpusUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository(),
    new DrizzleUserStoryCorpusRepository()
  );
  const result = await useCase.execute(
    params.id,
    userId,
    parsed.data.featureSplitClusterId,
    parsed.data.lines as SaveUserStoryLineInput[]
  );
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'User stories PUT failed');

  const dto = mapUserStoryCorpusDomainToDto(result.unwrap());
  const out = UserStoryCorpusSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('User stories PUT outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('User story corpus saved', routeContext);
  return NextResponse.json(out.data);
}
