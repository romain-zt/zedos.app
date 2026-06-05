/**
 * Data room bundle value object — captures what was packed for an audit row.
 */

import type { DataRoomManifest } from '@repo/contracts/data-room';

export interface DataRoomBundle {
  id: string;
  projectId: string;
  generatedByUserId: string;
  fileCount: number;
  byteSize: number;
  manifest: DataRoomManifest;
  createdAt: Date;
}
