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
  | 'test_plan';

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
    // Negative balance is permitted when grace period has been used (first-circuit grace).
    // The grace ceiling check is enforced by CreditsDomainService.computeDeductionDecision.
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

  /**
   * Deduct with grace — balance may go negative. Only valid when willActivateGrace is true.
   */
  deductWithGrace(cost: number): CreditBalance {
    return new CreditBalance(this.userId, this.amount - cost, true);
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

/**
 * Credit Deduction Decision — returned by CreditsDomainService.computeDeductionDecision.
 * The repository uses this to determine what to do inside a locked transaction.
 */
export type CreditDeductionDecision =
  | {
      kind: 'proceed';
      newBalance: number;
      willActivateGrace: false;
    }
  | {
      kind: 'proceed-with-grace';
      newBalance: number;
      willActivateGrace: true;
    }
  | {
      kind: 'reject';
      newBalance: number;
      willActivateGrace: false;
      reason: 'insufficient-credits' | 'grace-exhausted' | 'overage-exceeds-ceiling';
    };
