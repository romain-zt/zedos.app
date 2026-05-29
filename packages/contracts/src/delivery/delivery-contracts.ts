/**
 * Delivery export HTTP DTOs — eligible bundles, preview, export request.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const ExportEligibleBundleSchema = z.object({
  id: IdSchema,
  storyTitle: z.string(),
  taskCount: z.number().int().nonnegative(),
  lockedAt: z.coerce.date(),
});

export type ExportEligibleBundleDTO = z.infer<typeof ExportEligibleBundleSchema>;

export const ExportEligibleListResponseSchema = z.object({
  bundles: z.array(ExportEligibleBundleSchema),
});

export type ExportEligibleListResponse = z.infer<typeof ExportEligibleListResponseSchema>;

export const DeliveryPreviewRequestSchema = z.object({
  bundleIds: z.array(IdSchema).min(1).max(50),
});

export type DeliveryPreviewRequest = z.infer<typeof DeliveryPreviewRequestSchema>;

export const DeliveryPreviewTaskSchema = z.object({
  id: IdSchema,
  sortOrder: z.number().int().nonnegative(),
  title: z.string(),
  promptExcerpt: z.string().max(500),
});

export type DeliveryPreviewTaskDTO = z.infer<typeof DeliveryPreviewTaskSchema>;

export const DeliveryPreviewStorySchema = z.object({
  bundleId: IdSchema,
  storyTitle: z.string(),
  tasks: z.array(DeliveryPreviewTaskSchema),
});

export type DeliveryPreviewStoryDTO = z.infer<typeof DeliveryPreviewStorySchema>;

export const DeliveryPreviewResponseSchema = z.object({
  stories: z.array(DeliveryPreviewStorySchema),
});

export type DeliveryPreviewResponse = z.infer<typeof DeliveryPreviewResponseSchema>;

export const DeliveryExportRequestSchema = DeliveryPreviewRequestSchema;

export type DeliveryExportRequest = z.infer<typeof DeliveryExportRequestSchema>;
