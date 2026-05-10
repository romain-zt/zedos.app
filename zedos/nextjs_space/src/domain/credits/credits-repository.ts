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
   * Deduct credits and record transaction atomically
   */
  deductCredits(
    userId: string,
    amount: number,
    operationType: OperationType
  ): Promise<Result<CreditBalance, ApplicationError>>;

  /**
   * Add credits and record transaction atomically
   */
  addCredits(
    userId: string,
    amount: number,
    type: 'grant' | 'purchase' | 'auto_reload'
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
