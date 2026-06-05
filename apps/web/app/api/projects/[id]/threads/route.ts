export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import {
  ListCommentThreadsQuerySchema,
  ListCommentThreadsResponseSchema,
  PostSectionCommentRequestSchema,
  CommentThreadDTOSchema,
} from '@repo/contracts/collab/comment-threads';
import type { ListThreadsFilter } from '@domain/collab/comment-thread-repository';
import { ListSectionThreadsUseCase } from '@application/collab/list-section-threads-usecase';
import { PostCommentMessageUseCase } from '@application/collab/post-comment-message-usecase';
import { toThreadDto } from '@application/collab/thread-dto';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';
import { commentThreadRepository } from '@infrastructure/persistence/comment-thread-repository';
import { createLogger } from '@shared/observability/logger';
import { validationFailureData } from '@shared/observability/log-safe';

const logger = createLogger({ operation: 'comment-threads' });
const projectRepo = new DrizzleProjectRepository();
const memberRepo = new DrizzleProjectMemberRepository();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const queryRaw: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    queryRaw[key] = value;
  });
  const queryParsed = ListCommentThreadsQuerySchema.safeParse(queryRaw);
  if (!queryParsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: queryParsed.error.flatten() },
      { status: 400 },
    );
  }

  const filter: ListThreadsFilter = {};
  if (queryParsed.data.prdVersionId) filter.prdVersionId = queryParsed.data.prdVersionId;
  if (queryParsed.data.sectionId) filter.sectionId = queryParsed.data.sectionId;
  if (queryParsed.data.status) filter.status = queryParsed.data.status;

  const useCase = new ListSectionThreadsUseCase(projectRepo, memberRepo, commentThreadRepository);
  const result = await useCase.execute({
    projectId: params.id,
    userId: userResult.unwrap().id,
    filter,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const { access, threads } = result.unwrap();
  const out = ListCommentThreadsResponseSchema.safeParse({
    threads: threads.map((t) => toThreadDto(t, { viewerRole: access.role })),
  });
  if (!out.success) {
    logger.error('Threads outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

  const parsed = PostSectionCommentRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const useCase = new PostCommentMessageUseCase(projectRepo, memberRepo, commentThreadRepository);
  const result = await useCase.postOnSection({
    projectId: params.id,
    userId: userResult.unwrap().id,
    prdVersionId: parsed.data.prdVersionId,
    sectionId: parsed.data.sectionId,
    body: parsed.data.body,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const { access, thread, threadCreated } = result.unwrap();
  const out = CommentThreadDTOSchema.safeParse(toThreadDto(thread, { viewerRole: access.role }));
  if (!out.success) {
    logger.error('Thread outbound validation failed', validationFailureData(out.error.flatten()));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(out.data, { status: threadCreated ? 201 : 200 });
}
