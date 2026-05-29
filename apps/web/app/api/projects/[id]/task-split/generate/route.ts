export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GenerateTaskSplitRequestSchema, TaskSplitBundleSchema } from '@repo/contracts/task-split';
import { GenerateTaskSplitDraftUseCase } from '@application/task-split/generate-task-split-draft-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository';
import { TaskSplitGeneratorAdapter } from '@infrastructure/ai/task-split-generator-adapter';
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
    raw = {};
  }

  const parsed = GenerateTaskSplitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new GenerateTaskSplitDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository(),
    new DrizzlePrdRepository(),
    new TaskSplitGeneratorAdapter()
  );
  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return toErrorResponse(result.error);

  const out = TaskSplitBundleSchema.safeParse(mapBundle(result.unwrap()));
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  return NextResponse.json(out.data);
}
