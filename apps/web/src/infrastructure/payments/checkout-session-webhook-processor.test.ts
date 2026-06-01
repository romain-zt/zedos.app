import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CheckoutSessionCompletedEventSchema,
  type CheckoutSessionCompletedEvent,
} from '@repo/contracts/payments';
import { ValidationError } from '@shared/errors/application-error';
import { processCheckoutSessionCompletedWebhook } from './checkout-session-webhook-processor';

vi.mock('@infrastructure/persistence/stripe-checkout-webhook-persistence', () => ({
  processCheckoutWebhookAtomically: vi.fn(),
  getUserCreditBalance: vi.fn(),
}));

vi.mock('@infrastructure/payments/stripe-off-session-auto-reload', () => ({
  resolvePaymentMethodFromCheckoutSession: vi.fn(),
}));

vi.mock('@infrastructure/persistence/auto-reload-repository', () => ({
  DrizzleAutoReloadRepository: vi.fn().mockImplementation(() => ({
    saveStripePaymentMethod: vi.fn().mockResolvedValue(undefined),
  })),
}));

import {
  processCheckoutWebhookAtomically,
} from '@infrastructure/persistence/stripe-checkout-webhook-persistence';
import { resolvePaymentMethodFromCheckoutSession } from '@infrastructure/payments/stripe-off-session-auto-reload';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';

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
    vi.mocked(processCheckoutWebhookAtomically).mockResolvedValue({
      kind: 'processed',
      balance: 250,
    });
    vi.mocked(resolvePaymentMethodFromCheckoutSession).mockResolvedValue(null);
  });

  it('returns duplicateStripeEvent when Stripe event id was already processed', async () => {
    vi.mocked(processCheckoutWebhookAtomically).mockResolvedValue({
      kind: 'duplicate',
      balance: 310,
    });

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('expected Ok');
    expect(result.value.duplicateStripeEvent).toBe(true);
    expect(result.value.balance).toBe(310);
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

  it('rejects when purchase is invalid in atomic persistence layer', async () => {
    vi.mocked(processCheckoutWebhookAtomically).mockResolvedValue({
      kind: 'invalid_purchase',
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

    expect(processCheckoutWebhookAtomically).toHaveBeenCalledWith({
      eventId: 'evt_test_webhook',
      eventType: 'checkout.session.completed',
      userId: 'user-1',
      purchaseId: 'purchase-1',
      packSize: 100,
      stripeSessionId: 'cs_test_session',
      paymentIntent: 'pi_test',
    });
    expect(resolvePaymentMethodFromCheckoutSession).toHaveBeenCalledWith('cs_test_session');
  });

  it('persists payment method for auto-reload when checkout exposes one', async () => {
    vi.mocked(resolvePaymentMethodFromCheckoutSession).mockResolvedValue({
      customerId: 'cus_1',
      paymentMethodId: 'pm_1',
    });
    const savePm = vi.fn().mockResolvedValue(undefined);
    vi.mocked(DrizzleAutoReloadRepository).mockImplementation(
      class MockAutoReloadRepository {
        saveStripePaymentMethod = savePm;
      } as unknown as typeof DrizzleAutoReloadRepository
    );

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isOk()).toBe(true);
    expect(savePm).toHaveBeenCalledWith('user-1', 'cus_1', 'pm_1');
  });

  it('wraps unexpected persistence errors as database failure', async () => {
    vi.mocked(processCheckoutWebhookAtomically).mockRejectedValue(new Error('db unavailable'));

    const result = await processCheckoutSessionCompletedWebhook(baseEvent());

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('expected Err');
    expect(result.error.message).toContain('Failed to process checkout webhook');
  });
});
