export const dynamic = 'force-dynamic';

export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GenerateTaskSplitDraftResponseSchema,
  GenerateTaskSplitRequestSchema,
} from '@repo/contracts/task-split';
import { GenerateTaskSplitDraftUseCase } from '@application/task-split';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleTaskSplitBundleRepository } from '@infrastructure/persistence/task-split-bundle-repository';
import { TaskSplitDraftGeneratorAdapter } from '@infrastructure/ai/task-split-draft-generator-adapter';
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
} from '@infrastructure/http/credits-http-bridge';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'task-split/generate' });

function toErrorResponse(e: ApplicationError) {
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

  const parsed = GenerateTaskSplitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.mode === 'ai') {
    const creditCheck = await checkCredits(userId, 'task_split');
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: 'insufficient_credits',
          message: creditCheck.reason,
          balance: creditCheck.currentBalance,
        },
        { status: 402 }
      );
    }
  }

  const useCase = new GenerateTaskSplitDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleTaskSplitBundleRepository(),
    new TaskSplitDraftGeneratorAdapter()
  );
  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return toErrorResponse(result.error);

  if (parsed.data.mode === 'ai') {
    const deductResult = await deductCredits(userId, 'task_split', {
      projectId: params.id,
      operation: 'task_split_generate',
      userStoryLineId: parsed.data.userStoryLineId,
    });
    if (!deductResult.success) {
      logger.error('Task-split draft succeeded but credit deduction failed', {
        projectId: params.id,
        userId,
      });
      return NextResponse.json({ error: 'Credit deduction failed' }, { status: 500 });
    }
  }

  const draft = result.unwrap();
  const body = {
    userStoryLineId: draft.userStoryLineId,
    storyTitle: draft.storyTitle,
    storyBody: draft.storyBody,
    tasks: draft.tasks.map((task) => ({
      id: task.id,
      sortOrder: task.sortOrder,
      title: task.title,
      promptBody: task.promptBody,
      manual: task.manual,
    })),
  };

  const out = GenerateTaskSplitDraftResponseSchema.safeParse(body);
  if (!out.success) {
    logger.error('Outbound task-split draft validation failed', {
      errors: out.error.flatten(),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json(out.data);
}
