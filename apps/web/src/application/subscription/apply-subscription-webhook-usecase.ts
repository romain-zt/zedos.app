/**
 * Applies a Stripe `customer.subscription.{created|updated|deleted}` event to the local
 * mirror table and plan-tier column.
 *
 * Idempotent — keyed on `stripeSubscriptionId`. Missing `metadata.userId` aborts with a
 * ValidationError so the webhook handler returns 400 rather than 200 (Stripe will retry).
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import { ISubscriptionRepository } from '@domain/subscription/subscription-repository';
import type { Subscription } from '@domain/subscription/subscription';
import type {
  PlanTier,
  SubscriptionStatus,
  SubscriptionWebhookEvent,
} from '@repo/contracts/payments';
import { planTierForPriceId } from '@infrastructure/payments/subscription-config';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ApplySubscriptionWebhookUseCase' });

export class ApplySubscriptionWebhookUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(
    event: SubscriptionWebhookEvent,
  ): Promise<Result<Subscription, ApplicationError>> {
    const obj = event.data.object;
    const userId = obj.metadata?.userId;
    if (typeof userId !== 'string' || userId.length === 0) {
      logger.warn('Subscription webhook missing userId metadata', {
        stripeSubscriptionId: obj.id,
      });
      return err(new ValidationError('Subscription event missing userId metadata'));
    }

    const stripePriceId = obj.items.data[0]?.price.id;
    if (typeof stripePriceId !== 'string' || stripePriceId.length === 0) {
      return err(new ValidationError('Subscription event missing price id'));
    }

    const status: SubscriptionStatus = obj.status;
    const cancelAtPeriodEnd = obj.cancel_at_period_end;

    const planTier: PlanTier =
      obj.metadata?.planTier !== undefined
        ? obj.metadata.planTier
        : planTierForPriceId(stripePriceId);

    const currentPeriodEnd =
      typeof obj.current_period_end === 'number'
        ? new Date(obj.current_period_end * 1000)
        : null;

    const endedAt =
      event.type === 'customer.subscription.deleted' || typeof obj.ended_at === 'number'
        ? typeof obj.ended_at === 'number'
          ? new Date(obj.ended_at * 1000)
          : new Date()
        : null;

    const result = await this.subscriptionRepository.upsertFromWebhook({
      userId,
      stripeCustomerId: obj.customer,
      stripeSubscriptionId: obj.id,
      stripePriceId,
      planTier,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd,
      endedAt,
    });

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.unwrap());
  }
}
