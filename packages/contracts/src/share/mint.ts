/**
 * Share link mint (read-only PRD) — request/response contracts for POST /api/share/create
 */

import { z } from 'zod';

/** Embeds in PrdVersionDTO.shareLinks — active link summaries from list endpoint */
export const ShareLinkSummarySchema = z.object({
  id: z.string(),
  token: z.string(),
  enabled: z.boolean(),
});

export type ShareLinkSummary = z.infer<typeof ShareLinkSummarySchema>;

export const CreateShareLinkRequestSchema = z.object({
  prdVersionId: z.string().min(1, 'PRD version ID is required'),
  password: z.string().min(8).max(128).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkRequestSchema>;

/** Full row returned when minting or reusing an existing active link */
export const ShareLinkMintResponseSchema = z.object({
  id: z.string(),
  prdVersionId: z.string(),
  token: z.string(),
  enabled: z.boolean(),
  hasPassword: z.boolean(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  disabledAt: z.coerce.date().nullable(),
});

export type ShareLinkMintResponse = z.infer<typeof ShareLinkMintResponseSchema>;
