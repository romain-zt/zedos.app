import { ICreditsRepository, CreditsLedgerMutationOptions } from '@domain/credits/credits-repository';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { OperationType } from '@domain/credits/credits';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { CreditBalanceDTO } from '@repo/contracts/credits/credits-contracts';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'DeductCreditsUseCase' });

export interface DeductCreditsInput {
  userId: string;
  amount: number;
  operationType: OperationType;
  /** Idempotency + merged into persistence metadata */
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export class DeductCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: DeductCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const options: CreditsLedgerMutationOptions | undefined =
      input.correlationId != null && input.correlationId !== ''
        ? { correlationId: input.correlationId, metadata: input.metadata ?? {} }
        : input.metadata && Object.keys(input.metadata).length > 0
          ? { metadata: input.metadata }
          : undefined;

    const deductResult = await this.creditsRepository.deductCredits(
      input.userId,
      input.amount,
      input.operationType,
      options
    );

    if (deductResult.isErr()) {
      logger.error('Deduct credits failed', { userId: input.userId, amount: input.amount });
      return deductResult as any;
    }

    const newBalance = deductResult.unwrap();
    CreditsDomainService.logDeduction(input.userId, input.amount, input.operationType);

    const dto: CreditBalanceDTO = {
      userId: newBalance.userId.value,
      amount: newBalance.amount,
      graceUsed: newBalance.graceUsed,
      starterCreditsGranted: false,
    };
    return ok(dto) as any;
  }
}
