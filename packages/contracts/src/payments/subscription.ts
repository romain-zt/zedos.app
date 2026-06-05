/**
 * Builder Monthly subscription contracts.
 *
 * Re-uses the existing checkout naming convention from `./checkout.ts` and
 * `./webhook.ts` but is distinct because subscription mode mutates plan tier,
 * not credit ledger.
 */

import { z } from 'zod';
import { IdSchema } from '../shared/common';

export const PlanTierSchema = z.enum(['free', 'builder', 'pro', 'team']);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const SubscriptionStatusSchema = z.enum([
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const CreateSubscriptionCheckoutRequestSchema = z.object({
  planTier: PlanTierSchema.refine((t) => t === 'builder', {
    message: 'Only Builder Monthly is purchasable via self-serve checkout in v1',
  }),
});
export type CreateSubscriptionCheckoutRequest = z.infer<
  typeof CreateSubscriptionCheckoutRequestSchema
>;

export const SubscriptionCheckoutResponseSchema = z.object({
  url: z.string().url(),
});
export type SubscriptionCheckoutResponse = z.infer<typeof SubscriptionCheckoutResponseSchema>;

export const CustomerPortalResponseSchema = z.object({
  url: z.string().url(),
});
export type CustomerPortalResponse = z.infer<typeof CustomerPortalResponseSchema>;

export const BillingSubscriptionDTOSchema = z.object({
  id: IdSchema.nullable(),
  planTier: PlanTierSchema,
  status: SubscriptionStatusSchema.nullable(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.string().nullable(),
  priceLabel: z.string().nullable(),
});
export type BillingSubscriptionDTO = z.infer<typeof BillingSubscriptionDTOSchema>;

/**
 * Stripe subscription lifecycle webhook events we accept (validated separately from pack flow).
 *
 * Stripe does not actually emit a top-level `livemode` boolean on every event payload in every
 * mode, but our verifier already strips noise, so we model the minimal subset we read.
 */
export const SubscriptionWebhookObjectSchema = z.object({
  id: z.string(),
  object: z.literal('subscription'),
  status: SubscriptionStatusSchema,
  cancel_at_period_end: z.boolean(),
  current_period_end: z.number().int().nullable().optional(),
  customer: z.string(),
  items: z.object({
    data: z.array(
      z.object({
        price: z.object({
          id: z.string(),
        }),
      }),
    ),
  }),
  metadata: z
    .object({
      userId: z.string().optional(),
      planTier: PlanTierSchema.optional(),
    })
    .passthrough()
    .optional(),
  ended_at: z.number().int().nullable().optional(),
});
export type SubscriptionWebhookObject = z.infer<typeof SubscriptionWebhookObjectSchema>;

export const SubscriptionWebhookEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.enum([
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ]),
  data: z.object({
    object: SubscriptionWebhookObjectSchema,
  }),
});
export type SubscriptionWebhookEvent = z.infer<typeof SubscriptionWebhookEventSchema>;
