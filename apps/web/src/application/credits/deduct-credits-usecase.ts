import { ICreditsRepository } from '@domain/credits/credits-repository';
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
}

export class DeductCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: DeductCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const deductResult = await this.creditsRepository.deductCredits(
      input.userId,
      input.amount,
      input.operationType
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
