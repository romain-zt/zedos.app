/**
 * Task-split bundle repository port.
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import type {
  EligibleUserStoryLineSnapshot,
  SaveTaskSplitTaskInput,
  TaskSplitBundleDomain,
} from './task-split-bundle';

export interface ITaskSplitBundleRepository {
  findEligibleStoryLine(
    projectId: string,
    userStoryLineId: string
  ): Promise<Result<EligibleUserStoryLineSnapshot | null, ApplicationError>>;

  findByProjectAndStoryLine(
    projectId: string,
    userStoryLineId: string
  ): Promise<Result<TaskSplitBundleDomain | null, ApplicationError>>;

  save(
    projectId: string,
    userStoryLineId: string,
    storyTitle: string,
    storyBody: string,
    tasks: SaveTaskSplitTaskInput[]
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>>;

  lock(projectId: string, bundleId: string): Promise<Result<TaskSplitBundleDomain, ApplicationError>>;
}
