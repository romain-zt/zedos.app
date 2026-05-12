import { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import type { FeatureClusterDomain } from '@domain/feature-split/feature-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';

/**
 * Ensures clusterId belongs to a confirmed feature split for the project.
 */
export async function requireConfirmedClusterForUserStories(
  featureSplitRepository: IFeatureSplitRepository,
  projectId: string,
  clusterId: string
): Promise<Result<FeatureClusterDomain, ApplicationError>> {
  const splitsResult = await featureSplitRepository.findByProjectId(projectId);
  if (splitsResult.isErr()) return err(splitsResult.error);

  for (const split of splitsResult.unwrap()) {
    if (split.status !== 'confirmed') continue;
    const cluster = split.clusters.find((c) => c.id === clusterId);
    if (cluster) return ok(cluster);
  }

  return err(new NotFoundError('Confirmed feature split cluster not found for this project'));
}
