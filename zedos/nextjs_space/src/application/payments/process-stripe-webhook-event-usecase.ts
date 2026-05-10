/**
 * ProcessStripeWebhookEventUseCase
 *
 * Handles a verified Stripe webhook event:
 * - Records idempotency via ProcessedWebhookEvent table
 * - On checkout.session.completed: grants credits + updates Purchase status
 * - On duplicate event: returns idempotent success
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { IProcessedWebhookEventRepository } from '@domain/payments/processed-webhook-event-repository';
import {
  WebhookEventEnvelopeSchema,
  WebhookEventEnvelope,
} from '@contracts/payments/webhook';
import { Result, ok, err } from '@shared/result/result';
import {
  ApplicationError,
  ValidationError,
  DatabaseError,
} from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ProcessStripeWebhookEventUseCase' });

export interface ProcessStripeWebhookEventInput {
  rawEventPayload: unknown;
}

export interface ProcessStripeWebhookEventOutput {
  idempotent: boolean;
  eventId: string;
  eventType: string;
  creditsGranted?: number;
  userId?: string;
}

export class ProcessStripeWebhookEventUseCase {
  constructor(
    private creditsRepository: ICreditsRepository,
    private webhookEventRepository: IProcessedWebhookEventRepository,
    private prisma: PrismaClient
  ) {}

  async execute(
    input: ProcessStripeWebhookEventInput
  ): Promise<Result<ProcessStripeWebhookEventOutput, ApplicationError>> {
    const parsed = WebhookEventEnvelopeSchema.safeParse(input.rawEventPayload);
    if (!parsed.success) {
      return err(
        new ValidationError('Invalid webhook event payload', {
          issues: parsed.error.flatten(),
        })
      ) as any;
    }

    const event: WebhookEventEnvelope = parsed.data;

    const recordResult = await this.webhookEventRepository.recordEvent(event.id, event.type);
    if (recordResult.isErr()) return recordResult as any;

    if (recordResult.unwrap().idempotent) {
      logger.info('Webhook event already processed', { eventId: event.id, eventType: event.type });
      return ok({
        idempotent: true,
        eventId: event.id,
        eventType: event.type,
      }) as any;
    }

    if (event.type === 'checkout.session.completed') {
      return await this.handleCheckoutSessionCompleted(event as any);
    }

    logger.info('Webhook event type handled as no-op', { eventType: event.type });
    return ok({ idempotent: false, eventId: event.id, eventType: event.type }) as any;
  }

  private async handleCheckoutSessionCompleted(
    event: any
  ): Promise<Result<ProcessStripeWebhookEventOutput, ApplicationError>> {
    const sessionObj = event.data.object;

    if (sessionObj.payment_status !== 'paid') {
      logger.info('Checkout session not paid — skipping credit grant', {
        eventId: event.id,
        paymentStatus: sessionObj.payment_status,
      });
      return ok({ idempotent: false, eventId: event.id, eventType: event.type }) as any;
    }

    const { userId, purchaseId, packSize } = sessionObj.metadata;
    const packSizeNum = parseInt(packSize, 10);

    try {
      const addResult = await this.creditsRepository.addCredits(
        userId,
        packSizeNum,
        'purchase',
        event.id
      );

      if (addResult.isErr()) return addResult as any;

      await this.prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'completed',
          stripePaymentIntentId: (sessionObj.payment_intent as string) ?? null,
        },
      });

      logger.info('Credits granted via webhook', {
        eventId: event.id,
        userId,
        packSize: packSizeNum,
        purchaseId,
      });

      return ok({
        idempotent: false,
        eventId: event.id,
        eventType: event.type,
        creditsGranted: packSizeNum,
        userId,
      }) as any;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown error';
      return err(new DatabaseError(`Failed to process checkout session: ${message}`)) as any;
    }
  }
}
