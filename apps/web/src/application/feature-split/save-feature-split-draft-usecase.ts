import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { FeatureSplitDomain, NewFeatureClusterInput } from '@domain/feature-split/feature-split';
import type { FeatureClusterDraftInput } from '@repo/contracts/feature-split/feature-split';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'SaveFeatureSplitDraftUseCase' });

function toDomainClusters(clusters: FeatureClusterDraftInput[]): NewFeatureClusterInput[] {
  return clusters.map((c) => ({
    sortOrder: c.sortOrder,
    label: c.label,
    valueLine: c.valueLine,
    boundaryCue: c.boundaryCue,
  }));
}

export interface SaveFeatureSplitDraftInput {
  projectId: string;
  userId: string;
  sourcePrdVersionId: string;
  clusters: FeatureClusterDraftInput[];
}

export class SaveFeatureSplitDraftUseCase {
  constructor(
    private projectRepository: IProjectRepository,
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

    return this.featureSplitRepository.saveDraft(
      input.projectId,
      input.sourcePrdVersionId,
      toDomainClusters(input.clusters)
    );
  }
}
