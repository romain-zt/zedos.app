/**
 * Team data-room bundle contracts.
 *
 * Backed by `data_room_bundles` audit table. The zip itself is streamed, not stored.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const DataRoomBundleRequestSchema = z.object({
  /** Optional override; defaults to "latest" PRD version on the project. */
  prdVersionId: IdSchema.optional(),
});
export type DataRoomBundleRequest = z.infer<typeof DataRoomBundleRequestSchema>;

export const DataRoomManifestEntrySchema = z.object({
  path: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  contentType: z.string().min(1),
});
export type DataRoomManifestEntry = z.infer<typeof DataRoomManifestEntrySchema>;

export const DataRoomManifestSchema = z.object({
  projectId: IdSchema,
  generatedAt: z.string().min(1),
  fileCount: z.number().int().nonnegative(),
  totalByteSize: z.number().int().nonnegative(),
  files: z.array(DataRoomManifestEntrySchema),
  warnings: z.array(z.string()).default([]),
});
export type DataRoomManifest = z.infer<typeof DataRoomManifestSchema>;
