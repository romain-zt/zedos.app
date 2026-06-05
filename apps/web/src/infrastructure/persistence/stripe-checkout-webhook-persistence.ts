/**
 * Drizzle persistence for Stripe checkout.session.completed webhook side effects.
 * Keeps `@repo/db` usage under infrastructure/persistence per Next.js layer rules.
 */

import {
  db,
  purchases,
  processedWebhookEvents,
  creditTransactions,
  eq,
  and,
  sql,
  users,
  type CreditTransactionInsert,
  type UserUpdate,
} from '@repo/db';

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

export type ProcessCheckoutWebhookAtomicInput = {
  eventId: string;
  eventType: string;
  userId: string;
  purchaseId: string;
  packSize: number;
  stripeSessionId: string;
  paymentIntent: string | null;
};

export type ProcessCheckoutWebhookAtomicResult =
  | { kind: 'duplicate'; balance: number }
  | { kind: 'processed'; balance: number }
  | { kind: 'invalid_purchase' };

/**
 * Applies checkout webhook side-effects in one transaction:
 * idempotency check, credit grant, purchase completion, event recording.
 */
export async function processCheckoutWebhookAtomically(
  input: ProcessCheckoutWebhookAtomicInput
): Promise<ProcessCheckoutWebhookAtomicResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.eventId}))`);

    const [alreadyProcessed] = await tx
      .select({ id: processedWebhookEvents.id })
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, input.eventId))
      .limit(1);
    if (alreadyProcessed) {
      const [currentBalance] = await tx
        .select({ creditBalance: users.creditBalance })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      return { kind: 'duplicate', balance: currentBalance?.creditBalance ?? 0 };
    }

    const [purchase] = await tx
      .select({ id: purchases.id, userId: purchases.userId })
      .from(purchases)
      .where(eq(purchases.id, input.purchaseId))
      .limit(1);
    if (!purchase || purchase.userId !== input.userId) {
      return { kind: 'invalid_purchase' };
    }

    const lockedRows = await tx.execute(
      sql`SELECT credit_balance FROM users WHERE id = ${input.userId} FOR UPDATE`
    );
    const locked = lockedRows as unknown as Array<{ credit_balance: number }>;
    if (!locked || locked.length === 0) {
      return { kind: 'invalid_purchase' };
    }
    const currentBalance = locked[0]?.credit_balance ?? 0;

    const correlationId = `purchase:${input.purchaseId}`;
    const [existingPurchaseTx] = await tx
      .select({
        id: creditTransactions.id,
        type: creditTransactions.type,
        amount: creditTransactions.amount,
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, input.userId),
          eq(creditTransactions.correlationId, correlationId)
        )
      )
      .limit(1);

    const creditsAlreadyGranted =
      !!existingPurchaseTx && existingPurchaseTx.type === 'purchase' && existingPurchaseTx.amount === input.packSize;

    let nextBalance = currentBalance;

    if (!creditsAlreadyGranted) {
      nextBalance = currentBalance + input.packSize;
      const userUpdate: UserUpdate = { creditBalance: nextBalance };
      await tx.update(users).set(userUpdate).where(eq(users.id, input.userId));

      const transactionData: CreditTransactionInsert = {
        userId: input.userId,
        type: 'purchase',
        amount: input.packSize,
        balanceAfter: nextBalance,
        metadata: {
          purchaseId: input.purchaseId,
          stripeSessionId: input.stripeSessionId,
          packSize: input.packSize,
        },
        correlationId,
      };
      await tx.insert(creditTransactions).values(transactionData);
    }

    await tx.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${input.paymentIntent} WHERE id = ${input.purchaseId}`
    );

    await tx.insert(processedWebhookEvents).values({
      eventId: input.eventId,
      eventType: input.eventType,
    });

    return { kind: 'processed', balance: nextBalance };
  });
}
