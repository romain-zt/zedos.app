/**
 * Bridges ITaskSplitDraftGenerator to the validated AI task-split draft helper.
 */

import type {
  ITaskSplitDraftGenerator,
  TaskSplitStoryContext,
} from '@domain/task-split/task-split-draft-generator';
import type { SaveTaskSplitTaskInput } from '@domain/task-split/task-split-bundle';
import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { draftTasksForStory } from './task-split-draft';

export class TaskSplitDraftGeneratorAdapter implements ITaskSplitDraftGenerator {
  draftTasks(
    story: TaskSplitStoryContext
  ): Promise<Result<SaveTaskSplitTaskInput[], ApplicationError>> {
    return draftTasksForStory(story);
  }
}
