export const dynamic = 'force-dynamic';

/** One AI call per HTTP request (outline or single story). */

export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  GenerateUserStoriesRequestSchema,
  GenerateUserStoriesResponseSchema,
} from '@repo/contracts/user-stories';
import { GenerateUserStoryDraftUseCase } from '@application/user-stories';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleFeatureSplitRepository } from '@infrastructure/persistence/feature-split-repository';
import { DrizzleUserStoryCorpusRepository } from '@infrastructure/persistence/user-story-corpus-repository';
import { UserStoryDraftGeneratorAdapter } from '@infrastructure/ai/user-story-draft-generator-adapter';
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
} from '@infrastructure/http/credits-http-bridge';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { mapUserStoryCorpusDomainToDto } from '../_lib/map-corpus-to-contract';

const logger = createLogger({ operation: 'user-stories/generate' });

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode });
}

function mapResultToResponse(
  result: Awaited<ReturnType<GenerateUserStoryDraftUseCase['execute']>>
): NextResponse {
  if (result.isErr()) return toErrorResponse(result.error);

  const value = result.unwrap();
  if (value.kind === 'outline') {
    const body = {
      kind: 'outline' as const,
      outlines: value.outlines,
      total: value.total,
    };
    const out = GenerateUserStoriesResponseSchema.safeParse(body);
    if (!out.success) {
      logger.error('Outbound outline validation failed', { errors: out.error.flatten() });
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  }

  if (value.kind === 'story') {
    const body = {
      kind: 'story' as const,
      corpus: mapUserStoryCorpusDomainToDto(value.corpus),
      progress: value.progress,
    };
    const out = GenerateUserStoriesResponseSchema.safeParse(body);
    if (!out.success) {
      logger.error('Outbound story progress validation failed', { errors: out.error.flatten() });
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
    return NextResponse.json(out.data);
  }

  const body = {
    kind: 'corpus' as const,
    corpus: mapUserStoryCorpusDomainToDto(value.corpus),
  };
  const out = GenerateUserStoriesResponseSchema.safeParse(body);
  if (!out.success) {
    logger.error('Outbound DTO validation failed for user-stories/generate', {
      errors: out.error.flatten(),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data);
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

  const parsed = GenerateUserStoriesRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const routeContext = { projectId: params.id, userId, mode: parsed.data.mode };
  const isAiAssisted = parsed.data.mode === 'ai';

  if (isAiAssisted) {
    const creditCheck = await checkCredits(userId, 'user_stories');
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

  const useCase = new GenerateUserStoryDraftUseCase(
    new DrizzleProjectRepository(),
    new DrizzleFeatureSplitRepository(),
    new DrizzleUserStoryCorpusRepository(),
    new UserStoryDraftGeneratorAdapter()
  );
  const result = await useCase.execute(params.id, userId, parsed.data);
  if (result.isErr()) return mapResultToResponse(result);

  if (parsed.data.mode === 'ai') {
    const aiInput = parsed.data;
    const aiStep = aiInput.aiStep ?? 'story';
    const deductResult = await deductCredits(userId, 'user_stories', {
      projectId: params.id,
      operation: aiStep === 'outline' ? 'user_stories_outline' : 'user_stories_story',
      featureSplitClusterId: aiInput.featureSplitClusterId,
      ...(aiStep === 'story' && 'outlineIndex' in aiInput
        ? { outlineIndex: aiInput.outlineIndex }
        : {}),
    });
    if (!deductResult.success) {
      logger.error('User story AI generation succeeded but credit deduction failed', routeContext);
    }
  }

  return mapResultToResponse(result);
}
