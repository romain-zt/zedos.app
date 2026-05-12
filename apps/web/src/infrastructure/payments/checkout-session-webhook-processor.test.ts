import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok, err } from '@repo/result';
import {
  CheckoutSessionCompletedEventSchema,
  type CheckoutSessionCompletedEvent,
} from '@repo/contracts/payments';
import { ValidationError } from '@shared/errors/application-error';
import { processCheckoutSessionCompletedWebhook } from './checkout-session-webhook-processor';

vi.mock('@infrastructure/http/credits-http-bridge', () => ({
  addPurchaseCreditsForApi: vi.fn(),
}));

vi.mock('@infrastructure/persistence/stripe-checkout-webhook-persistence', () => ({
  findPurchaseById: vi.fn(),
  insertProcessedStripeWebhookEvent: vi.fn(),
  isStripeWebhookEventRecorded: vi.fn(),
  markPurchaseCompletedWithPaymentIntent: vi.fn(),
  getUserCreditBalance: vi.fn(),
}));

import { addPurchaseCreditsForApi } from '@infrastructure/http/credits-http-bridge';
import {
  findPurchaseById,
  insertProcessedStripeWebhookEvent,
  isStripeWebhookEventRecorded,
  markPurchaseCompletedWithPaymentIntent,
} from '@infrastructure/persistence/stripe-checkout-webhook-persistence';

const sessionPaid = {
  id: 'cs_test_session',
  object: 'checkout.session' as const,
  payment_status: 'paid' as const,
  status: 'complete' as const,
  metadata: {
    userId: 'user-1',
    purchaseId: 'purchase-1',
    packSize: '100',
  },
  payment_intent: 'pi_test',
};

function baseEvent(overrides: Partial<CheckoutSessionCompletedEvent> = {}): CheckoutSessionCompletedEvent {
  return CheckoutSessionCompletedEventSchema.parse({
    id: 'evt_test_webhook',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    created: 1710000000,
    data: { object: sessionPaid },
    ...overrides,
  });
}

describe('processCheckoutSessionCompletedWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isStripeWebhookEventRecorded).mockResolvedValue(false);
    vi.mocked(findPurchaseById).mockResolvedValue({
      id: 'purchase-1',
      userId: 'user-1',
    });
    vi.mocked(addPurchaseCreditsForApi).mockResolvedValue(ok(250));
    vi.mocked(markPurchaseCompletedWithPaymentIntent).mockResolvedValue(undefined);
    vi.mocked(insertProcessedStripeWebhookEvent).mockResolvedValue(undefined);
  });

  it('returns duplicateStripeEvent when Stripe event id was already processed', async () => {
    vi.mocked(isStripeWebhookEventRecorded).mockResolvedValue(true);

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('expected Ok');
    expect(result.value.duplicateStripeEvent).toBe(true);
    expect(result.value.balance).toBe(0);
    expect(findPurchaseById).not.toHaveBeenCalled();
  });

  it('rejects when checkout session is not paid', async () => {
    const event = baseEvent({
      data: {
        object: {
          ...sessionPaid,
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          status: 'open',
        },
      },
    });

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toContain('not paid');
  });

  it('rejects invalid metadata', async () => {
    const event = baseEvent({
      data: {
        object: {
          ...sessionPaid,
          id: 'cs_badmeta',
          metadata: {
            userId: '',
            purchaseId: 'purchase-1',
            packSize: '100',
          },
        },
      },
    });

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error.message).toContain('metadata');
  });

  it('rejects when purchase is missing', async () => {
    vi.mocked(findPurchaseById).mockResolvedValue(null);

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error.message).toContain('not found');
  });

  it('rejects when purchase user does not match metadata', async () => {
    vi.mocked(findPurchaseById).mockResolvedValue({
      id: 'purchase-1',
      userId: 'other-user',
    });

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error.message).toMatch(/mismatch/i);
  });

  it('grants credits, completes purchase, records idempotency on success', async () => {
    const event = baseEvent();

    const result = await processCheckoutSessionCompletedWebhook(event);

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('expected Ok');
    expect(result.value.duplicateStripeEvent).toBe(false);
    expect(result.value.balance).toBe(250);

    expect(addPurchaseCreditsForApi).toHaveBeenCalledWith('user-1', 100, {
      purchaseId: 'purchase-1',
      stripeSessionId: 'cs_test_session',
      packSize: 100,
    });
    expect(markPurchaseCompletedWithPaymentIntent).toHaveBeenCalledWith(
      'purchase-1',
      'pi_test'
    );
    expect(insertProcessedStripeWebhookEvent).toHaveBeenCalledWith(
      'evt_test_webhook',
      'checkout.session.completed'
    );
  });

  it('propagates errors from addPurchaseCreditsForApi', async () => {
    const creditErr = new ValidationError('Ledger conflict');
    vi.mocked(addPurchaseCreditsForApi).mockResolvedValue(err(creditErr));

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error).toBe(creditErr);
    expect(insertProcessedStripeWebhookEvent).not.toHaveBeenCalled();
  });
});
