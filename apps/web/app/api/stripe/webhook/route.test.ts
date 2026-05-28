import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';
import { POST } from './route';

const verifyMock = vi.fn();
const processMock = vi.fn();
const balanceMock = vi.fn();

vi.mock('@infrastructure/payments/stripe-webhook-verify', () => ({
  verifyStripeWebhookAndParseEnvelope: (...args: unknown[]) => verifyMock(...args),
}));

vi.mock('@infrastructure/payments/checkout-session-webhook-processor', () => ({
  processCheckoutSessionCompletedWebhook: (...args: unknown[]) => processMock(...args),
  getUserCreditBalance: (...args: unknown[]) => balanceMock(...args),
}));

function makeCheckoutEnvelope(overrides: {
  metadata?: Record<string, string>;
} = {}) {
  return {
    object: 'event' as const,
    type: 'checkout.session.completed' as const,
    id: 'evt_placeholder_1',
    livemode: false,
    created: 1_717_000_000,
    data: {
      object: {
        id: 'cs_placeholder',
        object: 'checkout.session' as const,
        payment_status: 'paid' as const,
        status: 'complete' as const,
        metadata: {
          userId: 'user-1',
          purchaseId: 'pur-1',
          packSize: '50',
          ...overrides.metadata,
        },
      },
    },
  };
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns verification error payload with status when verify fails', async () => {
    verifyMock.mockReturnValue(
      err(new ExternalServiceError('stripe', 'bad sig', 400))
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('STRIPE service error: bad sig');
    expect(processMock).not.toHaveBeenCalled();
  });

  it('acks payment_intent.succeeded without running checkout processor', async () => {
    verifyMock.mockReturnValue(
      ok({
        type: 'payment_intent.succeeded',
        id: 'evt_pi',
        data: { object: {} },
      })
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(processMock).not.toHaveBeenCalled();
  });

  it('acks unrelated event types without processor', async () => {
    verifyMock.mockReturnValue(
      ok({
        type: 'customer.subscription.created',
        id: 'evt_sub',
        data: { object: {} },
      })
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(processMock).not.toHaveBeenCalled();
  });

  it('maps processor failure to HTTP error', async () => {
    const envelope = makeCheckoutEnvelope();
    verifyMock.mockReturnValue(ok(envelope));
    processMock.mockResolvedValue(err(new ExternalServiceError('stripe', 'db down', 500)));

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'STRIPE service error: db down' });
  });

  it('returns balance and credits on first-time checkout.session.completed', async () => {
    const envelope = makeCheckoutEnvelope({ metadata: { packSize: '100' } });
    verifyMock.mockReturnValue(ok(envelope));
    processMock.mockResolvedValue(
      ok({ balance: 120, duplicateStripeEvent: false })
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      balance: 120,
      creditsAdded: '100',
    });
    expect(balanceMock).not.toHaveBeenCalled();
  });

  it('duplicate delivery returns balance from getUserCreditBalance', async () => {
    const envelope = makeCheckoutEnvelope();
    verifyMock.mockReturnValue(ok(envelope));
    processMock.mockResolvedValue(ok({ balance: 0, duplicateStripeEvent: true }));
    balanceMock.mockResolvedValue(99);

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      duplicate: true,
      balance: 99,
    });
    expect(balanceMock).toHaveBeenCalledWith('user-1');
  });
});
