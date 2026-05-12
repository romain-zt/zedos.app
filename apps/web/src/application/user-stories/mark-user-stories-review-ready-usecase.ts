import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'MarkUserStoriesReviewReadyUseCase' });

function resolveConfirmedCluster(
  projectId: string,
  featureSplitClusterId: string,
  splits: Awaited<ReturnType<IFeatureSplitRepository['findByProjectId']>>
): boolean {
  if (splits.isErr()) return false;
  const list = splits.unwrap();
  for (const split of list) {
    if (split.projectId !== projectId) continue;
    if (split.status !== 'confirmed') continue;
    if (split.clusters.some((c) => c.id === featureSplitClusterId)) return true;
  }
  return false;
}

export class MarkUserStoriesReviewReadyUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository
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

    const splitsResult = await this.featureSplitRepository.findByProjectId(projectId);
    if (!resolveConfirmedCluster(projectId, featureSplitClusterId, splitsResult)) {
      return err(new NotFoundError('Confirmed feature split cluster not found for this project'));
    }

    return this.userStoryCorpusRepository.markReviewReady(projectId, featureSplitClusterId);
  }
}
