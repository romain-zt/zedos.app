import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { requireConfirmedClusterForUserStories } from './require-confirmed-cluster';

const logger = createLogger({ operation: 'MarkUserStoriesReviewReadyUseCase' });

export class MarkUserStoriesReviewReadyUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private corpusRepository: IUserStoryCorpusRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    featureSplitClusterId: string
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

    return this.corpusRepository.markReviewReady(projectId, featureSplitClusterId);
  }
}
