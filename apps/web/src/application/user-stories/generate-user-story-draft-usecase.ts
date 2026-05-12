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
      const body = [cluster.valueLine, cluster.boundaryCue].filter(Boolean).join('\n\n');
      return this.corpusRepository.save(projectId, featureSplitClusterId, [
        {
          sortOrder: 0,
          title: cluster.label,
          body: body.length > 0 ? body : cluster.label,
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
