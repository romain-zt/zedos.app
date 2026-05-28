/**
 * Stripe Webhook Contracts
 *
 * Zod schemas for inbound Stripe webhook event shapes.
 * These are derived from Stripe's published API reference docs.
 */

import { z } from 'zod';

export const CheckoutSessionCompletedEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.literal('checkout.session.completed'),
  livemode: z.boolean(),
  created: z.number(),
  data: z.object({
    object: z.object({
      id: z.string(),
      object: z.literal('checkout.session'),
      payment_status: z.enum(['paid', 'unpaid', 'no_payment_required']),
      status: z.enum(['complete', 'expired', 'open']),
      metadata: z.object({
        userId: z.string(),
        purchaseId: z.string(),
        packSize: z.string(),
      }),
      payment_intent: z.string().nullable().optional(),
      amount_total: z.number().nullable().optional(),
      currency: z.string().nullable().optional(),
      customer: z.string().nullable().optional(),
    }),
  }),
});

export type CheckoutSessionCompletedEvent = z.infer<typeof CheckoutSessionCompletedEventSchema>;

export const PaymentIntentSucceededEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.literal('payment_intent.succeeded'),
  livemode: z.boolean(),
  created: z.number(),
  data: z.object({
    object: z.object({
      id: z.string(),
      object: z.literal('payment_intent'),
      status: z.literal('succeeded'),
      amount: z.number(),
      currency: z.string(),
      metadata: z.object({
        purchaseId: z.string(),
      }).passthrough(),
      customer: z.string().nullable().optional(),
    }),
  }),
});

export type PaymentIntentSucceededEvent = z.infer<typeof PaymentIntentSucceededEventSchema>;

export const WebhookEventEnvelopeSchema = z.discriminatedUnion('type', [
  CheckoutSessionCompletedEventSchema,
  PaymentIntentSucceededEventSchema,
]);

export type WebhookEventEnvelope = z.infer<typeof WebhookEventEnvelopeSchema>;
