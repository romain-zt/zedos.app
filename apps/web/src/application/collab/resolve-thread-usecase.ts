import { Result, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import type { CommentThread } from '@domain/collab/comment-thread';
import type { ICommentThreadRepository } from '@domain/collab/comment-thread-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import type { CommentThreadStatus } from '@repo/contracts/collab/comment-threads';
import { resolveProjectAccess, requireOwnerAccess } from './project-access';

export interface ResolveThreadInput {
  projectId: string;
  userId: string;
  threadId: string;
  status: CommentThreadStatus;
}

export class ResolveThreadUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly memberRepository: IProjectMemberRepository,
    private readonly threadRepository: ICommentThreadRepository,
  ) {}

  async execute(input: ResolveThreadInput): Promise<Result<CommentThread, ApplicationError>> {
    const accessResult = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (accessResult.isErr()) return err(accessResult.error);

    const ownerCheck = requireOwnerAccess(accessResult.unwrap());
    if (ownerCheck.isErr()) return err(ownerCheck.error);

    const threadResult = await this.threadRepository.findById(input.threadId);
    if (threadResult.isErr()) return err(threadResult.error);
    if (threadResult.unwrap().projectId !== input.projectId) {
      return err(new ValidationError('Thread does not belong to project'));
    }

    return this.threadRepository.setStatus(input.threadId, input.status);
  }
}

export interface MarkThreadReadInput {
  projectId: string;
  userId: string;
  threadId: string;
}

export class MarkThreadReadUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly memberRepository: IProjectMemberRepository,
    private readonly threadRepository: ICommentThreadRepository,
  ) {}

  async execute(
    input: MarkThreadReadInput,
  ): Promise<Result<CommentThread, ApplicationError>> {
    const accessResult = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (accessResult.isErr()) return err(accessResult.error);

    const ownerCheck = requireOwnerAccess(accessResult.unwrap());
    if (ownerCheck.isErr()) return err(ownerCheck.error);

    const threadResult = await this.threadRepository.findById(input.threadId);
    if (threadResult.isErr()) return err(threadResult.error);
    if (threadResult.unwrap().projectId !== input.projectId) {
      return err(new ValidationError('Thread does not belong to project'));
    }

    return this.threadRepository.markOwnerRead(input.threadId, new Date());
  }
}
