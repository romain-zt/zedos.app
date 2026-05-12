import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@repo/result';
import { ValidationError } from '@shared/errors/application-error';
import { CheckoutSessionCompletedEventSchema } from '@repo/contracts/payments/webhook';
import { buildCheckoutSessionCompletedEvent } from '../../test-helpers/stripe-test-fixtures';

const persistenceMocks = vi.hoisted(() => ({
  isStripeWebhookEventRecorded: vi.fn(),
  findPurchaseById: vi.fn(),
  insertProcessedStripeWebhookEvent: vi.fn(),
  markPurchaseCompletedWithPaymentIntent: vi.fn(),
  getUserCreditBalance: vi.fn(),
}));

const bridgeMocks = vi.hoisted(() => ({
  addPurchaseCreditsForApi: vi.fn(),
}));

vi.mock('@infrastructure/persistence/stripe-checkout-webhook-persistence', () => persistenceMocks);

vi.mock('@infrastructure/http/credits-http-bridge', () => bridgeMocks);

import {
  processCheckoutSessionCompletedWebhook,
  getUserCreditBalance,
} from './checkout-session-webhook-processor';

function parseEvent(
  overrides?: Parameters<typeof buildCheckoutSessionCompletedEvent>[0]
) {
  return CheckoutSessionCompletedEventSchema.parse(buildCheckoutSessionCompletedEvent(overrides));
}

describe('processCheckoutSessionCompletedWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('short-circuits when Stripe event id was already processed', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(true);

    const result = await processCheckoutSessionCompletedWebhook(parseEvent());

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value).toEqual({ balance: 0, duplicateStripeEvent: true });
    expect(persistenceMocks.findPurchaseById).not.toHaveBeenCalled();
    expect(bridgeMocks.addPurchaseCreditsForApi).not.toHaveBeenCalled();
  });

  it('rejects unpaid checkout sessions', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    const raw = buildCheckoutSessionCompletedEvent();
    raw.data.object.payment_status = 'unpaid';
    const event = CheckoutSessionCompletedEventSchema.parse(raw);

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toContain('not paid');
  });

  it('rejects invalid metadata', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    const raw = buildCheckoutSessionCompletedEvent();
    raw.data.object.metadata.packSize = '0';
    const event = CheckoutSessionCompletedEventSchema.parse(raw);

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toContain('Invalid checkout session metadata');
  });

  it('returns ValidationError when purchase is missing', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    persistenceMocks.findPurchaseById.mockResolvedValue(null);

    const result = await processCheckoutSessionCompletedWebhook(parseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.message).toBe('Purchase not found');
  });

  it('returns ValidationError when purchase user mismatches metadata', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    persistenceMocks.findPurchaseById.mockResolvedValue({
      id: 'purchase_test_001',
      userId: 'other-user',
    });

    const result = await processCheckoutSessionCompletedWebhook(
      parseEvent({ userId: 'user_test_001' })
    );

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.message).toBe('Purchase user mismatch');
  });

  it('propagates errors from addPurchaseCreditsForApi', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    persistenceMocks.findPurchaseById.mockResolvedValue({
      id: 'purchase_test_001',
      userId: 'user_test_001',
    });
    const deductErr = new ValidationError('ledger blocked');
    bridgeMocks.addPurchaseCreditsForApi.mockResolvedValue(err(deductErr));

    const result = await processCheckoutSessionCompletedWebhook(parseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error).toBe(deductErr);
    expect(persistenceMocks.markPurchaseCompletedWithPaymentIntent).not.toHaveBeenCalled();
  });

  it('grants credits, completes purchase, and records webhook idempotency row', async () => {
    persistenceMocks.isStripeWebhookEventRecorded.mockResolvedValue(false);
    persistenceMocks.findPurchaseById.mockResolvedValue({
      id: 'purchase_test_001',
      userId: 'user_test_001',
    });
    bridgeMocks.addPurchaseCreditsForApi.mockResolvedValue(ok(250));

    const event = parseEvent({ eventId: 'evt_grant_1' });
    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value).toEqual({ balance: 250, duplicateStripeEvent: false });

    expect(bridgeMocks.addPurchaseCreditsForApi).toHaveBeenCalledWith(
      'user_test_001',
      100,
      expect.objectContaining({
        purchaseId: 'purchase_test_001',
        stripeSessionId: 'cs_test_001',
        packSize: 100,
      })
    );
    expect(persistenceMocks.markPurchaseCompletedWithPaymentIntent).toHaveBeenCalledWith(
      'purchase_test_001',
      'pi_test_001'
    );
    expect(persistenceMocks.insertProcessedStripeWebhookEvent).toHaveBeenCalledWith(
      'evt_grant_1',
      'checkout.session.completed'
    );
  });
});

describe('getUserCreditBalance', () => {
  it('delegates to persistence loader', async () => {
    persistenceMocks.getUserCreditBalance.mockResolvedValue(42);
    const balance = await getUserCreditBalance('uid');
    expect(balance).toBe(42);
    expect(persistenceMocks.getUserCreditBalance).toHaveBeenCalledWith('uid');
  });
});
