import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  DriftSignal,
  DriftSignalStatus,
  IDriftSignalRepository,
} from '@domain/github';
import { Result, err } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export class ListDriftSignalsUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly driftSignalRepository: IDriftSignalRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    statusFilter?: DriftSignalStatus,
  ): Promise<Result<DriftSignal[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    return this.driftSignalRepository.findByProjectId(projectId, statusFilter);
  }
}
