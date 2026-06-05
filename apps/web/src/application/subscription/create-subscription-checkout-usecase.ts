/**
 * Wraps the Stripe Builder subscription checkout call into a Result<T, E> use case.
 */

import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  ExternalServiceError,
  ValidationError,
} from '@shared/errors/application-error';
import {
  createBuilderSubscriptionCheckout,
  type SubscriptionFlowResult,
} from '@infrastructure/payments/stripe-subscription-flows';
import type { PlanTier } from '@repo/contracts/payments';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'CreateSubscriptionCheckoutUseCase' });

export interface CreateSubscriptionCheckoutInput {
  userId: string;
  planTier: PlanTier;
  origin: string;
}

export interface CreateSubscriptionCheckoutOutput {
  url: string;
}

export class CreateSubscriptionCheckoutUseCase {
  async execute(
    input: CreateSubscriptionCheckoutInput,
  ): Promise<Result<CreateSubscriptionCheckoutOutput, ApplicationError>> {
    if (input.planTier !== 'builder') {
      return err(new ValidationError('Only Builder Monthly is purchasable in v1'));
    }

    const flow: SubscriptionFlowResult<{ url: string }> =
      await createBuilderSubscriptionCheckout({
        userId: input.userId,
        origin: input.origin,
      });

    if (flow.ok === false) {
      logger.warn('Builder checkout failed', { status: flow.status, userId: input.userId });
      return err(new ExternalServiceError('payment', flow.error, flow.status));
    }

    return ok({ url: flow.value.url });
  }
}
