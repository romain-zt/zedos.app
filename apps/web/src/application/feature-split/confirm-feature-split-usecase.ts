import { IProjectRepository } from '@domain/project/project-repository';
import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { FeatureSplitDomain } from '@domain/feature-split/feature-split';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ConfirmFeatureSplitUseCase' });

export class ConfirmFeatureSplitUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private featureSplitRepository: IFeatureSplitRepository
  ) {}

  async execute(
    featureSplitId: string,
    projectId: string,
    userId: string
  ): Promise<Result<FeatureSplitDomain, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      logger.warn('Project not found or unauthorized', { projectId, userId });
      return err(projectResult.error);
    }

    const splitResult = await this.featureSplitRepository.findById(featureSplitId);
    if (splitResult.isErr()) return err(splitResult.error);

    const split = splitResult.unwrap();
    if (!split) return err(new NotFoundError('Feature split not found'));
    if (split.projectId !== projectId) return err(new NotFoundError('Feature split not found'));

    if (split.clusters.length === 0) {
      return err(new ValidationError('Cannot confirm a feature split with no clusters'));
    }

    // Idempotent: already confirmed
    if (split.status === 'confirmed') return ok(split);

    return this.featureSplitRepository.confirm(featureSplitId);
  }
}
