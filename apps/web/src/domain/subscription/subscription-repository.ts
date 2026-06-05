/**
 * Subscription Repository Port
 */

import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { PlanTier, SubscriptionStatus } from '@repo/contracts/payments';
import type { Subscription } from './subscription';

export interface UpsertSubscriptionInput {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
}

export interface ISubscriptionRepository {
  /**
   * Idempotent upsert keyed by `stripeSubscriptionId`. Also writes `users.planTier`
   * atomically when the subscription is entitling.
   */
  upsertFromWebhook(input: UpsertSubscriptionInput): Promise<Result<Subscription, ApplicationError>>;

  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Result<Subscription | null, ApplicationError>>;

  findActiveByUserId(userId: string): Promise<Result<Subscription | null, ApplicationError>>;
}
