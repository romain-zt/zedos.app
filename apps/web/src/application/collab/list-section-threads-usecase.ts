import { Result, err, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import type { CommentThread } from '@domain/collab/comment-thread';
import type {
  ICommentThreadRepository,
  ListThreadsFilter,
} from '@domain/collab/comment-thread-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess, type ProjectAccessContext } from './project-access';

export interface ListSectionThreadsInput {
  projectId: string;
  userId: string;
  filter: ListThreadsFilter;
}

export interface ListSectionThreadsResult {
  access: ProjectAccessContext;
  threads: CommentThread[];
}

export class ListSectionThreadsUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly memberRepository: IProjectMemberRepository,
    private readonly threadRepository: ICommentThreadRepository,
  ) {}

  async execute(
    input: ListSectionThreadsInput,
  ): Promise<Result<ListSectionThreadsResult, ApplicationError>> {
    const accessResult = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (accessResult.isErr()) return err(accessResult.error);

    const listResult = await this.threadRepository.listForProject(input.projectId, input.filter);
    if (listResult.isErr()) return err(listResult.error);

    return ok({ access: accessResult.unwrap(), threads: listResult.unwrap() });
  }
}
