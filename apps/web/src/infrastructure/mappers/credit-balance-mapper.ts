/**
 * Credit Balance Mapper
 *
 * Converts between: CreditBalance (domain) ↔ persistence row ↔ CreditBalanceDTO
 */

import { Mapper } from '@shared/mappers/mapper';
import { CreditBalance } from '@domain/credits/credits';
import { UserId } from '@domain/user/user';
import { CreditBalanceDTO } from '@repo/contracts/credits/credits-contracts';

export type CreditBalancePersistenceRow = {
  userId: string;
  amount: number;
  graceUsed: boolean;
};

export class CreditBalanceMapper extends Mapper<
  CreditBalance,
  CreditBalancePersistenceRow,
  CreditBalanceDTO
> {
  toPersistence(domain: CreditBalance): CreditBalancePersistenceRow {
    return {
      userId: domain.userId.value,
      amount: domain.amount,
      graceUsed: domain.graceUsed,
    };
  }

  toDomain(persistence: CreditBalancePersistenceRow): CreditBalance {
    return new CreditBalance(
      new UserId(persistence.userId),
      persistence.amount,
      persistence.graceUsed
    );
  }

  toDTO(domain: CreditBalance): CreditBalanceDTO {
    return {
      userId: domain.userId.value,
      amount: domain.amount,
      graceUsed: domain.graceUsed,
      starterCreditsGranted: false,
    };
  }
}

export const creditBalanceMapper = new CreditBalanceMapper();
