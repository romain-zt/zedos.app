/**
 * Feature Split Repository Port
 */

import { Result } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { FeatureSplitDomain, NewFeatureClusterInput } from './feature-split';

export interface IFeatureSplitRepository {
  findByProjectId(projectId: string): Promise<Result<FeatureSplitDomain[], ApplicationError>>;
  findByProjectAndPrdVersion(
    projectId: string,
    sourcePrdVersionId: string
  ): Promise<Result<FeatureSplitDomain | null, ApplicationError>>;
  findById(id: string): Promise<Result<FeatureSplitDomain | null, ApplicationError>>;
  /**
   * Upsert split header + full cluster replace in a single transaction.
   * Creates the split row if missing; replaces all clusters.
   */
  saveDraft(
    projectId: string,
    sourcePrdVersionId: string,
    clusters: NewFeatureClusterInput[]
  ): Promise<Result<FeatureSplitDomain, ApplicationError>>;
  confirm(id: string): Promise<Result<FeatureSplitDomain, ApplicationError>>;
}
