/**
 * Pure conversion-gate evaluator for the Cursor export.
 *
 * Per `delivery--export-cursor-conversion-gate`:
 *   - Builders / Pro / Team always pass.
 *   - Free tier: soft gate on first attempt; repeat-visit defaults to a lighter nudge
 *     (still 'soft-gate' decision today; UI uses `hasAttemptedExport` to lower friction).
 *
 * Free tier hits a 402 with an `ExportGatedError` shape — soft gate, not a hard refusal.
 * The route still allows the existing preview endpoint to render without gate.
 */

import type { PlanTier } from '@repo/contracts/payments';
import { planTierMeets } from '@domain/subscription/subscription';

export type ConversionGateDecision = 'allow' | 'soft-gate';

export interface ConversionGateInput {
  planTier: PlanTier;
  hasAttemptedExport: boolean;
}

export interface ConversionGateResult {
  decision: ConversionGateDecision;
  planTier: PlanTier;
  hasAttemptedExport: boolean;
}

export function evaluateExportConversionGate(input: ConversionGateInput): ConversionGateResult {
  const meetsBuilder = planTierMeets(input.planTier, 'builder');
  return {
    decision: meetsBuilder ? 'allow' : 'soft-gate',
    planTier: input.planTier,
    hasAttemptedExport: input.hasAttemptedExport,
  };
}
