/**
 * Stripe webhook signature verification (vendor-isolated).
 */

import { WebhookEventEnvelopeSchema } from '@repo/contracts/payments/webhook';
import { Result, ok, err } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';
import Stripe from 'stripe';

export type ParsedStripeWebhook = Result<
  ReturnType<typeof WebhookEventEnvelopeSchema.parse>,
  ExternalServiceError
>;

export function verifyStripeWebhookAndParseEnvelope(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string | undefined
): ParsedStripeWebhook {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return err(new ExternalServiceError('stripe', 'Stripe is not configured', 503));
  }
  if (!webhookSecret) {
    return err(new ExternalServiceError('stripe', 'Webhook signing secret is not configured', 503));
  }
  if (!signatureHeader) {
    return err(new ExternalServiceError('stripe', 'Missing Stripe-Signature header', 400));
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: Stripe.API_VERSION,
    });
    const constructed = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
    const parsed = WebhookEventEnvelopeSchema.safeParse(constructed);
    if (!parsed.success) {
      return err(
        new ExternalServiceError(
          'stripe',
          `Webhook payload failed contract validation: ${parsed.error.message}`,
          400
        )
      );
    }
    return ok(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Webhook verification failed';
    return err(new ExternalServiceError('stripe', msg, 400));
  }
}
