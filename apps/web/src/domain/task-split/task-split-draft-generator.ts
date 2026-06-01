/**
 * Port for assisted task-split draft generation.
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import type { SaveTaskSplitTaskInput } from './task-split-bundle';

export interface TaskSplitStoryContext {
  title: string;
  body: string;
}

export interface ITaskSplitDraftGenerator {
  draftTasks(
    story: TaskSplitStoryContext
  ): Promise<Result<SaveTaskSplitTaskInput[], ApplicationError>>;
}
