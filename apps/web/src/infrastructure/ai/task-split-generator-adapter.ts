import type { ITaskSplitGenerator, GeneratedTaskDraft } from '@domain/task-split/task-split-generator';
import { Result, ok, err } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import { generateTasksFromStories } from './task-split-generator';

export class TaskSplitGeneratorAdapter implements ITaskSplitGenerator {
  async generate(
    storySummary: string,
    projectContext: string
  ): Promise<Result<GeneratedTaskDraft[], ApplicationError>> {
    const result = await generateTasksFromStories(storySummary, projectContext);
    if (result.isErr()) return err(result.error);
    return ok(result.unwrap().map((t) => ({ title: t.title, promptBody: t.promptBody })));
  }
}
