import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { GithubConnection, GithubConnectionDraft } from './github-connection';

export interface IGithubConnectionRepository {
  findByProjectId(projectId: string): Promise<Result<GithubConnection | null, ApplicationError>>;
  findByOwnerRepo(
    ownerLogin: string,
    repoName: string,
  ): Promise<Result<GithubConnection | null, ApplicationError>>;
  upsertActive(draft: GithubConnectionDraft): Promise<Result<GithubConnection, ApplicationError>>;
  disconnect(projectId: string): Promise<Result<void, ApplicationError>>;
}
