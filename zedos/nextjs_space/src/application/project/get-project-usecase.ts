import { IProjectRepository } from '@domain/project/project-repository';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GetProjectUseCase' });

export class GetProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string, userId: string): Promise<Result<any, ApplicationError>> {
    const result = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (result.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
    }
    return result;
  }
}
