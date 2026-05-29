/**
 * Stripe test helpers — sign fake webhook payloads with a test secret.
 * Used in integration tests for the webhook route.
 */

import crypto from 'crypto';
import {
  CheckoutSessionCompletedEventSchema,
  type CheckoutSessionCompletedEvent,
} from '@repo/contracts/payments';

const TEST_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_placeholder';

/**
 * Generate a Stripe webhook signature header for a given payload.
 * Mimics the stripe.webhooks.generateTestHeaderString behavior.
 */
export function generateStripeSignature(
  payload: string,
  secret: string = TEST_WEBHOOK_SECRET
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret.replace('whsec_', ''))
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Build a minimal checkout.session.completed event for testing.
 */
export function buildCheckoutSessionCompletedEvent(overrides?: {
  eventId?: string;
  sessionId?: string;
  userId?: string;
  purchaseId?: string;
  packSize?: number;
}): CheckoutSessionCompletedEvent {
  return CheckoutSessionCompletedEventSchema.parse({
    id: overrides?.eventId ?? 'evt_test_001',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: overrides?.sessionId ?? 'cs_test_001',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        metadata: {
          userId: overrides?.userId ?? 'user_test_001',
          purchaseId: overrides?.purchaseId ?? 'purchase_test_001',
          packSize: String(overrides?.packSize ?? 100),
        },
        payment_intent: 'pi_test_001',
        amount_total: 900,
        currency: 'eur',
      },
    },
  });
}
