import { ICreditsRepository } from '@domain/credits/credits-repository';
import { CreditsDomainService } from '@domain/credits/credits-service';
import { Result, ok, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import { CreditBalanceDTO } from '@repo/contracts/credits/credits-contracts';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'AddCreditsUseCase' });

export interface AddCreditsInput {
  userId: string;
  amount: number;
  type: 'grant' | 'purchase' | 'auto_reload';
}

export class AddCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: AddCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const addResult = await this.creditsRepository.addCredits(
      input.userId,
      input.amount,
      input.type
    );

    if (addResult.isErr()) {
      logger.error('Add credits failed', { userId: input.userId, amount: input.amount });
      return addResult as any;
    }

    const newBalance = addResult.unwrap();
    CreditsDomainService.logAddition(input.userId, input.amount, input.type);

    const dto: CreditBalanceDTO = {
      userId: newBalance.userId.value,
      amount: newBalance.amount,
      graceUsed: newBalance.graceUsed,
      starterCreditsGranted: false,
    };
    return ok(dto) as any;
  }
}
