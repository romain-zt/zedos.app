/**
 * Locate a feature-split cluster under a confirmed split for the project.
 */

import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import {
  FeatureClusterDomain,
  FeatureSplitDomain,
} from '@domain/feature-split/feature-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';

export async function findConfirmedClusterForProject(
  featureSplitRepository: IFeatureSplitRepository,
  projectId: string,
  featureSplitClusterId: string
): Promise<Result<FeatureClusterDomain, ApplicationError>> {
  const splitsResult = await featureSplitRepository.findByProjectId(projectId);
  if (splitsResult.isErr()) {
    return err(splitsResult.error);
  }

  const splits = splitsResult.unwrap();
  const confirmed = splits.filter((s: FeatureSplitDomain) => s.status === 'confirmed');
  const cluster = confirmed
    .flatMap((s: FeatureSplitDomain) => s.clusters)
    .find((c: FeatureClusterDomain) => c.id === featureSplitClusterId);

  if (!cluster) {
    return err(
      new ValidationError(
        'Feature split cluster not found or not confirmed for this project'
      )
    );
  }

  return ok(cluster);
}
