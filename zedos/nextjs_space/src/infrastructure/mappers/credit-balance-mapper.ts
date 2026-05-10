/**
 * Credit Balance Mapper
 * 
 * Converts between: CreditBalance (domain) ↔ CreditBalanceDTO
 */

import { Mapper } from '@shared/mappers/mapper';
import { CreditBalance } from '@domain/credits/credits';
import { CreditBalanceDTO } from '@contracts/credits/credits-contracts';

export class CreditBalanceMapper extends Mapper<CreditBalance, any, CreditBalanceDTO> {
  toPersistence(domain: CreditBalance): any {
    return {
      userId: domain.userId.value,
      amount: domain.amount,
      graceUsed: domain.graceUsed,
    };
  }

  toDomain(persistence: any): CreditBalance {
    const { UserId } = require('@domain/user/user');
    return new CreditBalance(new UserId(persistence.userId), persistence.amount, persistence.graceUsed);
  }

  toDTO(domain: CreditBalance): CreditBalanceDTO {
    return {
      userId: domain.userId.value,
      amount: domain.amount,
      graceUsed: domain.graceUsed,
      starterCreditsGranted: false, // Tracked separately in User
    };
  }
}

export const creditBalanceMapper = new CreditBalanceMapper();
