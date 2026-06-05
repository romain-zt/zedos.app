import { IProjectRepository } from '@domain/project/project-repository';
import { IPrdRepository } from '@domain/prd/prd-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { FeatureSplitDomain, NewFeatureClusterInput } from '@domain/feature-split/feature-split';
import { Result, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SaveFeatureSplitDraftUseCase' });

export interface SaveFeatureSplitDraftInput {
  projectId: string;
  userId: string;
  sourcePrdVersionId: string;
  clusters: NewFeatureClusterInput[];
}

export class SaveFeatureSplitDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private featureSplitRepository: IFeatureSplitRepository
  ) {}

  async execute(
    input: SaveFeatureSplitDraftInput
  ): Promise<Result<FeatureSplitDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId
    );
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', {
        projectId: input.projectId,
        userId: input.userId,
      });
      return err(projectResult.error);
    }

    const versionResult = await this.prdRepository.findVersionByIdForOwner(
      input.sourcePrdVersionId,
      input.userId
    );
    if (versionResult.isErr()) return err(versionResult.error);
    const version = versionResult.unwrap();
    if (!version) return err(new NotFoundError('PRD version not found'));
    if (version.projectId !== input.projectId) return err(new NotFoundError('PRD version not found'));

    return this.featureSplitRepository.saveDraft(
      input.projectId,
      input.sourcePrdVersionId,
      input.clusters
    );
  }
}
