import type { ExportEligibleBundle } from './export-bundle';

export interface ICursorPackageAssembler {
  assembleZip(bundles: ExportEligibleBundle[]): Promise<Buffer>;
}
