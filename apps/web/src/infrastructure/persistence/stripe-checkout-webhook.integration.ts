import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { processCheckoutWebhookAtomically } from './stripe-checkout-webhook-persistence';
import { processCheckoutSessionCompletedWebhook } from '@infrastructure/payments/checkout-session-webhook-processor';
import { buildCheckoutSessionCompletedEvent } from '@/src/test-helpers/stripe-test-fixtures';
import {
  truncateCreditTables,
  seedIntegrationUser,
  seedPendingPurchase,
  findProcessedWebhookEvent,
  getPurchaseStatus,
  testConnection,
  countCreditTransactionsForUser,
} from '@/src/test-helpers/setup-test-db';
import { users, eq } from '@repo/db';
import { ValidationError } from '@shared/errors/application-error';

function webhookInput(overrides?: {
  eventId?: string;
  userId?: string;
  purchaseId?: string;
  packSize?: number;
}) {
  const eventId = overrides?.eventId ?? `evt_int_${randomUUID()}`;
  const userId = overrides?.userId ?? 'user-placeholder';
  const purchaseId = overrides?.purchaseId ?? 'purchase-placeholder';
  const packSize = overrides?.packSize ?? 100;

  return {
    eventId,
    eventType: 'checkout.session.completed',
    userId,
    purchaseId,
    packSize,
    stripeSessionId: `cs_${purchaseId}`,
    paymentIntent: 'pi_int_test',
  };
}

describe('Stripe checkout webhook persistence (integration)', () => {
  beforeEach(async () => {
    await truncateCreditTables();
  });

  it('grants credits, completes purchase, and records webhook idempotency', async () => {
    const user = await seedIntegrationUser({ creditBalance: 10 });
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 100 });

    const input = webhookInput({ userId: user.id, purchaseId, packSize: 100 });
    const result = await processCheckoutWebhookAtomically(input);

    expect(result).toEqual({ kind: 'processed', balance: 110 });
    expect(await getPurchaseStatus(purchaseId)).toBe('completed');
    expect(await findProcessedWebhookEvent(input.eventId)).toBe(true);
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('returns duplicate on second delivery of the same Stripe eventId', async () => {
    const user = await seedIntegrationUser({ creditBalance: 5 });
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 50 });

    const input = webhookInput({ eventId: 'evt_duplicate_delivery', userId: user.id, purchaseId, packSize: 50 });

    const first = await processCheckoutWebhookAtomically(input);
    const second = await processCheckoutWebhookAtomically(input);

    expect(first).toEqual({ kind: 'processed', balance: 55 });
    expect(second.kind).toBe('duplicate');
    if (second.kind === 'duplicate') {
      expect(second.balance).toBe(55);
    }
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);
  });

  it('rejects purchase owned by another user', async () => {
    const owner = await seedIntegrationUser({ creditBalance: 0 });
    const attacker = await seedIntegrationUser({ creditBalance: 0 });
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: owner.id, packSize: 100 });

    const result = await processCheckoutWebhookAtomically(
      webhookInput({ userId: attacker.id, purchaseId, packSize: 100 }),
    );

    expect(result).toEqual({ kind: 'invalid_purchase' });

    const [ownerRow] = await testConnection.db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, owner.id))
      .limit(1);
    expect(ownerRow?.creditBalance).toBe(0);
    expect(await getPurchaseStatus(purchaseId)).toBe('pending');
  });

  it('serializes concurrent webhook processing for the same eventId', async () => {
    const user = await seedIntegrationUser({ creditBalance: 0 });
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 75 });

    const input = webhookInput({
      eventId: 'evt_concurrent_race',
      userId: user.id,
      purchaseId,
      packSize: 75,
    });

    const results = await Promise.all(
      Array.from({ length: 6 }, () => processCheckoutWebhookAtomically(input)),
    );

    const processed = results.filter((r) => r.kind === 'processed');
    const duplicates = results.filter((r) => r.kind === 'duplicate');

    expect(processed).toHaveLength(1);
    expect(duplicates).toHaveLength(5);
    expect(await countCreditTransactionsForUser(user.id)).toBe(1);

    const [userRow] = await testConnection.db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    expect(userRow?.creditBalance).toBe(75);
  });
});

describe('processCheckoutSessionCompletedWebhook (integration)', () => {
  beforeEach(async () => {
    await truncateCreditTables();
  });

  it('maps a paid checkout session to credited balance', async () => {
    const user = await seedIntegrationUser({ creditBalance: 12 });
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 100 });

    const event = buildCheckoutSessionCompletedEvent({
      userId: user.id,
      purchaseId,
      packSize: 100,
      eventId: `evt_proc_${randomUUID()}`,
    });

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ balance: 112, duplicateStripeEvent: false });
    }
    expect(await getPurchaseStatus(purchaseId)).toBe('completed');
  });

  it('returns validation error when checkout session is not paid', async () => {
    const user = await seedIntegrationUser();
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 100 });

    const event = buildCheckoutSessionCompletedEvent({
      userId: user.id,
      purchaseId,
      packSize: 100,
    });
    event.data.object.payment_status = 'unpaid';

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
    expect(await getPurchaseStatus(purchaseId)).toBe('pending');
  });

  it('returns validation error when metadata is invalid', async () => {
    const user = await seedIntegrationUser();
    const purchaseId = `pur_${randomUUID()}`;
    await seedPendingPurchase({ id: purchaseId, userId: user.id, packSize: 100 });

    const event = buildCheckoutSessionCompletedEvent({
      userId: user.id,
      purchaseId,
      packSize: 100,
    });
    event.data.object.metadata.packSize = 'not-a-number';

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});
