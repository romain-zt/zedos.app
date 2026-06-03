/**
 * Grants credits from a validated `checkout.session.completed` Stripe webhook envelope,
 * marks purchase completed, records webhook idempotency row.
 */

import type { CheckoutSessionCompletedEvent } from '@repo/contracts/payments/webhook';
import type { Result } from '@repo/result';
import { ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  ValidationError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';
import {
  processCheckoutWebhookAtomically,
  getUserCreditBalance as loadUserCreditBalance,
} from '@infrastructure/persistence/stripe-checkout-webhook-persistence';
import { resolvePaymentMethodFromCheckoutSession } from '@infrastructure/payments/stripe-off-session-auto-reload';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';
import { AnalyticsEvents, balanceBucketFromCount } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';

const logger = createLogger({ service: 'CheckoutSessionWebhookProcessor' });

export async function processCheckoutSessionCompletedWebhook(
  event: CheckoutSessionCompletedEvent
): Promise<Result<{ balance: number; duplicateStripeEvent: boolean }, ApplicationError>> {
  const eventId = event.id;

  try {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return err(new ValidationError('Checkout session not paid; skipping credit grant'));
    }

    const userId = session.metadata.userId;
    const purchaseId = session.metadata.purchaseId;
    const packSize = parseInt(session.metadata.packSize, 10);

    if (!userId || !purchaseId || !packSize || Number.isNaN(packSize) || packSize <= 0) {
      return err(new ValidationError('Invalid checkout session metadata for credit grant'));
    }

    const paymentIntent =
      typeof session.payment_intent === 'string' && session.payment_intent.length > 0
        ? session.payment_intent
        : null;

    const processResult = await processCheckoutWebhookAtomically({
      eventId,
      eventType: event.type,
      userId,
      purchaseId,
      packSize,
      stripeSessionId: session.id,
      paymentIntent,
    });

    if (processResult.kind === 'duplicate') {
      return ok({ balance: processResult.balance, duplicateStripeEvent: true });
    }
    if (processResult.kind === 'invalid_purchase') {
      return err(new ValidationError('Purchase not found or user mismatch'));
    }

    const packIdMeta = session.metadata.packId ?? session.metadata.packSize;
    captureServer(AnalyticsEvents.CREDIT_PACK_CHECKOUT_COMPLETED, userId, {
      pack_id: packIdMeta,
      balance_bucket: balanceBucketFromCount(processResult.balance),
    });

    const paymentMethod = await resolvePaymentMethodFromCheckoutSession(session.id);
    if (paymentMethod) {
      await new DrizzleAutoReloadRepository().saveStripePaymentMethod(
        userId,
        paymentMethod.customerId,
        paymentMethod.paymentMethodId
      );
    }

    return ok({ balance: processResult.balance, duplicateStripeEvent: false });
  } catch (error) {
    logger.error('Checkout webhook processing failed', error);
    return err(new DatabaseError('Failed to process checkout webhook'));
  }
}

/** Loads current balance for duplicate Stripe event acknowledgment */
export async function getUserCreditBalance(userId: string): Promise<number> {
  return loadUserCreditBalance(userId);
}
