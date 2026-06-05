import { Result, err, ok } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import type { CommentThread } from '@domain/collab/comment-thread';
import type { ICommentThreadRepository } from '@domain/collab/comment-thread-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess, type ProjectAccessContext } from './project-access';

export interface PostSectionCommentInput {
  projectId: string;
  userId: string;
  prdVersionId: string | null;
  sectionId: string;
  body: string;
}

export interface PostThreadMessageInput {
  projectId: string;
  threadId: string;
  userId: string;
  body: string;
}

export interface PostMessageResult {
  access: ProjectAccessContext;
  thread: CommentThread;
  threadCreated: boolean;
}

const MAX_BODY = 4000;

function validateBody(body: string): Result<string, ApplicationError> {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return err(new ValidationError('Message body required'));
  }
  if (trimmed.length > MAX_BODY) {
    return err(new ValidationError(`Message body exceeds ${MAX_BODY} characters`));
  }
  return ok(trimmed);
}

export class PostCommentMessageUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly memberRepository: IProjectMemberRepository,
    private readonly threadRepository: ICommentThreadRepository,
  ) {}

  /** Section-scoped post: reuse the open thread for that section if present, otherwise create one. */
  async postOnSection(
    input: PostSectionCommentInput,
  ): Promise<Result<PostMessageResult, ApplicationError>> {
    const accessResult = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (accessResult.isErr()) return err(accessResult.error);

    const bodyResult = validateBody(input.body);
    if (bodyResult.isErr()) return err(bodyResult.error);

    const existingResult = await this.threadRepository.findOpenForSection(
      input.projectId,
      input.prdVersionId,
      input.sectionId,
    );
    if (existingResult.isErr()) return err(existingResult.error);

    const existing = existingResult.unwrap();
    if (existing) {
      const appendResult = await this.threadRepository.appendMessage({
        threadId: existing.id,
        authorUserId: input.userId,
        body: bodyResult.unwrap(),
      });
      if (appendResult.isErr()) return err(appendResult.error);
      return ok({ access: accessResult.unwrap(), thread: appendResult.unwrap(), threadCreated: false });
    }

    const createResult = await this.threadRepository.createThreadWithFirstMessage(
      {
        projectId: input.projectId,
        prdVersionId: input.prdVersionId,
        sectionId: input.sectionId,
        createdByUserId: input.userId,
      },
      bodyResult.unwrap(),
    );
    if (createResult.isErr()) return err(createResult.error);
    return ok({ access: accessResult.unwrap(), thread: createResult.unwrap(), threadCreated: true });
  }

  /** Thread-scoped reply. */
  async postOnThread(
    input: PostThreadMessageInput,
  ): Promise<Result<PostMessageResult, ApplicationError>> {
    const accessResult = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (accessResult.isErr()) return err(accessResult.error);

    const bodyResult = validateBody(input.body);
    if (bodyResult.isErr()) return err(bodyResult.error);

    const threadResult = await this.threadRepository.findById(input.threadId);
    if (threadResult.isErr()) return err(threadResult.error);
    if (threadResult.unwrap().projectId !== input.projectId) {
      return err(new ValidationError('Thread does not belong to project'));
    }

    const appendResult = await this.threadRepository.appendMessage({
      threadId: input.threadId,
      authorUserId: input.userId,
      body: bodyResult.unwrap(),
    });
    if (appendResult.isErr()) return err(appendResult.error);
    return ok({ access: accessResult.unwrap(), thread: appendResult.unwrap(), threadCreated: false });
  }
}
