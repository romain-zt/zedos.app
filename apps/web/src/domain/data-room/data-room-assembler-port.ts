/**
 * Assembler port for the data-room zip.
 *
 * Implementations live in `infrastructure/data-room/` and may write either zip bytes
 * (for HTTP streaming) or file lists (for testing).
 */

import type { DataRoomManifest } from '@repo/contracts/data-room';
import type { PrdVersion } from '@domain/prd/prd';
import type { Adr } from '@domain/adr/adr';
import type { Decision } from '@domain/decision-graph/decision';

export interface DataRoomBundleSources {
  projectId: string;
  projectName: string;
  prdVersion: PrdVersion | null;
  adrs: Adr[];
  decisions: Decision[];
  userStoryTitles: Array<{ corpusId: string; clusterLabel: string; title: string; sortOrder: number }>;
  shareLinks: Array<{
    id: string;
    enabled: boolean;
    createdAt: Date;
    expiresAt: Date | null;
    disabledAt: Date | null;
    prdVersionNumber: number;
  }>;
  expressFlags: Array<{ sectionId: string; reason: string }>;
}

export interface DataRoomBundleArtifact {
  zipBuffer: Buffer;
  manifest: DataRoomManifest;
  filename: string;
}

export interface IDataRoomAssembler {
  assemble(sources: DataRoomBundleSources): Promise<DataRoomBundleArtifact>;
}
