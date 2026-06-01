import { describe, expect, it } from 'vitest';
import { extractTaxLegibilityFromCheckoutSession, formatTaxSummaryEur } from './checkout-tax-legibility';

describe('checkout-tax-legibility', () => {
  it('extracts tax from Stripe session totals', () => {
    const legibility = extractTaxLegibilityFromCheckoutSession({
      currency: 'eur',
      amount_subtotal: 1900,
      amount_total: 2280,
      total_details: { amount_tax: 380 },
    } as Parameters<typeof extractTaxLegibilityFromCheckoutSession>[0]);

    expect(legibility.subtotalCents).toBe(1900);
    expect(legibility.taxCents).toBe(380);
    expect(legibility.totalCents).toBe(2280);
    expect(legibility.productClassification).toBe('digital_ai_credits');
  });

  it('formats tax summary for receipt copy', () => {
    const summary = formatTaxSummaryEur({
      subtotalCents: 1900,
      taxCents: 380,
      totalCents: 2280,
      currency: 'eur',
      productClassification: 'digital_ai_credits',
      taxLabel: 'VAT / tax (digital AI credits)',
    });
    expect(summary).toContain('€3.80');
    expect(summary).toContain('€22.80');
  });
});
