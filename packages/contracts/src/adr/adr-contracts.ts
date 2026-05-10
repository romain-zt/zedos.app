/**
 * ADR Contracts
 *
 * Zod schemas for ADR requests, responses, and DTOs.
 */

import { z } from 'zod';

export const AdrDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  adrNumber: z.number(),
  title: z.string(),
  content: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdrDTO = z.infer<typeof AdrDTOSchema>;

export const UpdateAdrRequestSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
});

export type UpdateAdrRequest = z.infer<typeof UpdateAdrRequestSchema>;

export const PhaseCheckResponseSchema = z.object({
  isStable: z.boolean(),
  message: z.string(),
  currentPhase: z.string(),
});

export type PhaseCheckResponse = z.infer<typeof PhaseCheckResponseSchema>;

export const PhaseUnlockResponseSchema = z.object({
  message: z.string(),
  phase: z.string(),
  architectureStartedAt: z.date().nullable(),
});

export type PhaseUnlockResponse = z.infer<typeof PhaseUnlockResponseSchema>;

export const ReadinessScoreResponseSchema = z.object({
  productClarity: z.object({ points: z.number(), weight: z.number(), percentage: z.number() }),
  architectureBoundaries: z.object({ points: z.number(), weight: z.number(), percentage: z.number() }),
  total: z.object({ points: z.number(), weight: z.number(), percentage: z.number() }),
  phase: z.string(),
  prdVersion: z.number(),
  adrCount: z.number(),
});

export type ReadinessScoreResponse = z.infer<typeof ReadinessScoreResponseSchema>;
