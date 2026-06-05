export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  LinearIssueLinkDTOSchema,
  PushStoryToLinearResponseSchema,
  type LinearIssueLinkDTO,
} from '@repo/contracts/linear/push';
import { PushUserStoryToLinearUseCase } from '@application/linear/push-user-story-to-linear-usecase';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { linearConnectionRepository } from '@infrastructure/persistence/linear-connection-repository';
import { linearIssueLinkRepository } from '@infrastructure/persistence/linear-issue-link-repository';
import { linearApiClient } from '@infrastructure/linear/linear-api-client';
import type { LinearIssueLink } from '@domain/linear';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'linear-push-story' });

function toDto(link: LinearIssueLink): LinearIssueLinkDTO {
  return {
    id: link.id,
    projectId: link.projectId,
    userStoryLineId: link.userStoryLineId,
    linearIssueId: link.linearIssueId,
    linearIssueIdentifier: link.linearIssueIdentifier,
    status: link.status,
    lastSyncedAt: link.lastSyncedAt,
    createdAt: link.createdAt,
  };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const userResult = await requireUser(await headers());
    if (userResult.isErr()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const useCase = new PushUserStoryToLinearUseCase(
      new DrizzleProjectRepository(),
      linearConnectionRepository,
      linearIssueLinkRepository,
      linearApiClient,
    );
    const result = await useCase.execute(projectId, userResult.unwrap().id, body);
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
    }
    const linkDto = toDto(result.unwrap());
    const validatedLink = LinearIssueLinkDTOSchema.safeParse(linkDto);
    if (!validatedLink.success) {
      logger
        .withContext({ projectId })
        .error('Linear push DTO validation failed', validationFailureData(validatedLink.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    const payload = PushStoryToLinearResponseSchema.safeParse({ link: validatedLink.data });
    if (!payload.success) {
      logger
        .withContext({ projectId })
        .error('Linear push response validation failed', validationFailureData(payload.error.flatten()));
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
    }
    return NextResponse.json(payload.data, { status: 201 });
  } catch (error) {
    logger.withContext({ projectId }).error('Linear push POST failed', error);
    return NextResponse.json({ error: 'Failed to push story to Linear' }, { status: 500 });
  }
}
