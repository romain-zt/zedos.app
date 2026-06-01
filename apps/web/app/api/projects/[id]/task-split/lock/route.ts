export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { LockTaskSplitBundleRequestSchema, TaskSplitBundleSchema } from '@repo/contracts/task-split';
import { LockTaskSplitBundleUseCase } from '@application/task-split';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { mapTaskSplitBundleDomainToDto } from '../_lib/map-bundle-to-contract';

const logger = createLogger({ operation: 'task-split/lock' });

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

  const parsed = LockTaskSplitBundleRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('Task-split lock validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new LockTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data.bundleId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Task-split lock failed');

  const dto = mapTaskSplitBundleDomainToDto(result.unwrap());
  const out = TaskSplitBundleSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Task-split lock outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('Task-split bundle locked', { ...routeContext, bundleId: parsed.data.bundleId });
  return NextResponse.json(out.data);
}
