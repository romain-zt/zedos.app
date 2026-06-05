import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  DriftSignal,
  DriftSignalDraft,
  DriftSignalStatus,
} from './drift-signal';

export interface IDriftSignalRepository {
  insertIfAbsent(
    draft: DriftSignalDraft,
  ): Promise<Result<{ created: boolean; signal: DriftSignal | null }, ApplicationError>>;
  findByProjectId(
    projectId: string,
    statusFilter?: DriftSignalStatus,
  ): Promise<Result<DriftSignal[], ApplicationError>>;
  findByIdForProject(
    projectId: string,
    signalId: string,
  ): Promise<Result<DriftSignal | null, ApplicationError>>;
  updateStatus(
    projectId: string,
    signalId: string,
    status: DriftSignalStatus,
  ): Promise<Result<DriftSignal, ApplicationError>>;
}
