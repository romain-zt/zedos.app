import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { OperationType, CreditCheckResult } from '@domain/credits/credits';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'CheckCreditsUseCase' });

export interface CheckCreditsInput {
  userId: string;
  operationType: OperationType;
  operationCost: number;
}

export class CheckCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: CheckCreditsInput): Promise<Result<CreditCheckResult, ApplicationError>> {
    const balanceResult = await this.creditsRepository.getBalance(input.userId);
    if (balanceResult.isErr()) {
      logger.error('Check credits failed', { userId: input.userId });
      return balanceResult as any;
    }
    const balance = balanceResult.unwrap();

    const gracePeriodAvailable = parseInt(process.env.ENABLE_GRACE_PERIOD || '1') === 1;
    const { canProceed, useGrace } = CreditsDomainService.canOperationProceed(
      input.operationCost,
      balance.amount,
      gracePeriodAvailable,
      balance.graceUsed
    );

    const result = CreditsDomainService.buildCreditCheckResult(
      canProceed,
      balance.amount,
      input.operationCost,
      gracePeriodAvailable,
      balance.graceUsed,
      useGrace
    );

    logger.info('Credit check completed', {
      userId: input.userId,
      operation: input.operationType,
      canProceed,
    });

    return ok(result) as any;
  }
}
