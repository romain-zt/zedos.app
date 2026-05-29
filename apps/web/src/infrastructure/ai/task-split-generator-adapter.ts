import type { ITaskSplitGenerator, GeneratedTaskDraft } from '@domain/task-split/task-split-generator';
import { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import { generateTasksFromStories } from './task-split-generator';

export class TaskSplitGeneratorAdapter implements ITaskSplitGenerator {
  async generate(
    storySummary: string,
    projectContext: string
  ): Promise<Result<GeneratedTaskDraft[], ApplicationError>> {
    return generateTasksFromStories(storySummary, projectContext);
  }
}
