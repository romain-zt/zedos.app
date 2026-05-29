export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { TaskSplitBundleSchema } from '@repo/contracts/task-split';
import { UnlockTaskSplitBundleUseCase } from '@application/task-split/unlock-task-split-bundle-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { ApplicationError } from '@shared/errors/application-error';
import type { TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

function mapBundle(bundle: TaskSplitBundleDomain) {
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

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const useCase = new UnlockTaskSplitBundleUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository()
  );
  const result = await useCase.execute(params.id, userId);
  if (result.isErr()) return toErrorResponse(result.error);

  const out = TaskSplitBundleSchema.safeParse(mapBundle(result.unwrap()));
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
