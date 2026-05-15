import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { IUserStoryDraftGenerator } from '@domain/user-stories/user-story-draft-generator';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { requireConfirmedClusterForUserStories } from './require-confirmed-cluster';

const logger = createLogger({ operation: 'GenerateUserStoryDraftUseCase' });

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
    featureSplitClusterId: string,
    mode: 'template' | 'ai'
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
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
    const cluster = clusterResult.unwrap();

    if (mode === 'template') {
      const { title, body } = buildTemplateDraft(cluster);
      return this.corpusRepository.save(projectId, featureSplitClusterId, [
        {
          sortOrder: 0,
          title,
          body,
        },
      ]);
    }

    const draftResult = await this.draftGenerator.draftFromCluster({
      label: cluster.label,
      valueLine: cluster.valueLine,
      boundaryCue: cluster.boundaryCue,
    });
    if (draftResult.isErr()) return err(draftResult.error);

    const stories = draftResult.unwrap().stories;
    const lines = stories.map((s, i) => ({
      sortOrder: s.sortOrder ?? i,
      title: s.title,
      body: s.body,
    }));

    return this.corpusRepository.save(projectId, featureSplitClusterId, lines);
  }
}
