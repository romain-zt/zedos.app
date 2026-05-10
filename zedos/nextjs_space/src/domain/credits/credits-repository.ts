/**
 * Credits Repository Port
 * 
 * Defines the contract for credit persistence.
 * Domain depends on this interface; infrastructure implements it.
 */

import { CreditBalance, CreditTransaction, OperationType } from './credits';
import { Result } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';

export interface ICreditsRepository {
  /**
   * Get current credit balance for a user
   */
  getBalance(userId: string): Promise<Result<CreditBalance, ApplicationError>>;

  /**
   * Deduct credits atomically inside a row-locked transaction.
   * correlationId makes the deduct idempotent — two calls with the same id
   * are collapsed to one effect (unique partial index on credit_transactions).
   */
  deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType,
    correlationId?: string
  ): Promise<Result<CreditBalance & { graceActivated: boolean; idempotent?: boolean }, ApplicationError>>;

  /**
   * Add credits atomically inside a row-locked transaction.
   * correlationId makes the grant idempotent (Stripe webhook replay safety).
   */
  addCredits(
    userId: string,
    amount: number,
    type: 'grant' | 'purchase' | 'auto_reload',
    correlationId?: string
  ): Promise<Result<CreditBalance, ApplicationError>>;

  /**
   * Reverse a prior deduction — compensating reversal for AI failure.
   * The reversal row is written with correlationId = `${originalCorrelationId}--reverse`.
   * Idempotent: a second reversal with the same originalCorrelationId is a no-op.
   * OQ-2 decision: does NOT restore graceUsed (grace consumed on attempt).
   */
  reverseCredits(
    userId: string,
    originalCorrelationId: string
  ): Promise<Result<CreditBalance, ApplicationError>>;

  /**
   * Record credit transaction
   */
  recordTransaction(
    transaction: CreditTransaction
  ): Promise<Result<CreditTransaction, ApplicationError>>;

  /**
   * Get transaction history for user
   */
  getTransactionHistory(
    userId: string,
    limit: number
  ): Promise<Result<CreditTransaction[], ApplicationError>>;

  /**
   * Mark grace period as used
   */
  useGracePeriod(userId: string): Promise<Result<CreditBalance, ApplicationError>>;
}
