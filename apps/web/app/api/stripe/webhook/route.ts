export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { CheckoutSessionCompletedEventSchema } from '@repo/contracts/payments';
import { verifyStripeWebhookAndParseEnvelope } from '@infrastructure/payments/stripe-webhook-verify';
import {
  getUserCreditBalance,
  processCheckoutSessionCompletedWebhook,
} from '@infrastructure/payments/checkout-session-webhook-processor';
import {
  isSubscriptionWebhookEventType,
  processSubscriptionWebhook,
} from '@infrastructure/payments/stripe-subscription-webhook-processor';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'stripe/webhook' });

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  const verified = verifyStripeWebhookAndParseEnvelope(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (verified.isErr()) {
    const e = verified.error;
    logger.warn('Stripe webhook signature verification failed', {
      statusCode: e.statusCode ?? 400,
    });
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 400 });
  }

  const event = verified.unwrap();

  if (event.type === 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  if (isSubscriptionWebhookEventType(event.type)) {
    const subOutcome = await processSubscriptionWebhook(event);
    if (subOutcome.isErr()) {
      const e = subOutcome.error;
      logger
        .withContext({ eventId: event.id, eventType: event.type })
        .error('Subscription webhook processing failed', e);
      return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
    }
    return NextResponse.json({ received: true, subscription: subOutcome.unwrap() });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const parsedCheckoutEvent = CheckoutSessionCompletedEventSchema.safeParse(event);
  if (!parsedCheckoutEvent.success) {
    logger.error('Stripe webhook payload validation failed', {
      eventType: event.type,
      eventId: event.id,
    });
    return NextResponse.json(
      {
        error: `Webhook payload failed contract validation: ${parsedCheckoutEvent.error.message}`,
      },
      { status: 400 }
    );
  }

  const envelope = parsedCheckoutEvent.data;
  const outcome = await processCheckoutSessionCompletedWebhook(envelope);

  if (outcome.isErr()) {
    const e = outcome.error;
    logger
      .withContext({ eventId: envelope.id, eventType: envelope.type })
      .error('Stripe webhook processing failed', e);
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }

  const data = outcome.unwrap();
  if (data.duplicateStripeEvent) {
    const userId = envelope.data.object.metadata.userId;
    const balance = userId ? await getUserCreditBalance(userId) : 0;
    return NextResponse.json({ received: true, duplicate: true, balance });
  }

  return NextResponse.json({
    received: true,
    balance: data.balance,
    creditsAdded: envelope.data.object.metadata.packSize,
  });
}
