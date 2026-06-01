import { IProjectRepository } from '@domain/project/project-repository';
import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type { TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'LockTaskSplitBundleUseCase' });

export class LockTaskSplitBundleUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private bundleRepository: ITaskSplitBundleRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    bundleId: string
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    return this.bundleRepository.lock(projectId, bundleId);
  }
}
