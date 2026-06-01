/**
 * PRD Contracts
 *
 * Zod schemas for PRD version DTOs.
 */

import { z } from 'zod';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';
import { ShareLinkSummarySchema } from '../share/mint';

/** Intake-era PRD body: section slug → text (pre–AI-generated shape). */
export const IntakePrdContentSchema = z.record(z.string());

/** Legacy v1 draft placeholder (source/summary + empty sections array) persisted before intake default. */
export const LegacyDraftPlaceholderPrdContentSchema = z.object({
  source: z.string(),
  summary: z.string(),
  sections: z.array(z.unknown()).optional(),
});

/** Stored PRD JSON: AI-generated structure, intake map, or legacy draft placeholder. */
export const PrdVersionContentSchema = z.union([
  GeneratePrdAiResponseSchema,
  IntakePrdContentSchema,
  LegacyDraftPlaceholderPrdContentSchema,
]);

export type PrdVersionContent = z.infer<typeof PrdVersionContentSchema>;

/** Optional body when capturing the first in-project PRD version (v1 draft). */
export const CreateOrCapturePrdVersionRequestSchema = z.object({
  content: PrdVersionContentSchema.optional(),
});

export type CreateOrCapturePrdVersionRequest = z.infer<typeof CreateOrCapturePrdVersionRequestSchema>;

export const CapturedPrdVersionResponseSchema = z.object({
  created: z.boolean(),
  version: z.object({
    id: z.string(),
    projectId: z.string(),
    versionNumber: z.number().int().positive(),
    content: PrdVersionContentSchema.nullable(),
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
  content: PrdVersionContentSchema.nullable(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  shareLinks: z.array(ShareLinkSummarySchema).optional(),
  questionHistoryCount: z.coerce.number().optional(),
});

export type PrdVersionDTO = z.infer<typeof PrdVersionDTOSchema>;

/** GET /api/projects/:id/prd — ordered newest-first in the use case / repository. */
export const PrdVersionListResponseSchema = z.array(PrdVersionDTOSchema);

export type PrdVersionListResponse = z.infer<typeof PrdVersionListResponseSchema>;
