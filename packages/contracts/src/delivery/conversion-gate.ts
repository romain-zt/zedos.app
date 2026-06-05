/**
 * Conversion gate at first Cursor export attempt — schema for `GET /api/projects/:id/delivery/conversion-gate`
 * and the 402-shaped response shipped by `POST /api/projects/:id/delivery/export` when the gate triggers.
 */

import { z } from 'zod';
import { PlanTierSchema } from '../payments/subscription';

export const ConversionGateDecisionSchema = z.enum(['allow', 'soft-gate']);
export type ConversionGateDecision = z.infer<typeof ConversionGateDecisionSchema>;

export const ConversionGateResponseSchema = z.object({
  decision: ConversionGateDecisionSchema,
  planTier: PlanTierSchema,
  hasAttemptedExport: z.boolean(),
  upgradeUrl: z.string().nullable(),
});
export type ConversionGateResponse = z.infer<typeof ConversionGateResponseSchema>;

/**
 * Body returned with HTTP 402 when the gate blocks `POST /export` for a free-tier owner.
 */
export const ExportGatedErrorSchema = z.object({
  error: z.literal('export_gated'),
  decision: z.literal('soft-gate'),
  planTier: PlanTierSchema,
  hasAttemptedExport: z.boolean(),
  upgradeUrl: z.string(),
  message: z.string(),
});
export type ExportGatedError = z.infer<typeof ExportGatedErrorSchema>;
