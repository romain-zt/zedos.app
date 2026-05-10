import { describe, it, expect } from 'vitest';
import {
  WebhookEventEnvelopeSchema,
  CheckoutSessionCompletedEventSchema,
  PaymentIntentSucceededEventSchema,
} from './webhook';
import validCheckout from './__fixtures__/checkout-session-completed.valid.json';
import missingPurchaseId from './__fixtures__/checkout-session-completed.missing-purchase-id.json';
import validPaymentIntent from './__fixtures__/payment-intent-succeeded.valid.json';
import unknownType from './__fixtures__/webhook-envelope.unknown-type.json';

describe('CheckoutSessionCompletedEventSchema (T-19)', () => {
  it('parses a valid checkout.session.completed fixture', () => {
    const result = CheckoutSessionCompletedEventSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('rejects a payload missing purchaseId in metadata', () => {
    const result = CheckoutSessionCompletedEventSchema.safeParse(missingPurchaseId);
    expect(result.success).toBe(false);
  });

  it('rejects a payload with wrong type field', () => {
    const wrong = { ...validCheckout, type: 'payment_intent.succeeded' };
    const result = CheckoutSessionCompletedEventSchema.safeParse(wrong);
    expect(result.success).toBe(false);
  });

  it('rejects missing id field', () => {
    const { id: _omit, ...noId } = validCheckout;
    const result = CheckoutSessionCompletedEventSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });
});

describe('PaymentIntentSucceededEventSchema (T-20)', () => {
  it('parses a valid payment_intent.succeeded fixture', () => {
    const result = PaymentIntentSucceededEventSchema.safeParse(validPaymentIntent);
    expect(result.success).toBe(true);
  });

  it('rejects payload missing purchaseId in metadata', () => {
    const clone = JSON.parse(JSON.stringify(validPaymentIntent));
    delete clone.data.object.metadata.purchaseId;
    const result = PaymentIntentSucceededEventSchema.safeParse(clone);
    expect(result.success).toBe(false);
  });

  it('rejects payload with wrong status', () => {
    const clone = JSON.parse(JSON.stringify(validPaymentIntent));
    clone.data.object.status = 'requires_payment_method';
    const result = PaymentIntentSucceededEventSchema.safeParse(clone);
    expect(result.success).toBe(false);
  });
});

describe('WebhookEventEnvelopeSchema — discriminated union (T-21)', () => {
  it('routes checkout.session.completed to its handler type', () => {
    const result = WebhookEventEnvelopeSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('checkout.session.completed');
    }
  });

  it('routes payment_intent.succeeded to its handler type', () => {
    const result = WebhookEventEnvelopeSchema.safeParse(validPaymentIntent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('payment_intent.succeeded');
    }
  });

  it('rejects unknown event types', () => {
    const result = WebhookEventEnvelopeSchema.safeParse(unknownType);
    expect(result.success).toBe(false);
  });
});
