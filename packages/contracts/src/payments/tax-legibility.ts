/**
 * Tax / VAT legibility for credit pack checkout (v0).
 */

import { z } from 'zod';

export const CheckoutTaxLegibilitySchema = z.object({
  subtotalCents: z.number().int().nonnegative().nullable(),
  taxCents: z.number().int().nonnegative().nullable(),
  totalCents: z.number().int().nonnegative().nullable(),
  currency: z.string().min(3).max(3),
  productClassification: z.literal('digital_ai_credits'),
  taxLabel: z.string().min(1),
});

export type CheckoutTaxLegibility = z.infer<typeof CheckoutTaxLegibilitySchema>;

export const CreditPacksResponseSchema = z.object({
  packs: z.array(
    z.object({
      id: z.string(),
      size: z.number().int().positive(),
      priceEur: z.number().int().positive(),
      label: z.string(),
      description: z.string(),
    })
  ),
  costs: z.record(z.string(), z.number()),
  taxDisclaimer: z.string(),
  automaticTaxEnabled: z.boolean(),
});

export type CreditPacksResponse = z.infer<typeof CreditPacksResponseSchema>;

export const VerifyCheckoutResultSchema = z.object({
  balance: z.number().int(),
  creditsAdded: z.number().int().positive().optional(),
  alreadyProcessed: z.boolean().optional(),
  taxLegibility: CheckoutTaxLegibilitySchema.optional(),
});

export type VerifyCheckoutResult = z.infer<typeof VerifyCheckoutResultSchema>;
