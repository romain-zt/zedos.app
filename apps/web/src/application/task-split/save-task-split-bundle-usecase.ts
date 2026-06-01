import { IProjectRepository } from '@domain/project/project-repository';
import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type { SaveTaskSplitTaskInput, TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { requireEligibleStoryLine } from './require-eligible-story-line';

const logger = createLogger({ operation: 'SaveTaskSplitBundleUseCase' });

export class SaveTaskSplitBundleUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private bundleRepository: ITaskSplitBundleRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    userStoryLineId: string,
    tasks: SaveTaskSplitTaskInput[]
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const lineResult = await requireEligibleStoryLine(
      this.bundleRepository,
      projectId,
      userStoryLineId
    );
    if (lineResult.isErr()) return err(lineResult.error);
    const line = lineResult.unwrap();

    return this.bundleRepository.save(
      projectId,
      userStoryLineId,
      line.title,
      line.body,
      tasks
    );
  }
}
