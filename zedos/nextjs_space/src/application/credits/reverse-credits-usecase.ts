/**
 * ReverseCreditsUseCase — compensating reversal for AI failure.
 *
 * Called when an AI operation fails after a deduct may have happened.
 * Per OQ-2: reversal does NOT restore graceUsed (grace consumed on attempt).
 * Idempotent: safe to call multiple times with the same originalCorrelationId.
 */

import { ICreditsRepository } from '@domain/credits/credits-repository';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ReverseCreditsUseCase' });

export interface ReverseCreditsInput {
  userId: string;
  originalCorrelationId: string;
}

export interface ReverseCreditsOutput {
  userId: string;
  newBalance: number;
  reversed: boolean;
}

export class ReverseCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: ReverseCreditsInput): Promise<Result<ReverseCreditsOutput, ApplicationError>> {
    const reverseResult = await this.creditsRepository.reverseCredits(
      input.userId,
      input.originalCorrelationId
    );

    if (reverseResult.isErr()) {
      logger.error('Reverse credits failed', {
        userId: input.userId,
        originalCorrelationId: input.originalCorrelationId,
      });
      return reverseResult as any;
    }

    const newBalance = reverseResult.unwrap();
    logger.info('Credits reversed', {
      userId: input.userId,
      originalCorrelationId: input.originalCorrelationId,
      newBalance: (newBalance as any).amount,
    });

    return ok({
      userId: input.userId,
      newBalance: (newBalance as any).amount,
      reversed: true,
    }) as any;
  }
}
