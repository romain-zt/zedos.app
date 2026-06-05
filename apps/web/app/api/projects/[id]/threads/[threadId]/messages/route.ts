export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  CommentThreadDTOSchema,
  PostThreadMessageRequestSchema,
} from '@repo/contracts/collab/comment-threads';
import { PostCommentMessageUseCase } from '@application/collab/post-comment-message-usecase';
import { toThreadDto } from '@application/collab/thread-dto';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { commentThreadRepository } from '@infrastructure/persistence/comment-thread-repository';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'comment-thread-message' });
const projectRepo = new DrizzleProjectRepository();
const memberRepo = new DrizzleProjectMemberRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; threadId: string } },
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PostThreadMessageRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const useCase = new PostCommentMessageUseCase(projectRepo, memberRepo, commentThreadRepository);
  const result = await useCase.postOnThread({
    projectId: params.id,
    userId: userResult.unwrap().id,
    threadId: params.threadId,
    body: parsed.data.body,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const { access, thread } = result.unwrap();
  const out = CommentThreadDTOSchema.safeParse(toThreadDto(thread, { viewerRole: access.role }));
  if (!out.success) {
    logger.error('Thread outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data, { status: 201 });
}
