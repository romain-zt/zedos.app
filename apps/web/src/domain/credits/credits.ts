/**
 * Credits Domain Model
 * 
 * Represents the credit system: balance, transactions, operations, and rules.
 * Pure domain logic; no Prisma or external dependencies.
 */

import { UserId } from '../user/user';

export type OperationType =
  | 'clarification'
  | 'decision'
  | 'prd_generation'
  | 'prd_update'
  | 'adr_authoring'
  | 'feature_area'
  | 'scope_slice'
  | 'test_plan'
  | 'user_story_generation';

export type CreditTransactionType = 'grant' | 'purchase' | 'auto_reload' | 'consumption';

/**
 * Credit Operation - cost mapping
 */
export class CreditOperation {
  constructor(
    readonly type: OperationType,
    readonly cost: number
  ) {
    if (cost < 0) {
      throw new Error('Credit cost cannot be negative');
    }
  }
}

/**
 * Credit Balance Value Object
 */
export class CreditBalance {
  constructor(
    readonly userId: UserId,
    readonly amount: number,
    readonly graceUsed: boolean = false
  ) {
    if (amount < 0) {
      throw new Error('Credit balance cannot be negative');
    }
  }

  canDeduct(cost: number): boolean {
    return this.amount >= cost;
  }

  deduct(cost: number): CreditBalance {
    if (!this.canDeduct(cost)) {
      throw new Error(`Insufficient credits: ${this.amount} < ${cost}`);
    }
    return new CreditBalance(this.userId, this.amount - cost, this.graceUsed);
  }

  add(amount: number): CreditBalance {
    if (amount < 0) {
      throw new Error('Cannot add negative credits');
    }
    return new CreditBalance(this.userId, this.amount + amount, this.graceUsed);
  }

  useGrace(): CreditBalance {
    if (this.graceUsed) {
      throw new Error('Grace period already used');
    }
    return new CreditBalance(this.userId, this.amount, true);
  }
}

/**
 * Credit Transaction - immutable record of credit movement
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  operationType?: OperationType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Credit Check Result - used to determine if an operation can proceed
 */
export interface CreditCheckResult {
  canProceed: boolean;
  currentBalance: number;
  requiredAmount: number;
  graceApplicable: boolean;
  graceWillExpire: boolean;
  message: string;
}
