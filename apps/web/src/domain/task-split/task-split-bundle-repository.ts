import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { SaveTaskInput, TaskSplitBundleDomain } from './task-split-bundle';

export interface ITaskSplitBundleRepository {
  findByProject(projectId: string): Promise<Result<TaskSplitBundleDomain | null, ApplicationError>>;
  save(
    projectId: string,
    tasks: SaveTaskInput[],
    meta: { sourceUserStoryKey?: string | null; storyTitleSnapshot?: string | null }
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>>;
  lock(projectId: string): Promise<Result<TaskSplitBundleDomain, ApplicationError>>;
}
