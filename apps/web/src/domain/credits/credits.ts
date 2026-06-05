import type { CreditTransactionMetadata } from '@repo/contracts/credits';

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
  | 'feature_split'
  | 'user_stories'
  | 'task_split'
  | 'mini_form'
  | 'prd_challenge';

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
  balanceAfter?: number;
  operationType?: OperationType;
  metadata?: CreditTransactionMetadata;
  createdAt: Date;
}

/** Default matches `GRACE_CREDIT_CEILING` when env is unset (see `lib/credits.ts`). */
export const DEFAULT_GRACE_CREDIT_CEILING = 20;

/**
 * Result of balancing a deduct against locked user row state (`FOR UPDATE` path).
 */
export type CreditDeductionDecision =
  | { kind: 'proceed'; newBalance: number; willActivateGrace: false }
  | { kind: 'proceed-with-grace'; newBalance: number; willActivateGrace: true }
  | { kind: 'reject'; currentBalance: number; cost: number };

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
