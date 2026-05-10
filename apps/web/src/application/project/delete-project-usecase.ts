import { IProjectRepository } from '@domain/project/project-repository';
import { Result, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'DeleteProjectUseCase' });

export class DeleteProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string, userId: string): Promise<Result<void, ApplicationError>> {
    // Verify ownership first
    const findResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (findResult.isErr()) {
      return findResult as any;
    }

    const deleteResult = await this.projectRepository.delete(projectId);
    if (deleteResult.isOk()) {
      logger.info('Project deleted', { projectId, userId });
    }
    return deleteResult;
  }
}
