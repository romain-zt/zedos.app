import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyStripeWebhookAndParseEnvelope } from './stripe-webhook-verify';
import { ExternalServiceError } from '@shared/errors/application-error';

describe('verifyStripeWebhookAndParseEnvelope', () => {
  const savedSecret = process.env.STRIPE_SECRET_KEY;
  const savedWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_webhook_verify_tests';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_secret_value';
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = savedSecret;
    process.env.STRIPE_WEBHOOK_SECRET = savedWebhook;
  });

  it('returns 503 when STRIPE_SECRET_KEY is missing', () => {
    delete process.env.STRIPE_SECRET_KEY;

    const result = verifyStripeWebhookAndParseEnvelope('{}', 'sig', 'whsec_x');

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error).toBeInstanceOf(ExternalServiceError);
    expect(result.error.statusCode).toBe(503);
    expect(result.error.message).toContain('not configured');
  });

  it('returns 503 when webhook signing secret argument is missing', () => {
    const result = verifyStripeWebhookAndParseEnvelope('{}', 't=1,v1=ab', undefined);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.statusCode).toBe(503);
    expect(result.error.message).toContain('signing secret');
  });

  it('returns 400 when Stripe-Signature header is missing', () => {
    const result = verifyStripeWebhookAndParseEnvelope('{}', null, 'whsec_x');

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.statusCode).toBe(400);
    expect(result.error.message).toContain('Missing Stripe-Signature');
  });

  it('returns 400 when signature verification fails', () => {
    const result = verifyStripeWebhookAndParseEnvelope(
      '{"id":"evt_x"}',
      't=1,v1=deadbeef',
      process.env.STRIPE_WEBHOOK_SECRET
    );

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.statusCode).toBe(400);
  });
});
