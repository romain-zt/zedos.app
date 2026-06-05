export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { CommentThreadDTOSchema } from '@repo/contracts/collab/comment-threads';
import { MarkThreadReadUseCase } from '@application/collab/resolve-thread-usecase';
import { toThreadDto } from '@application/collab/thread-dto';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { commentThreadRepository } from '@infrastructure/persistence/comment-thread-repository';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'comment-thread-read' });
const projectRepo = new DrizzleProjectRepository();
const memberRepo = new DrizzleProjectMemberRepository();

export async function POST(
  _request: Request,
  { params }: { params: { id: string; threadId: string } },
) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useCase = new MarkThreadReadUseCase(projectRepo, memberRepo, commentThreadRepository);
  const result = await useCase.execute({
    projectId: params.id,
    userId: userResult.unwrap().id,
    threadId: params.threadId,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const out = CommentThreadDTOSchema.safeParse(toThreadDto(result.unwrap(), { viewerRole: 'owner' }));
  if (!out.success) {
    logger.error('Thread outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data);
}
