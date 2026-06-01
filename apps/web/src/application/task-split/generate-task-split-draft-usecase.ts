import { IProjectRepository } from '@domain/project/project-repository';
import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type { ITaskSplitDraftGenerator } from '@domain/task-split/task-split-draft-generator';
import type { SaveTaskSplitTaskInput } from '@domain/task-split/task-split-bundle';
import type { GenerateTaskSplitRequest } from '@repo/contracts/task-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { requireEligibleStoryLine } from './require-eligible-story-line';

const logger = createLogger({ operation: 'GenerateTaskSplitDraftUseCase' });

export type GenerateTaskSplitDraftResult = {
  userStoryLineId: string;
  storyTitle: string;
  storyBody: string;
  tasks: SaveTaskSplitTaskInput[];
};

function buildTemplateTasks(story: { title: string; body: string }): SaveTaskSplitTaskInput[] {
  const excerpt = story.body.trim().slice(0, 500);
  return [
    {
      sortOrder: 0,
      title: 'Clarify acceptance criteria',
      promptBody: [
        `You are implementing user story: "${story.title}".`,
        '',
        '### Story excerpt',
        excerpt || '_No body provided — refine upstream._',
        '',
        '### Task',
        'List observable acceptance criteria as bullet points in a short markdown note. Do not write production code yet.',
        '',
        '### Done when',
        '- Criteria are testable from a user-visible perspective.',
      ].join('\n'),
      manual: false,
    },
    {
      sortOrder: 1,
      title: 'Implement core behavior',
      promptBody: [
        `Implement the core behavior for: "${story.title}".`,
        '',
        '### Context',
        story.body.trim() || excerpt,
        '',
        '### Task',
        'Ship the smallest vertical slice that satisfies the main outcome. Match existing project conventions.',
        '',
        '### Done when',
        '- Happy path works end-to-end.',
        '- Types and lint pass.',
      ].join('\n'),
      manual: false,
    },
    {
      sortOrder: 2,
      title: 'Harden edge cases and errors',
      promptBody: [
        `Harden edge cases for: "${story.title}".`,
        '',
        '### Task',
        'Add validation, empty states, and error handling implied by the story. Add or update tests only where they cover real behavior.',
        '',
        '### Done when',
        '- Failure paths are explicit and user-safe.',
      ].join('\n'),
      manual: false,
    },
  ];
}

export class GenerateTaskSplitDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private bundleRepository: ITaskSplitBundleRepository,
    private draftGenerator: ITaskSplitDraftGenerator
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: GenerateTaskSplitRequest
  ): Promise<Result<GenerateTaskSplitDraftResult, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const lineResult = await requireEligibleStoryLine(
      this.bundleRepository,
      projectId,
      input.userStoryLineId
    );
    if (lineResult.isErr()) return err(lineResult.error);
    const line = lineResult.unwrap();

    if (input.mode === 'template') {
      return ok({
        userStoryLineId: input.userStoryLineId,
        storyTitle: line.title,
        storyBody: line.body,
        tasks: buildTemplateTasks(line),
      });
    }

    const draftResult = await this.draftGenerator.draftTasks({
      title: line.title,
      body: line.body,
    });
    if (draftResult.isErr()) return err(draftResult.error);

    return ok({
      userStoryLineId: input.userStoryLineId,
      storyTitle: line.title,
      storyBody: line.body,
      tasks: draftResult.unwrap(),
    });
  }
}
