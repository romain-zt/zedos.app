/**
 * PRD Contracts
 *
 * Zod schemas for PRD version DTOs.
 */

import { z } from 'zod';

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
