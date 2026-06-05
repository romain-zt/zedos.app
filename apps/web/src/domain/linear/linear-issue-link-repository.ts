import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  LinearIssueLink,
  LinearIssueLinkDraft,
  LinearIssueLinkStatus,
} from './linear-issue-link';

export interface UserStoryLineForPush {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly projectId: string;
}

export interface ILinearIssueLinkRepository {
  /**
   * Resolves a user story line and asserts it belongs to the project via its
   * corpus. Returns null when the line does not exist or does not belong to
   * the project — caller maps to NotFound / Forbidden as appropriate.
   */
  findUserStoryLineForProject(
    projectId: string,
    userStoryLineId: string,
  ): Promise<Result<UserStoryLineForPush | null, ApplicationError>>;

  findByUserStoryLineId(
    userStoryLineId: string,
  ): Promise<Result<LinearIssueLink | null, ApplicationError>>;
  findByLinearIssueId(
    linearIssueId: string,
  ): Promise<Result<LinearIssueLink | null, ApplicationError>>;
  insert(draft: LinearIssueLinkDraft): Promise<Result<LinearIssueLink, ApplicationError>>;
  updateStatus(
    id: string,
    status: LinearIssueLinkStatus,
    syncedAt: Date,
  ): Promise<Result<LinearIssueLink, ApplicationError>>;
}
