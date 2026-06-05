/**
 * Env reader for Builder subscription configuration.
 *
 * Single source of operator settings. Read at request time so changes flip live
 * without restart. Treats missing values as "subscription not configured" — the
 * route handlers map this to HTTP 503, consistent with the existing pack-checkout
 * 503 contract when STRIPE_SECRET_KEY is absent.
 */

import type { PlanTier } from '@repo/contracts/payments';

export interface SubscriptionConfig {
  builderPriceId: string;
  builderMonthlyEur: number;
  builderPlanLabel: string;
  customerPortalConfigId: string | null;
  automaticTaxEnabled: boolean;
}

export interface SubscriptionConfigError {
  reason: 'missing_price' | 'missing_amount';
  detail: string;
}

export type SubscriptionConfigResult =
  | { ok: true; config: SubscriptionConfig }
  | { ok: false; error: SubscriptionConfigError };

function readEnv(name: string): string | null {
  const v = process.env[name];
  if (v === undefined) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function loadSubscriptionConfig(): SubscriptionConfigResult {
  const priceId = readEnv('STRIPE_BUILDER_PRICE_ID');
  if (priceId === null) {
    return {
      ok: false,
      error: {
        reason: 'missing_price',
        detail: 'STRIPE_BUILDER_PRICE_ID is not set',
      },
    };
  }

  const rawAmount = readEnv('STRIPE_BUILDER_MONTHLY_EUR');
  const builderMonthlyEur = rawAmount === null ? 19 : Number.parseInt(rawAmount, 10);
  if (!Number.isFinite(builderMonthlyEur) || builderMonthlyEur <= 0) {
    return {
      ok: false,
      error: {
        reason: 'missing_amount',
        detail: 'STRIPE_BUILDER_MONTHLY_EUR must be a positive integer (euros)',
      },
    };
  }

  return {
    ok: true,
    config: {
      builderPriceId: priceId,
      builderMonthlyEur,
      builderPlanLabel: readEnv('BUILDER_PLAN_NAME') ?? 'Zedos Builder Monthly',
      customerPortalConfigId: readEnv('STRIPE_PORTAL_CONFIG_ID'),
      automaticTaxEnabled: readEnv('STRIPE_AUTOMATIC_TAX_ENABLED') !== '0',
    },
  };
}

/**
 * Maps a Stripe price ID back to a plan tier. Today only Builder is sold via self-serve
 * checkout; Pro / Team are operator-issued. Future tiers can register here.
 */
export function planTierForPriceId(stripePriceId: string): PlanTier {
  const builder = readEnv('STRIPE_BUILDER_PRICE_ID');
  if (builder !== null && builder === stripePriceId) return 'builder';
  const pro = readEnv('STRIPE_PRO_PRICE_ID');
  if (pro !== null && pro === stripePriceId) return 'pro';
  const team = readEnv('STRIPE_TEAM_PRICE_ID');
  if (team !== null && team === stripePriceId) return 'team';
  return 'builder';
}
