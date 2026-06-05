/**
 * Returns a Stripe Customer Portal URL for managing the active subscription.
 *
 * Refuses when the user has no active subscription (no Stripe customer to point at).
 */

import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  ExternalServiceError,
  NotFoundError,
} from '@shared/errors/application-error';
import { ISubscriptionRepository } from '@domain/subscription/subscription-repository';
import { createCustomerPortalSession } from '@infrastructure/payments/stripe-subscription-flows';

export interface OpenCustomerPortalInput {
  userId: string;
  returnUrl: string;
}

export interface OpenCustomerPortalOutput {
  url: string;
}

export class OpenCustomerPortalUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(
    input: OpenCustomerPortalInput,
  ): Promise<Result<OpenCustomerPortalOutput, ApplicationError>> {
    const activeResult = await this.subscriptionRepository.findActiveByUserId(input.userId);
    if (activeResult.isErr()) {
      return err(activeResult.error);
    }
    const active = activeResult.unwrap();
    if (active === null) {
      return err(new NotFoundError('No active subscription to manage'));
    }

    const portal = await createCustomerPortalSession({
      stripeCustomerId: active.stripeCustomerId,
      returnUrl: input.returnUrl,
    });

    if (portal.ok === false) {
      return err(new ExternalServiceError('payment', portal.error, portal.status));
    }

    return ok({ url: portal.value.url });
  }
}
