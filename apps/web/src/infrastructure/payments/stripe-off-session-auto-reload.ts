/**
 * Off-session prepaid pack purchase for auto-reload (not a subscription).
 */

import Stripe from 'stripe';
import { db, purchases, sql, type PurchaseInsert } from '@repo/db';
import { getCreditPacks } from '@/lib/config';
import { addPurchaseCreditsForApi } from '@infrastructure/http/credits-http-bridge';
import { isE2eMode } from '@shared/testing/e2e-mode';
import type { AutoReloadPackSize } from '@domain/auto-reload/auto-reload-preference';
export type OffSessionAutoReloadResult =
  | { outcome: 'succeeded'; creditsAdded: number; newBalance: number }
  | { outcome: 'declined' | 'authentication_required' | 'not_configured' };

function stripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}

function packForSize(packSize: AutoReloadPackSize) {
  const packs = getCreditPacks();
  return packs.find((p) => p.size === packSize) ?? packs[0];
}

export async function attemptOffSessionAutoReload(input: {
  userId: string;
  packSize: AutoReloadPackSize;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
}): Promise<OffSessionAutoReloadResult> {
  const pack = packForSize(input.packSize);
  if (!pack) {
    return { outcome: 'not_configured' };
  }

  const purchaseInsert: PurchaseInsert = {
    userId: input.userId,
    packSize: pack.size,
    amountEur: pack.priceEur,
    status: 'pending',
  };
  const [purchase] = await db.insert(purchases).values(purchaseInsert).returning();

  if (isE2eMode()) {
    const grant = await addPurchaseCreditsForApi(
      input.userId,
      pack.size,
      {
        purchaseId: purchase.id,
        source: 'auto_reload',
        packSize: pack.size,
      },
      'auto_reload'
    );
    if (grant.isErr()) {
      return { outcome: 'declined' };
    }
    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${'pi_e2e_auto_reload'} WHERE id = ${purchase.id}`
    );
    return {
      outcome: 'succeeded',
      creditsAdded: pack.size,
      newBalance: grant.unwrap(),
    };
  }

  const stripe = stripeClient();
  if (!stripe) {
    return { outcome: 'not_configured' };
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: pack.priceEur * 100,
      currency: 'eur',
      customer: input.stripeCustomerId,
      payment_method: input.stripePaymentMethodId,
      confirm: true,
      off_session: true,
      metadata: {
        userId: input.userId,
        purchaseId: purchase.id,
        packSize: String(pack.size),
        autoReload: 'true',
      },
    });

    if (intent.status === 'requires_action') {
      return { outcome: 'authentication_required' };
    }

    if (intent.status !== 'succeeded') {
      return { outcome: 'declined' };
    }

    const grant = await addPurchaseCreditsForApi(
      input.userId,
      pack.size,
      {
        purchaseId: purchase.id,
        stripePaymentIntentId: intent.id,
        packSize: pack.size,
        source: 'auto_reload',
      },
      'auto_reload'
    );
    if (grant.isErr()) {
      return { outcome: 'declined' };
    }

    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${intent.id} WHERE id = ${purchase.id}`
    );

    return {
      outcome: 'succeeded',
      creditsAdded: pack.size,
      newBalance: grant.unwrap(),
    };
  } catch (error: unknown) {
    const stripeError = error as { code?: string; type?: string };
    if (stripeError.code === 'authentication_required') {
      return { outcome: 'authentication_required' };
    }
    return { outcome: 'declined' };
  }
}

export async function resolvePaymentMethodFromCheckoutSession(
  sessionId: string
): Promise<{ customerId: string; paymentMethodId: string } | null> {
  if (isE2eMode()) {
    return { customerId: 'cus_e2e', paymentMethodId: 'pm_e2e' };
  }
  const stripe = stripeClient();
  if (!stripe) {
    return null;
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'payment_intent.payment_method'],
  });
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['payment_method'],
        })
      : session.payment_intent;

  const paymentMethodId =
    typeof paymentIntent?.payment_method === 'string'
      ? paymentIntent.payment_method
      : paymentIntent?.payment_method?.id ?? null;

  const paymentMethodCustomerId =
    typeof paymentIntent?.payment_method !== 'string'
      ? (typeof paymentIntent?.payment_method?.customer === 'string'
          ? paymentIntent.payment_method.customer
          : paymentIntent?.payment_method?.customer?.id ?? null)
      : null;

  const customerId =
    (typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null) ??
    (typeof paymentIntent?.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent?.customer?.id ?? null) ??
    paymentMethodCustomerId;

  if (!customerId || !paymentMethodId) {
    return null;
  }
  return { customerId, paymentMethodId };
}
