/**
 * Subscription Domain Entity
 *
 * Pure domain shape mirroring `subscriptions` table rows, plus the `PlanTier`
 * value used across delivery gate, red-team gate, and data-room gate.
 */

import type { PlanTier, SubscriptionStatus } from '@repo/contracts/payments';

export type { PlanTier, SubscriptionStatus };

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tier ranking — used by entitlement checks. Higher rank wins.
 *
 * Pro > Builder is intentional: Pro is positioned above Builder in the
 * pricing narrative, and red-team review is positioned as Pro-tier.
 */
export const PLAN_TIER_RANK: Record<PlanTier, number> = {
  free: 0,
  builder: 1,
  pro: 2,
  team: 3,
};

export function planTierMeets(actual: PlanTier, required: PlanTier): boolean {
  return PLAN_TIER_RANK[actual] >= PLAN_TIER_RANK[required];
}

/**
 * Active subscription = something that should grant entitlement now. Past-due / canceled
 * keeps the user on the previous tier until period_end via `cancel_at_period_end`, but the
 * webhook-derived `users.planTier` already reflects that — this helper is for direct row
 * checks (e.g. from repository scans).
 */
export function isSubscriptionEntitling(sub: Subscription): boolean {
  if (sub.endedAt !== null) return false;
  return sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due';
}
