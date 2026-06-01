export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { MarkUserStoriesReviewReadyRequestSchema, UserStoryCorpusSchema } from '@repo/contracts/user-stories';
import { MarkUserStoriesReviewReadyUseCase } from '@application/user-stories';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { DrizzleUserStoryCorpusRepository } from '@infrastructure/persistence/user-story-corpus-repository';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { mapUserStoryCorpusDomainToDto } from '../_lib/map-corpus-to-contract';

const logger = createLogger({ operation: 'user-stories/review-ready' });

function toErrorResponse(
  e: ApplicationError,
  context: { projectId: string; userId: string },
  message: string
) {
  logger.warn(message, { ...context, statusCode: e.statusCode });
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

export async function POST(
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

  const parsed = MarkUserStoriesReviewReadyRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('User stories review-ready validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new MarkUserStoriesReviewReadyUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository(),
    new DrizzleUserStoryCorpusRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.featureSplitClusterId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'User stories review-ready failed');

  const dto = mapUserStoryCorpusDomainToDto(result.unwrap());
  const out = UserStoryCorpusSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('User stories review-ready outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('User stories marked review-ready', routeContext);
  return NextResponse.json(out.data);
}
