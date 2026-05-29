import { IProjectRepository } from '@domain/project/project-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GetUserStoryCorpusUseCase' });

export class GetUserStoryCorpusUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private corpusRepository: IUserStoryCorpusRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    return this.corpusRepository.findByProjectAndCluster(projectId, featureSplitClusterId);
  }
}
