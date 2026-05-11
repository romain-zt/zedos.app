/**
 * PRD Contracts
 *
 * Zod schemas for PRD version DTOs.
 */

import { z } from 'zod';

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
    content: z.record(z.unknown()).nullable(),
    status: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }),
});

export type CapturedPrdVersionResponse = z.infer<typeof CapturedPrdVersionResponseSchema>;

export const PrdVersionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNumber: z.number(),
  content: z.any().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  shareLinks: z.array(z.object({
    id: z.string(),
    token: z.string(),
    enabled: z.boolean(),
  })).optional(),
  questionHistoryCount: z.number().optional(),
});

export type PrdVersionDTO = z.infer<typeof PrdVersionDTOSchema>;
