/**
 * Prisma adapter for ProcessedWebhookEvent (Stripe webhook idempotency).
 */

import { IProcessedWebhookEventRepository } from '@domain/payments/processed-webhook-event-repository';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@shared/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({ service: 'ProcessedWebhookEventRepository' });

export class PrismaProcessedWebhookEventRepository implements IProcessedWebhookEventRepository {
  constructor(private prisma: PrismaClient) {}

  async recordEvent(
    eventId: string,
    eventType: string
  ): Promise<Result<{ idempotent: boolean }, ApplicationError>> {
    try {
      await this.prisma.processedWebhookEvent.create({
        data: {
          id: uuidv4(),
          eventId,
          eventType,
        },
      });
      logger.info('Webhook event recorded', { eventId, eventType });
      return ok({ idempotent: false }) as any;
    } catch (e: any) {
      // Prisma unique constraint violation code
      if (e?.code === 'P2002') {
        logger.info('Webhook event already processed (idempotent)', { eventId });
        return ok({ idempotent: true }) as any;
      }
      logger.error('Failed to record webhook event', e);
      return err(new DatabaseError('Failed to record webhook event')) as any;
    }
  }
}
