/**
 * PRD Contracts
 *
 * Zod schemas for PRD version DTOs.
 */

import { z } from 'zod';

export const PrdVersionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNumber: z.number().int(),
  content: z.any().nullable(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  shareLinks: z.array(z.object({
    id: z.string(),
    token: z.string(),
    enabled: z.boolean(),
  })).optional(),
  questionHistoryCount: z.number().optional(),
});

export type PrdVersionDTO = z.infer<typeof PrdVersionDTOSchema>;

export const PrdVersionListResponseSchema = z.array(PrdVersionDTOSchema);

export type PrdVersionListResponse = z.infer<typeof PrdVersionListResponseSchema>;
