/**
 * PRD Contracts
 *
 * Zod schemas for PRD version DTOs.
 */

import { z } from 'zod';
import { ShareLinkSummarySchema } from '../share/mint';

/** Optional body when capturing the first in-project PRD version (v1 draft). */
export const CreateOrCapturePrdVersionRequestSchema = z.object({
  content: z.record(z.unknown()).optional(),
});

export type CreateOrCapturePrdVersionRequest = z.infer<typeof CreateOrCapturePrdVersionRequestSchema>;

export const CapturedPrdVersionResponseSchema = z.object({
  created: z.boolean(),
  version: z.object({
    id: z.string(),
    projectId: z.string(),
    versionNumber: z.number().int().positive(),
    content: z.any().nullable(),
    status: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

export type CapturedPrdVersionResponse = z.infer<typeof CapturedPrdVersionResponseSchema>;

export const PrdVersionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNumber: z.number().int(),
  content: z.any().nullable(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  shareLinks: z.array(ShareLinkSummarySchema).optional(),
  questionHistoryCount: z.number().optional(),
});

export type PrdVersionDTO = z.infer<typeof PrdVersionDTOSchema>;

/** GET /api/projects/:id/prd — ordered newest-first in the use case / repository. */
export const PrdVersionListResponseSchema = z.array(PrdVersionDTOSchema);

export type PrdVersionListResponse = z.infer<typeof PrdVersionListResponseSchema>;
