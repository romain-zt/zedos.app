/**
 * Wraps the subscription webhook use case so the Next.js route stays < 30 LOC.
 *
 * The pack-side route already verifies the Stripe signature via
 * `verifyStripeWebhookAndParseEnvelope`; subscription events use a separate parse here
 * because the pack envelope schema is a discriminated union over pack-specific shapes.
 */

import type { Result } from '@repo/result';
import { err, ok } from '@repo/result';
import {
  ApplicationError,
  ValidationError,
} from '@shared/errors/application-error';
import { ApplySubscriptionWebhookUseCase } from '@application/subscription/apply-subscription-webhook-usecase';
import { DrizzleSubscriptionRepository } from '@infrastructure/persistence/subscription-repository';
import {
  SubscriptionWebhookEventSchema,
  type SubscriptionWebhookEvent,
} from '@repo/contracts/payments';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'StripeSubscriptionWebhookProcessor' });

export const SUBSCRIPTION_WEBHOOK_EVENT_TYPES = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
] as const;

export type SubscriptionWebhookEventType =
  (typeof SUBSCRIPTION_WEBHOOK_EVENT_TYPES)[number];

export function isSubscriptionWebhookEventType(
  type: string,
): type is SubscriptionWebhookEventType {
  return (SUBSCRIPTION_WEBHOOK_EVENT_TYPES as readonly string[]).includes(type);
}

/**
 * `rawEvent` is the parsed Stripe event with verified signature (any-typed in the SDK).
 * We re-parse with our zod schema before mutating state.
 */
export async function processSubscriptionWebhook(
  rawEvent: unknown,
): Promise<Result<{ stripeSubscriptionId: string; planTier: string; status: string }, ApplicationError>> {
  const parsed = SubscriptionWebhookEventSchema.safeParse(rawEvent);
  if (!parsed.success) {
    logger.warn('Subscription webhook failed contract validation', {
      issues: parsed.error.flatten(),
    });
    return err(new ValidationError('Subscription event failed contract validation'));
  }

  const event: SubscriptionWebhookEvent = parsed.data;
  const useCase = new ApplySubscriptionWebhookUseCase(new DrizzleSubscriptionRepository());
  const result = await useCase.execute(event);
  if (result.isErr()) {
    return err(result.error);
  }
  const sub = result.unwrap();

  if (event.type === 'customer.subscription.created') {
    captureServer(AnalyticsEvents.SUBSCRIPTION_ACTIVATED, sub.userId, {
      plan_tier: sub.planTier,
      stripe_subscription_id: sub.stripeSubscriptionId,
    });
  } else if (event.type === 'customer.subscription.deleted') {
    captureServer(AnalyticsEvents.SUBSCRIPTION_CANCELED, sub.userId, {
      plan_tier: sub.planTier,
      stripe_subscription_id: sub.stripeSubscriptionId,
    });
  }

  return ok({
    stripeSubscriptionId: sub.stripeSubscriptionId,
    planTier: sub.planTier,
    status: sub.status,
  });
}
