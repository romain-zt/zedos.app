import type { CommentThread } from './comment-thread';
import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { CommentThreadStatus } from '@repo/contracts/collab/comment-threads';

export interface ListThreadsFilter {
  prdVersionId?: string;
  sectionId?: string;
  status?: CommentThreadStatus;
}

export interface CreateThreadDraft {
  projectId: string;
  prdVersionId: string | null;
  sectionId: string;
  createdByUserId: string;
}

export interface AppendMessageDraft {
  threadId: string;
  authorUserId: string;
  body: string;
}

export interface ICommentThreadRepository {
  listForProject(
    projectId: string,
    filter: ListThreadsFilter,
  ): Promise<Result<CommentThread[], ApplicationError>>;

  findById(threadId: string): Promise<Result<CommentThread, ApplicationError>>;

  findOpenForSection(
    projectId: string,
    prdVersionId: string | null,
    sectionId: string,
  ): Promise<Result<CommentThread | null, ApplicationError>>;

  createThreadWithFirstMessage(
    draft: CreateThreadDraft,
    body: string,
  ): Promise<Result<CommentThread, ApplicationError>>;

  appendMessage(
    draft: AppendMessageDraft,
  ): Promise<Result<CommentThread, ApplicationError>>;

  setStatus(
    threadId: string,
    status: CommentThreadStatus,
  ): Promise<Result<CommentThread, ApplicationError>>;

  markOwnerRead(
    threadId: string,
    at: Date,
  ): Promise<Result<CommentThread, ApplicationError>>;
}
