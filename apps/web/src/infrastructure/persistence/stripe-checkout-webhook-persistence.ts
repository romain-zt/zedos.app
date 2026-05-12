/**
 * Drizzle persistence for Stripe checkout.session.completed webhook side effects.
 * Keeps `@repo/db` usage under infrastructure/persistence per Next.js layer rules.
 */

import { db, purchases, processedWebhookEvents, eq, sql, users } from '@repo/db';

export async function isStripeWebhookEventRecorded(eventId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: processedWebhookEvents.id })
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.eventId, eventId))
    .limit(1);
  return !!row;
}

export type PurchaseRowForWebhook = {
  id: string;
  userId: string;
};

export async function findPurchaseById(purchaseId: string): Promise<PurchaseRowForWebhook | null> {
  const [purchase] = await db
    .select({ id: purchases.id, userId: purchases.userId })
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);
  return purchase ?? null;
}

export async function markPurchaseCompletedWithPaymentIntent(
  purchaseId: string,
  paymentIntent: string | null
): Promise<void> {
  await db.execute(
    sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${paymentIntent} WHERE id = ${purchaseId}`
  );
}

export async function insertProcessedStripeWebhookEvent(eventId: string, eventType: string): Promise<void> {
  await db.insert(processedWebhookEvents).values({
    eventId,
    eventType,
  });
}

export async function getUserCreditBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.creditBalance ?? 0;
}
