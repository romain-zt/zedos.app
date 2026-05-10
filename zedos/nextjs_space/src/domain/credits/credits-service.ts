/**
 * Credits Domain Service
 * 
 * Pure domain logic for credit operations.
 * No I/O; coordinates between repositories and domain rules.
 */

import { CreditBalance, CreditOperation, OperationType, CreditCheckResult } from './credits';
import { UserId } from '../user/user';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'CreditsService' });

export class CreditsDomainService {
  /**
   * Determine if an operation can proceed
   */
  static canOperationProceed(
    operationCost: number,
    currentBalance: number,
    gracePeriodAvailable: boolean,
    graceAlreadyUsed: boolean
  ): { canProceed: boolean; useGrace: boolean } {
    if (currentBalance >= operationCost) {
      return { canProceed: true, useGrace: false };
    }

    if (gracePeriodAvailable && !graceAlreadyUsed && currentBalance + 20 >= operationCost) {
      return { canProceed: true, useGrace: true };
    }

    return { canProceed: false, useGrace: false };
  }

  /**
   * Build credit check result
   */
  static buildCreditCheckResult(
    canProceed: boolean,
    currentBalance: number,
    requiredAmount: number,
    gracePeriodAvailable: boolean,
    graceAlreadyUsed: boolean,
    willUseGrace: boolean
  ): CreditCheckResult {
    if (canProceed) {
      if (willUseGrace) {
        return {
          canProceed: true,
          currentBalance,
          requiredAmount,
          graceApplicable: true,
          graceWillExpire: true,
          message: `Operation approved using grace period (one-time). Your balance will be insufficient afterward.`,
        };
      }
      return {
        canProceed: true,
        currentBalance,
        requiredAmount,
        graceApplicable: false,
        graceWillExpire: false,
        message: 'Operation approved.',
      };
    }

    if (gracePeriodAvailable && !graceAlreadyUsed) {
      return {
        canProceed: false,
        currentBalance,
        requiredAmount,
        graceApplicable: true,
        graceWillExpire: false,
        message: `Insufficient credits (${currentBalance}/${requiredAmount}). Grace period available (one-time, 20 credits).`,
      };
    }

    return {
      canProceed: false,
      currentBalance,
      requiredAmount,
      graceApplicable: false,
      graceWillExpire: false,
      message: `Insufficient credits (${currentBalance}/${requiredAmount}). Please purchase more credits.`,
    };
  }

  /**
   * Log credit deduction
   */
  static logDeduction(userId: string, amount: number, operation: OperationType) {
    logger.info('Credits deducted', {
      userId,
      amount,
      operation,
    });
  }

  /**
   * Log credit addition
   */
  static logAddition(userId: string, amount: number, type: string) {
    logger.info('Credits added', {
      userId,
      amount,
      type,
    });
  }
}
