/**
 * Port for Stripe webhook idempotency table.
 * Infrastructure implements this; application calls it.
 */

import { Result } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface IProcessedWebhookEventRepository {
  /**
   * Record a webhook event as processed.
   * Returns idempotent=true if the event was already recorded (conflict on unique eventId).
   * Returns idempotent=false if this was the first recording.
   */
  recordEvent(
    eventId: string,
    eventType: string
  ): Promise<Result<{ idempotent: boolean }, ApplicationError>>;
}
