import type Stripe from 'stripe';
import type { CheckoutTaxLegibility } from '@repo/contracts/payments';

const PRODUCT_CLASSIFICATION = 'digital_ai_credits' as const;

export function isStripeAutomaticTaxEnabled(): boolean {
  return process.env.STRIPE_AUTOMATIC_TAX_ENABLED !== '0';
}

export function checkoutTaxDisclaimer(automaticTaxEnabled: boolean): string {
  if (automaticTaxEnabled) {
    return 'Prices shown are before tax. VAT or sales tax for digital AI credits is calculated at Stripe checkout (France/EU and US).';
  }
  return 'Purchases are for prepaid digital AI credits. Applicable tax may be shown by your payment provider at checkout.';
}

export function extractTaxLegibilityFromCheckoutSession(
  session: Stripe.Checkout.Session
): CheckoutTaxLegibility {
  const currency = (session.currency ?? 'eur').toLowerCase();
  const subtotalCents = session.amount_subtotal ?? null;
  const totalCents = session.amount_total ?? null;
  const taxCents =
    session.total_details?.amount_tax ??
    (subtotalCents != null && totalCents != null ? Math.max(0, totalCents - subtotalCents) : null);

  const taxLabel =
    taxCents != null && taxCents > 0
      ? 'VAT / tax (digital AI credits)'
      : 'Tax calculated at checkout when applicable';

  return {
    subtotalCents,
    taxCents,
    totalCents,
    currency,
    productClassification: PRODUCT_CLASSIFICATION,
    taxLabel,
  };
}

export function e2eStubTaxLegibility(packPriceEur: number): CheckoutTaxLegibility {
  const subtotalCents = packPriceEur * 100;
  const taxCents = Math.round(subtotalCents * 0.2);
  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    currency: 'eur',
    productClassification: PRODUCT_CLASSIFICATION,
    taxLabel: 'VAT / tax (digital AI credits) — E2E estimate',
  };
}

export function formatTaxSummaryEur(tax: CheckoutTaxLegibility): string {
  if (tax.taxCents == null || tax.taxCents <= 0) {
    return 'Tax details are available on your Stripe receipt when applicable.';
  }
  const taxEur = (tax.taxCents / 100).toFixed(2);
  const totalEur =
    tax.totalCents != null ? (tax.totalCents / 100).toFixed(2) : null;
  if (totalEur != null) {
    return `VAT/tax: €${taxEur} (total paid €${totalEur}) — ${tax.taxLabel}`;
  }
  return `VAT/tax: €${taxEur} — ${tax.taxLabel}`;
}
