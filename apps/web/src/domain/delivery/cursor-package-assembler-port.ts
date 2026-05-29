import type { ExportEligibleBundle } from './export-bundle';
import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

export interface ICursorPackageAssembler {
  assembleZip(bundles: ExportEligibleBundle[]): Promise<Result<Buffer, ApplicationError>>;
}
