/**
 * Stripe SDK calls for Builder subscription mode.
 *
 * Kept thin so the application layer remains free of vendor SDK construction.
 * Distinct from `stripe-checkout-flows.ts` because:
 *   - mode is 'subscription' (recurring), not 'payment' (one-shot pack)
 *   - success mutates `subscriptions` + `users.planTier`, not the credit ledger
 *
 * E2E mode short-circuit mirrors the pack flow: returns a deterministic URL that
 * routes back to the app billing surface.
 */

import Stripe from 'stripe';
import { loadSubscriptionConfig } from './subscription-config';
import {
  buildE2eCheckoutSessionId,
  isE2eMode,
} from '@shared/testing/e2e-mode';

export type SubscriptionFlowResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string };

function stripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret !== undefined && secret.trim().length > 0 ? new Stripe(secret) : null;
}

export interface CreateBuilderCheckoutInput {
  userId: string;
  origin: string;
}

export async function createBuilderSubscriptionCheckout(
  input: CreateBuilderCheckoutInput,
): Promise<SubscriptionFlowResult<{ url: string }>> {
  const cfg = loadSubscriptionConfig();
  if (cfg.ok === false) {
    return { ok: false, status: 503, error: `Subscription not configured: ${cfg.error.detail}` };
  }

  if (isE2eMode()) {
    const sessionId = buildE2eCheckoutSessionId(`sub_${input.userId}`);
    const origin = input.origin.replace(/\/$/, '');
    return {
      ok: true,
      value: {
        url: `${origin}/dashboard/billing?subscription=active&session_id=${encodeURIComponent(sessionId)}`,
      },
    };
  }

  const stripe = stripeClient();
  if (stripe === null) {
    return { ok: false, status: 503, error: 'Stripe is not configured' };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_creation: 'always',
    line_items: [
      {
        price: cfg.config.builderPriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId: input.userId,
        planTier: 'builder',
      },
    },
    metadata: {
      userId: input.userId,
      planTier: 'builder',
    },
    ...(cfg.config.automaticTaxEnabled ? { automatic_tax: { enabled: true } } : {}),
    success_url: `${input.origin}/dashboard/billing?subscription=active&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/dashboard/billing?subscription=canceled`,
  });

  if (session.url === null) {
    return { ok: false, status: 502, error: 'Stripe did not return checkout URL' };
  }

  return { ok: true, value: { url: session.url } };
}

export interface CreateCustomerPortalInput {
  stripeCustomerId: string;
  returnUrl: string;
}

export async function createCustomerPortalSession(
  input: CreateCustomerPortalInput,
): Promise<SubscriptionFlowResult<{ url: string }>> {
  if (isE2eMode()) {
    return { ok: true, value: { url: `${input.returnUrl}?portal=e2e-stub` } };
  }

  const stripe = stripeClient();
  if (stripe === null) {
    return { ok: false, status: 503, error: 'Stripe is not configured' };
  }

  const cfg = loadSubscriptionConfig();
  const configuration =
    cfg.ok && cfg.config.customerPortalConfigId !== null
      ? cfg.config.customerPortalConfigId
      : undefined;

  const portal = await stripe.billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: input.returnUrl,
    ...(configuration !== undefined ? { configuration } : {}),
  });

  return { ok: true, value: { url: portal.url } };
}
