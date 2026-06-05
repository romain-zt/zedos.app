import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { LinearConnection, LinearConnectionDraft } from './linear-connection';

export interface ILinearConnectionRepository {
  findByProjectId(projectId: string): Promise<Result<LinearConnection | null, ApplicationError>>;
  upsertActive(draft: LinearConnectionDraft): Promise<Result<LinearConnection, ApplicationError>>;
  disconnect(projectId: string): Promise<Result<void, ApplicationError>>;
}
