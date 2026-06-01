/**
 * Auto-reload preference contracts (v0).
 */

import { z } from 'zod';

export const AutoReloadPackSizeSchema = z.union([
  z.literal(100),
  z.literal(200),
  z.literal(1000),
]);

export type AutoReloadPackSize = z.infer<typeof AutoReloadPackSizeSchema>;

export const AutoReloadPreferenceDTOSchema = z.object({
  enabled: z.boolean(),
  packSize: AutoReloadPackSizeSchema,
  thresholdCredits: z.number().int().min(0),
  hasSavedPaymentMethod: z.boolean(),
});

export type AutoReloadPreferenceDTO = z.infer<typeof AutoReloadPreferenceDTOSchema>;

export const UpdateAutoReloadPreferenceRequestSchema = z.object({
  enabled: z.boolean(),
  packSize: AutoReloadPackSizeSchema.optional(),
});

export type UpdateAutoReloadPreferenceRequest = z.infer<
  typeof UpdateAutoReloadPreferenceRequestSchema
>;

export const AutoReloadAttemptOutcomeSchema = z.enum([
  'succeeded',
  'declined',
  'authentication_required',
  'not_configured',
  'skipped',
]);

export type AutoReloadAttemptOutcome = z.infer<typeof AutoReloadAttemptOutcomeSchema>;
