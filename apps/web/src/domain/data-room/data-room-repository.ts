/**
 * Data room bundle audit repository port.
 */

import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { DataRoomManifest } from '@repo/contracts/data-room';
import type { DataRoomBundle } from './bundle';

export interface RecordDataRoomBundleInput {
  projectId: string;
  generatedByUserId: string;
  manifest: DataRoomManifest;
}

export interface IDataRoomRepository {
  recordBundle(input: RecordDataRoomBundleInput): Promise<Result<DataRoomBundle, ApplicationError>>;
}
