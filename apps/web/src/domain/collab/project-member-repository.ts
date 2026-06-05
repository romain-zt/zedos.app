import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { ProjectMemberDTO } from '@repo/contracts/project/members';

/** Port consumed by collab application use cases. The Drizzle repository implements this. */
export interface IProjectMemberRepository {
  assertOwner(projectId: string, userId: string): Promise<Result<void, ApplicationError>>;
  userHasProjectAccess(projectId: string, userId: string): Promise<boolean>;
  listByProject(
    projectId: string,
    requesterUserId: string,
  ): Promise<Result<ProjectMemberDTO[], ApplicationError>>;
  invite(
    projectId: string,
    ownerUserId: string,
    inviteEmail: string,
    role: 'editor' | 'viewer' | 'commenter',
  ): Promise<Result<ProjectMemberDTO, ApplicationError>>;
  countActiveCommenters(projectId: string): Promise<Result<number, ApplicationError>>;
  findById(
    projectId: string,
    memberId: string,
  ): Promise<Result<ProjectMemberDTO | null, ApplicationError>>;
  revoke(
    projectId: string,
    memberId: string,
    ownerUserId: string,
  ): Promise<Result<void, ApplicationError>>;
}
