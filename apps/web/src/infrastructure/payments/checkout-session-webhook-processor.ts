/**
 * Grants credits from a validated `checkout.session.completed` Stripe webhook envelope,
 * marks purchase completed, records webhook idempotency row.
 */

import type { CheckoutSessionCompletedEvent } from '@repo/contracts/payments/webhook';
import { db, purchases, processedWebhookEvents, eq, sql, users } from '@repo/db';
import type { Result } from '@repo/result';
import { ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  ValidationError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import { addPurchaseCreditsForApi } from '@infrastructure/http/credits-http-bridge';

const logger = createLogger({ service: 'CheckoutSessionWebhookProcessor' });

export async function processCheckoutSessionCompletedWebhook(
  event: CheckoutSessionCompletedEvent
): Promise<Result<{ balance: number; duplicateStripeEvent: boolean }, ApplicationError>> {
  const eventId = event.id;

  try {
    const [already] = await db
      .select({ id: processedWebhookEvents.id })
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, eventId))
      .limit(1);

    if (already) {
      return ok({ balance: 0, duplicateStripeEvent: true });
    }

    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return err(new ValidationError('Checkout session not paid; skipping credit grant'));
    }

    const userId = session.metadata.userId;
    const purchaseId = session.metadata.purchaseId;
    const packSize = parseInt(session.metadata.packSize, 10);

    if (!userId || !purchaseId || !packSize || Number.isNaN(packSize) || packSize <= 0) {
      return err(new ValidationError('Invalid checkout session metadata for credit grant'));
    }

    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);

    if (!purchase) {
      return err(new ValidationError('Purchase not found'));
    }
    if (purchase.userId !== userId) {
      return err(new ValidationError('Purchase user mismatch'));
    }

    const addResult = await addPurchaseCreditsForApi(userId, packSize, {
      purchaseId,
      stripeSessionId: session.id,
      packSize,
    });

    if (addResult.isErr()) {
      return err(addResult.error);
    }

    const newBalance = addResult.unwrap();
    const paymentIntent =
      typeof session.payment_intent === 'string' && session.payment_intent.length > 0
        ? session.payment_intent
        : null;

    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${paymentIntent} WHERE id = ${purchaseId}`
    );

    await db.insert(processedWebhookEvents).values({
      eventId,
      eventType: event.type,
    });

    return ok({ balance: newBalance, duplicateStripeEvent: false });
  } catch (error) {
    logger.error('Checkout webhook processing failed', error);
    return err(new DatabaseError('Failed to process checkout webhook'));
  }
}

/** Loads current balance for duplicate Stripe event acknowledgment */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.creditBalance ?? 0;
}
