export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { BillingPaymentMethodSchema } from '@repo/contracts/payments';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';

function stripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userResult.unwrap().id;
  const repo = new DrizzleAutoReloadRepository();
  const prefResult = await repo.getByUserId(userId);
  if (prefResult.isErr()) {
    return NextResponse.json({ error: 'Failed to load payment method' }, { status: 500 });
  }

  const pref = prefResult.unwrap();
  const paymentMethodId = pref.stripePaymentMethodId;
  if (!paymentMethodId) {
    return NextResponse.json(
      BillingPaymentMethodSchema.parse({
        hasSavedPaymentMethod: false,
        brand: null,
        last4: null,
        expMonth: null,
        expYear: null,
      })
    );
  }

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json(
      BillingPaymentMethodSchema.parse({
        hasSavedPaymentMethod: true,
        brand: null,
        last4: null,
        expMonth: null,
        expYear: null,
      })
    );
  }

  const method = await stripe.paymentMethods.retrieve(paymentMethodId);
  const card = method.card;

  return NextResponse.json(
    BillingPaymentMethodSchema.parse({
      hasSavedPaymentMethod: true,
      brand: card?.brand ?? null,
      last4: card?.last4 ?? null,
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
    })
  );
}

export async function DELETE() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userResult.unwrap().id;
  const repo = new DrizzleAutoReloadRepository();
  const prefResult = await repo.getByUserId(userId);
  if (prefResult.isErr()) {
    return NextResponse.json({ error: 'Failed to load payment method' }, { status: 500 });
  }

  const pref = prefResult.unwrap();
  const paymentMethodId = pref.stripePaymentMethodId;
  const stripe = stripeClient();

  if (paymentMethodId && stripe) {
    await stripe.paymentMethods.detach(paymentMethodId);
  }

  const clearResult = await repo.clearStripePaymentMethod(userId);
  if (clearResult.isErr()) {
    return NextResponse.json({ error: 'Failed to clear payment method' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Payment method removed',
  });
}
