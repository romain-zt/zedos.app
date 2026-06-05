/**
 * Returns the current billing subscription view for an account.
 *
 * Free-tier users get a synthetic `null`-IDed snapshot so the UI can render the
 * "no subscription" state without a special HTTP code.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { ISubscriptionRepository } from '@domain/subscription/subscription-repository';
import { DrizzlePlanTierReader } from '@infrastructure/persistence/plan-tier-reader';
import type { BillingSubscriptionDTO } from '@repo/contracts/payments';

export class GetBillingSubscriptionUseCase {
  constructor(
    private subscriptionRepository: ISubscriptionRepository,
    private planTierReader: DrizzlePlanTierReader = new DrizzlePlanTierReader(),
  ) {}

  async execute(userId: string): Promise<Result<BillingSubscriptionDTO, ApplicationError>> {
    const tierResult = await this.planTierReader.read(userId);
    if (tierResult.isErr()) {
      return err(tierResult.error);
    }
    const tier = tierResult.unwrap();

    const subResult = await this.subscriptionRepository.findActiveByUserId(userId);
    if (subResult.isErr()) {
      return err(subResult.error);
    }
    const sub = subResult.unwrap();

    if (sub === null) {
      const dto: BillingSubscriptionDTO = {
        id: null,
        planTier: tier.planTier,
        status: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        priceLabel: null,
      };
      return ok(dto);
    }

    const dto: BillingSubscriptionDTO = {
      id: sub.id,
      planTier: sub.planTier,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd !== null ? sub.currentPeriodEnd.toISOString() : null,
      priceLabel: null,
    };
    return ok(dto);
  }
}
