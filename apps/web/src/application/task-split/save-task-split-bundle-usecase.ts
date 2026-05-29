import { IProjectRepository } from '@domain/project/project-repository';
import type { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type { SaveTaskInput, TaskSplitBundleDomain } from '@domain/task-split/task-split-bundle';
import { SaveTaskSplitBundleRequestSchema } from '@repo/contracts';
import type { z } from 'zod';
import { Result, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SaveTaskSplitBundleUseCase' });

type SaveRequest = z.infer<typeof SaveTaskSplitBundleRequestSchema>;

export class SaveTaskSplitBundleUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private bundleRepository: ITaskSplitBundleRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: SaveRequest
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    if (input.tasks.length < 1) {
      return err(new ValidationError('At least one task is required'));
    }

    return this.bundleRepository.save(
      projectId,
      input.tasks.map(
        (t): SaveTaskInput => ({
          id: t.id,
          sortOrder: t.sortOrder,
          title: t.title,
          promptBody: t.promptBody,
          manual: t.manual ?? false,
        })
      ),
      {
        sourceUserStoryKey: input.sourceUserStoryKey,
        storyTitleSnapshot: input.storyTitleSnapshot,
      }
    );
  }
}
