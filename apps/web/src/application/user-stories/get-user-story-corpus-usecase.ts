import { IProjectRepository } from '@domain/project/project-repository';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import { UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GetUserStoryCorpusUseCase' });

export class GetUserStoryCorpusUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private userStoryCorpusRepository: IUserStoryCorpusRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>> {
    const access = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (access.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(access.error);
    }

    return this.userStoryCorpusRepository.findByProjectAndCluster(
      projectId,
      featureSplitClusterId
    );
  }
}
