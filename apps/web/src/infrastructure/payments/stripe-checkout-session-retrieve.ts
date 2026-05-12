/**
 * Retrieve and validate Stripe Checkout sessions for the verify flow (vendor-isolated).
 */

import {
  type CheckoutSessionStripeVerify,
  CheckoutSessionStripeVerifySchema,
} from '@repo/contracts/payments/checkout';
import { Result, ok, err } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';
import Stripe from 'stripe';

function paymentIntentIdFromSession(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (pi === null || pi === undefined) return null;
  if (typeof pi === 'string') return pi;
  if (typeof pi === 'object' && pi !== null && 'id' in pi && typeof (pi as Stripe.PaymentIntent).id === 'string') {
    return (pi as Stripe.PaymentIntent).id;
  }
  return null;
}

export async function retrieveCheckoutSessionForStripeVerify(
  sessionId: string
): Promise<Result<CheckoutSessionStripeVerify, ExternalServiceError>> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return err(new ExternalServiceError('stripe', 'Stripe is not configured', 503));
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: Stripe.API_VERSION,
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata ?? undefined;
    const candidate = {
      payment_status: session.payment_status,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
      paymentIntentId: paymentIntentIdFromSession(session),
    };
    const parsed = CheckoutSessionStripeVerifySchema.safeParse(candidate);
    if (!parsed.success) {
      return err(
        new ExternalServiceError(
          'stripe',
          `Checkout session failed contract validation: ${parsed.error.message}`,
          502
        )
      );
    }
    if (parsed.data.payment_status !== 'paid') {
      return err(new ExternalServiceError('stripe', 'Payment not completed', 400));
    }
    return ok(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to retrieve checkout session';
    return err(new ExternalServiceError('stripe', msg, 502));
  }
}
