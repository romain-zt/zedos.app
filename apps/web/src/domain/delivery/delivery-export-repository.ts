import type { ExportEligibleBundle } from './export-bundle';
import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export interface IDeliveryExportRepository {
  listLockedBundlesByProject(projectId: string): Promise<Result<ExportEligibleBundle[], ApplicationError>>;

  findLockedBundlesByIds(
    projectId: string,
    bundleIds: string[]
  ): Promise<Result<ExportEligibleBundle[], ApplicationError>>;
}
