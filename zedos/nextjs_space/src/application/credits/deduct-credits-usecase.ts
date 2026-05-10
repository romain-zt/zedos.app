import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { OperationType } from '@domain/credits/credits';
import { Result, ok, err } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'DeductCreditsUseCase' });

export interface DeductCreditsInput {
  userId: string;
  amount: number;
  operationType: OperationType;
  correlationId?: string;
}

export interface DeductCreditsOutput {
  userId: string;
  newBalance: number;
  graceActivated: boolean;
  correlationId?: string;
  idempotent?: boolean;
}

export class DeductCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: DeductCreditsInput): Promise<Result<DeductCreditsOutput, ApplicationError>> {
    const deductResult = await this.creditsRepository.deductCredits(
      input.userId,
      input.amount,
      input.operationType,
      input.correlationId
    );

    if (deductResult.isErr()) {
      logger.error('Deduct credits failed', { userId: input.userId, amount: input.amount });
      return deductResult as any;
    }

    const newBalance = deductResult.unwrap();
    CreditsDomainService.logDeduction(input.userId, input.amount, input.operationType);

    return ok({
      userId: input.userId,
      newBalance: (newBalance as any).amount,
      graceActivated: (newBalance as any).graceActivated ?? false,
      correlationId: input.correlationId,
      idempotent: (newBalance as any).idempotent,
    }) as any;
  }
}
