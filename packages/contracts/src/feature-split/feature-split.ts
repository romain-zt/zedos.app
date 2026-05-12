/**
 * Feature split HTTP DTOs — clusters, split aggregate, list/query, save draft, confirm.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

/** Persisted cluster row returned to clients. */
export const FeatureClusterSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  label: z.string().min(1).max(500),
  valueLine: z.string().min(1).max(2000),
  boundaryCue: z.string().min(1).max(2000),
});

export type FeatureCluster = z.infer<typeof FeatureClusterSchema>;

/** Cluster shape for PUT draft (full replace; ids assigned server-side). */
export const FeatureClusterDraftInputSchema = z.object({
  sortOrder: z.number().int().nonnegative(),
  label: z.string().min(1).max(500),
  valueLine: z.string().min(1).max(2000),
  boundaryCue: z.string().min(1).max(2000),
});

export type FeatureClusterDraftInput = z.infer<typeof FeatureClusterDraftInputSchema>;

const FeatureSplitBaseSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  sourcePrdVersionId: IdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  clusters: z.array(FeatureClusterSchema),
});

export const FeatureSplitDraftSchema = FeatureSplitBaseSchema.extend({
  status: z.literal('draft'),
});

export type FeatureSplitDraft = z.infer<typeof FeatureSplitDraftSchema>;

export const FeatureSplitConfirmedSchema = FeatureSplitBaseSchema.extend({
  status: z.literal('confirmed'),
});

export type FeatureSplitConfirmed = z.infer<typeof FeatureSplitConfirmedSchema>;

export const FeatureSplitDTOSchema = z.discriminatedUnion('status', [
  FeatureSplitDraftSchema,
  FeatureSplitConfirmedSchema,
]);

export type FeatureSplitDTO = z.infer<typeof FeatureSplitDTOSchema>;

/** GET /api/projects/:id/feature-split — all splits for the project or filtered in the handler. */
export const FeatureSplitListResponseSchema = z.array(FeatureSplitDTOSchema);

export type FeatureSplitListResponse = z.infer<typeof FeatureSplitListResponseSchema>;

/** Optional query filter by source PRD version id (URL/searchParams). */
export const GetFeatureSplitsQuerySchema = z.object({
  sourcePrdVersionId: IdSchema.optional(),
});

export type GetFeatureSplitsQuery = z.infer<typeof GetFeatureSplitsQuerySchema>;

export const SaveFeatureSplitDraftRequestSchema = z.object({
  sourcePrdVersionId: IdSchema,
  clusters: z.array(FeatureClusterDraftInputSchema).min(1).max(32),
});

export type SaveFeatureSplitDraftRequest = z.infer<typeof SaveFeatureSplitDraftRequestSchema>;

export const ConfirmFeatureSplitRequestSchema = z.object({
  featureSplitId: IdSchema,
});

export type ConfirmFeatureSplitRequest = z.infer<typeof ConfirmFeatureSplitRequestSchema>;
