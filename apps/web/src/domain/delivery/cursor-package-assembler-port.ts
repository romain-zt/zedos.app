import type { DecisionsExportJson } from '@repo/contracts/decisions/decision';
import type { ExportEligibleBundle } from './export-bundle';

export interface ICursorPackageAssembler {
  assembleZip(
    bundles: ExportEligibleBundle[],
    decisionsExport?: DecisionsExportJson,
  ): Promise<Buffer>;
}
