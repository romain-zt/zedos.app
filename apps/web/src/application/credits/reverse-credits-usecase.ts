import { ICreditsRepository, CreditsLedgerMutationOptions } from '@domain/credits/credits-repository';
import { Result, ok } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { CreditBalanceDTO } from '@repo/contracts/credits/credits-contracts';
import { createLogger } from '@shared/observability/logger';
import { forwardErr } from '@shared/result/propagate';

const logger = createLogger({ operation: 'ReverseCreditsUseCase' });

export interface ReverseCreditsInput {
  userId: string;
  originalConsumptionCorrelationId: string;
  correlationId?: string | null;
  metadata?: CreditsLedgerMutationOptions['metadata'];
}

export class ReverseCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: ReverseCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const options: CreditsLedgerMutationOptions | undefined =
      input.correlationId != null && input.correlationId !== ''
        ? { correlationId: input.correlationId, metadata: input.metadata ?? {} }
        : input.metadata && Object.keys(input.metadata).length > 0
          ? { metadata: input.metadata }
          : undefined;

    const reverseResult = await this.creditsRepository.reverseCredits(
      input.userId,
      input.originalConsumptionCorrelationId,
      options
    );

    if (reverseResult.isErr()) {
      if (reverseResult.error instanceof NotFoundError) {
        const balanceResult = await this.creditsRepository.getBalance(input.userId);
        if (balanceResult.isErr()) {
          return forwardErr(balanceResult);
        }
        const balance = balanceResult.unwrap();
        const dto: CreditBalanceDTO = {
          userId: balance.userId.value,
          amount: balance.amount,
          graceUsed: balance.graceUsed,
          starterCreditsGranted: false,
        };
        return ok(dto);
      }
      logger.error('Reverse credits failed', {
        userId: input.userId,
        originalConsumptionCorrelationId: input.originalConsumptionCorrelationId,
      });
      return forwardErr(reverseResult);
    }

    const restored = reverseResult.unwrap();
    const dto: CreditBalanceDTO = {
      userId: restored.userId.value,
      amount: restored.amount,
      graceUsed: restored.graceUsed,
      starterCreditsGranted: false,
    };
    return ok(dto);
  }
}
