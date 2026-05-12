import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { FeatureSplitDomain } from '@domain/feature-split/feature-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'GetFeatureSplitUseCase' });

export class GetFeatureSplitUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    sourcePrdVersionId?: string
  ): Promise<Result<FeatureSplitDomain[], ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    if (sourcePrdVersionId) {
      const splitResult = await this.featureSplitRepository.findByProjectAndPrdVersion(
        projectId,
        sourcePrdVersionId
      );
      if (splitResult.isErr()) return err(splitResult.error);
      const split = splitResult.unwrap();
      return ok(split ? [split] : []);
    }

    return this.featureSplitRepository.findByProjectId(projectId);
  }
}
