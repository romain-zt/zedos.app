import { ICreditsRepository, CreditsLedgerMutationOptions } from '@domain/credits/credits-repository';
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
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export class AddCreditsUseCase {
  constructor(private creditsRepository: ICreditsRepository) {}

  async execute(input: AddCreditsInput): Promise<Result<CreditBalanceDTO, ApplicationError>> {
    const options: CreditsLedgerMutationOptions | undefined =
      input.correlationId != null && input.correlationId !== ''
        ? { correlationId: input.correlationId, metadata: input.metadata ?? {} }
        : input.metadata && Object.keys(input.metadata).length > 0
          ? { metadata: input.metadata }
          : undefined;

    const addResult = await this.creditsRepository.addCredits(input.userId, input.amount, input.type, options);

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
