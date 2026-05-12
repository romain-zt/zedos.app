import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@repo/result';
import { ExternalServiceError } from '@shared/errors/application-error';
import { CheckoutSessionCompletedEventSchema } from '@repo/contracts/payments/webhook';
import { buildCheckoutSessionCompletedEvent } from '../../../../src/test-helpers/stripe-test-fixtures';

const verifyMock = vi.hoisted(() => ({
  verifyStripeWebhookAndParseEnvelope: vi.fn(),
}));

const processorMocks = vi.hoisted(() => ({
  processCheckoutSessionCompletedWebhook: vi.fn(),
  getUserCreditBalance: vi.fn(),
}));

vi.mock('@infrastructure/payments/stripe-webhook-verify', () => verifyMock);

vi.mock('@infrastructure/payments/checkout-session-webhook-processor', () => processorMocks);

import { POST } from './route';

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps verification failure to JSON error', async () => {
    verifyMock.verifyStripeWebhookAndParseEnvelope.mockReturnValue(
      err(new ExternalServiceError('stripe', 'bad sig', 400))
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 't=1,v1=x' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('bad sig');
  });

  it('returns 200 with duplicate payload when processor marks duplicate event', async () => {
    const envelope = CheckoutSessionCompletedEventSchema.parse(
      buildCheckoutSessionCompletedEvent({ userId: 'u1' })
    );
    verifyMock.verifyStripeWebhookAndParseEnvelope.mockReturnValue(ok(envelope));
    processorMocks.processCheckoutSessionCompletedWebhook.mockResolvedValue(
      ok({ balance: 0, duplicateStripeEvent: true })
    );
    processorMocks.getUserCreditBalance.mockResolvedValue(99);

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
    expect(json.balance).toBe(99);
    expect(processorMocks.getUserCreditBalance).toHaveBeenCalledWith('u1');
  });

  it('returns balance and creditsAdded on first-time grant', async () => {
    const envelope = CheckoutSessionCompletedEventSchema.parse(
      buildCheckoutSessionCompletedEvent({ packSize: 50 })
    );
    verifyMock.verifyStripeWebhookAndParseEnvelope.mockReturnValue(ok(envelope));
    processorMocks.processCheckoutSessionCompletedWebhook.mockResolvedValue(
      ok({ balance: 120, duplicateStripeEvent: false })
    );

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.balance).toBe(120);
    expect(json.creditsAdded).toBe('50');
  });
});
