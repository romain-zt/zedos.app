import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { IUserStoryDraftGenerator } from '@domain/user-stories/user-story-draft-generator';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import type { GenerateUserStoriesRequest } from '@repo/contracts/user-stories';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { requireConfirmedClusterForUserStories } from './require-confirmed-cluster';

const logger = createLogger({ operation: 'GenerateUserStoryDraftUseCase' });

export type GenerateUserStoryDraftResult =
  | { kind: 'corpus'; corpus: UserStoryCorpusDomain }
  | { kind: 'outline'; outlines: { title: string }[]; total: number }
  | {
      kind: 'story';
      corpus: UserStoryCorpusDomain;
      progress: { current: number; total: number; done: boolean };
    };

/** Cheap template draft: structured scaffold; cluster fields are hints only (not the whole story). */
function buildTemplateDraft(cluster: {
  label: string;
  valueLine: string;
  boundaryCue: string;
}): { title: string; body: string } {
  const title = cluster.label.trim() || 'Feature story';
  const valueLine = cluster.valueLine?.trim() ?? '';
  const boundaryCue = cluster.boundaryCue?.trim() ?? '';

  const body = [
    '## Goal',
    'Turn this cluster into concrete, user-visible behaviors. Each capability below must be **distinct** — do not ship the cluster fields alone as the story.',
    '',
    '## Cluster reference (expand; do not use as sole story text)',
    `- Label: ${title}`,
    valueLine ? `- Value line: ${valueLine}` : '- Value line: _add during refinement_',
    boundaryCue ? `- Boundary cue: ${boundaryCue}` : '- Boundary cue: _add during refinement_',
    '',
    '## Draft behaviors',
    '- As a user, I can …',
    '- As a user, I can …',
    '',
    '## Acceptance outline',
    '- Given … When … Then …',
    '',
    '_Template scaffold — replace placeholders with implementation-ready criteria._',
  ].join('\n');

  return { title, body };
}

export class GenerateUserStoryDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private corpusRepository: IUserStoryCorpusRepository,
    private draftGenerator: IUserStoryDraftGenerator
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: GenerateUserStoriesRequest
  ): Promise<Result<GenerateUserStoryDraftResult, ApplicationError>> {
    const clusterResult = await this.resolveCluster(projectId, userId, input.featureSplitClusterId);
    if (clusterResult.isErr()) return err(clusterResult.error);
    const cluster = clusterResult.unwrap();

    if (input.mode === 'template') {
      const { title, body } = buildTemplateDraft(cluster);
      const saveResult = await this.corpusRepository.save(projectId, input.featureSplitClusterId, [
        { sortOrder: 0, title, body },
      ]);
      if (saveResult.isErr()) return err(saveResult.error);
      return ok({ kind: 'corpus', corpus: saveResult.unwrap() });
    }

    if (input.aiStep === 'outline') {
      const outlinesResult = await this.draftGenerator.draftOutlines({
        label: cluster.label,
        valueLine: cluster.valueLine,
        boundaryCue: cluster.boundaryCue,
      });
      if (outlinesResult.isErr()) return err(outlinesResult.error);
      const outlines = outlinesResult.unwrap().outlines;
      logger.info('User story outlines ready', { count: outlines.length });
      return ok({ kind: 'outline', outlines, total: outlines.length });
    }

    const { outlines, outlineIndex, existingLines = [] } = input;
    if (outlineIndex >= outlines.length) {
      return err(new ValidationError('outlineIndex out of range'));
    }
    const selectedOutline = outlines[outlineIndex];
    if (!selectedOutline?.title) {
      return err(new ValidationError('outline title is required'));
    }

    const storyResult = await this.draftGenerator.draftSingleStory(
      {
        label: cluster.label,
        valueLine: cluster.valueLine,
        boundaryCue: cluster.boundaryCue,
      },
      { title: selectedOutline.title },
      outlineIndex
    );
    if (storyResult.isErr()) return err(storyResult.error);

    const story = storyResult.unwrap();
    const lines = [
      ...existingLines.map((line, i) => ({
        sortOrder: line.sortOrder ?? i,
        title: line.title,
        body: line.body,
      })),
      {
        sortOrder: story.sortOrder ?? outlineIndex,
        title: story.title,
        body: story.body,
      },
    ];

    const saveResult = await this.corpusRepository.save(
      projectId,
      input.featureSplitClusterId,
      lines
    );
    if (saveResult.isErr()) return err(saveResult.error);

    const total = outlines.length;
    const current = outlineIndex + 1;
    return ok({
      kind: 'story',
      corpus: saveResult.unwrap(),
      progress: { current, total, done: current >= total },
    });
  }

  private async resolveCluster(
    projectId: string,
    userId: string,
    featureSplitClusterId: string
  ): Promise<
    Result<{ label: string; valueLine: string; boundaryCue: string }, ApplicationError>
  > {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const clusterResult = await requireConfirmedClusterForUserStories(
      this.featureSplitRepository,
      projectId,
      featureSplitClusterId
    );
    if (clusterResult.isErr()) return err(clusterResult.error);
    return ok(clusterResult.unwrap());
  }
}
