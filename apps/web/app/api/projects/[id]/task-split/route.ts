export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  SaveTaskSplitBundleRequestSchema,
  TaskSplitBundleSchema,
} from '@repo/contracts/task-split';
import { GetTaskSplitBundleUseCase } from '@application/task-split/get-task-split-bundle-usecase';
import { SaveTaskSplitBundleUseCase } from '@application/task-split/save-task-split-bundle-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { ApplicationError } from '@shared/errors/application-error';
import type { TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

function mapBundleToDto(bundle: TaskSplitBundleDomain) {
  return {
    id: bundle.id,
    projectId: bundle.projectId,
    sourceUserStoryKey: bundle.sourceUserStoryKey,
    storyTitleSnapshot: bundle.storyTitleSnapshot,
    lockedAt: bundle.lockedAt,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    tasks: bundle.tasks.map((t) => ({
      id: t.id,
      sortOrder: t.sortOrder,
      title: t.title,
      promptBody: t.promptBody,
      manual: t.manual,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const useCase = new GetTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) return toErrorResponse(result.error);

  const bundle = result.unwrap();
  if (bundle === null) return NextResponse.json(null, { status: 200 });

  const out = TaskSplitBundleSchema.safeParse(mapBundleToDto(bundle));
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new SaveTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return toErrorResponse(result.error);

  const out = TaskSplitBundleSchema.safeParse(mapBundleToDto(result.unwrap()));
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
