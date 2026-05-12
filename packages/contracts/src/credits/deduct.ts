/**
 * Credit Deduction Contracts
 *
 * Zod schemas for deduct credits request/response, including correlationId for idempotency.
 */

import { z } from 'zod';

export const DeductCreditsRequestSchema = z.object({
  userId: z.string().min(1),
  operationType: z.enum([
    'clarification',
    'decision',
    'mini_form',
    'prd_generation',
    'prd_challenge',
    'story_generation',
  ]),
  correlationId: z.string().min(1),
});

export type DeductCreditsRequest = z.infer<typeof DeductCreditsRequestSchema>;

export const DeductCreditsResponseSchema = z.object({
  userId: z.string(),
  newBalance: z.number(),
  graceActivated: z.boolean(),
  correlationId: z.string(),
  idempotent: z.boolean().optional(),
});

export type DeductCreditsResponse = z.infer<typeof DeductCreditsResponseSchema>;
