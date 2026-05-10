/**
 * Stripe Checkout Contracts
 *
 * Zod schemas for checkout session request/response.
 */

import { z } from 'zod';

export const CreateCheckoutSessionRequestSchema = z.object({
  packId: z.string().min(1),
});

export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

export const CheckoutSessionResponseSchema = z.object({
  url: z.string().url(),
});

export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;

export const VerifySessionRequestSchema = z.object({
  sessionId: z.string().min(1),
});

export type VerifySessionRequest = z.infer<typeof VerifySessionRequestSchema>;

export const VerifySessionResponseSchema = z.object({
  status: z.enum(['processing', 'completed', 'failed']),
  balance: z.number().optional(),
});

export type VerifySessionResponse = z.infer<typeof VerifySessionResponseSchema>;
