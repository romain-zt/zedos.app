import { ICreditsRepository } from '@domain/credits/credits-repository';
import { Result, ok } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { CreditBalanceDTO } from '@repo/contracts/credits/credits-contracts';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'ReverseCreditsUseCase' });

export interface ReverseCreditsInput {
  userId: string;
  originalDeductionCorrelationId: string;
  reversalCorrelationId: string;
  metadata?: Record<string, unknown>;
}

export class ReverseCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: ReverseCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const reverseResult = await this.creditsRepository.reverseCredits(
      input.userId,
      input.originalDeductionCorrelationId,
      input.reversalCorrelationId,
      input.metadata
    );

    if (reverseResult.isErr()) {
      logger.error('Reverse credits failed', {
        userId: input.userId,
        originalDeductionCorrelationId: input.originalDeductionCorrelationId,
      });
      return reverseResult as any;
    }

    const newBalance = reverseResult.unwrap();
    const dto: CreditBalanceDTO = {
      userId: newBalance.userId.value,
      amount: newBalance.amount,
      graceUsed: newBalance.graceUsed,
      starterCreditsGranted: false,
    };
    return ok(dto) as any;
  }
}
