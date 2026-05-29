import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export interface GeneratedTaskDraft {
  title: string;
  promptBody: string;
}

export interface ITaskSplitGenerator {
  generate(
    storySummary: string,
    projectContext: string
  ): Promise<Result<GeneratedTaskDraft[], ApplicationError>>;
}
