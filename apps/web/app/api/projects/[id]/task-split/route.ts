export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GetTaskSplitBundleQuerySchema,
  SaveTaskSplitBundleRequestSchema,
  TaskSplitBundleSchema,
} from '@repo/contracts/task-split';
import { GetTaskSplitBundleUseCase, SaveTaskSplitBundleUseCase } from '@application/task-split';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { ApplicationError } from '@shared/errors/application-error';
import type { SaveTaskSplitTaskInput } from '@domain/task-split/task-split-bundle';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';
import { mapTaskSplitBundleDomainToDto } from './_lib/map-bundle-to-contract';

const logger = createLogger({ operation: 'task-split' });

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

  const query = GetTaskSplitBundleQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!query.success) {
    logger.warn('Task-split GET validation failed', validationFailureData(query.error.flatten()));
    return NextResponse.json(
      { error: 'Invalid query', details: query.error.flatten() },
      { status: 400 }
    );
  }

  const routeContext = { projectId: params.id, userId };
  const useCase = new GetTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId, query.data.userStoryLineId);
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Task-split GET failed');

  const bundle = result.unwrap();
  if (bundle === null) {
    return NextResponse.json({ error: 'Task-split bundle not found' }, { status: 404 });
  }

  const dto = mapTaskSplitBundleDomainToDto(bundle);
  const out = TaskSplitBundleSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Task-split GET outbound validation failed', validationFailureData(out.error.flatten()));
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

  const parsed = SaveTaskSplitBundleRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn('Task-split PUT validation failed', validationFailureData(parsed.error.flatten()));
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const routeContext = { projectId: params.id, userId };
  const tasks: SaveTaskSplitTaskInput[] = parsed.data.tasks.map((task) => ({
    id: task.id,
    sortOrder: task.sortOrder,
    title: task.title,
    promptBody: task.promptBody,
    manual: task.manual ?? false,
  }));

  const useCase = new SaveTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(
    params.id,
    userId,
    parsed.data.userStoryLineId,
    tasks
  );
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'Task-split PUT failed');

  const dto = mapTaskSplitBundleDomainToDto(result.unwrap());
  const out = TaskSplitBundleSchema.safeParse(dto);
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('Task-split PUT outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  logger.info('Task-split bundle saved', routeContext);
  return NextResponse.json(out.data);
}
