/**
 * Credits Domain Service
 * 
 * Pure domain logic for credit operations.
 * No I/O; coordinates between repositories and domain rules.
 */

import { CreditBalance, CreditOperation, OperationType, CreditCheckResult, CreditDeductionDecision } from './credits';
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
   * Compute the deduction decision inside a locked transaction.
   * Called with the balance and graceUsed from the locked row (SELECT FOR UPDATE).
   * Returns a discriminated union so the repo knows exactly what to write.
   *
   * Decision rules (per PRD):
   *   - balance >= cost → 'proceed'
   *   - balance < cost AND grace not used AND overage <= GRACE_CEILING → 'proceed-with-grace'
   *   - balance < cost AND grace not used AND overage > GRACE_CEILING → 'reject' (overage-exceeds-ceiling)
   *   - balance < cost AND grace already used → 'reject' (grace-exhausted)
   */
  static computeDeductionDecision(
    lockedBalance: number,
    lockedGraceUsed: boolean,
    cost: number,
    graceCeiling: number = parseInt(process.env.GRACE_CREDIT_CEILING ?? '20', 10)
  ): CreditDeductionDecision {
    if (lockedBalance >= cost) {
      return { kind: 'proceed', newBalance: lockedBalance - cost, willActivateGrace: false };
    }

    const overage = cost - lockedBalance;

    if (!lockedGraceUsed) {
      if (overage <= graceCeiling) {
        return {
          kind: 'proceed-with-grace',
          newBalance: lockedBalance - cost,
          willActivateGrace: true,
        };
      }
      return {
        kind: 'reject',
        newBalance: lockedBalance,
        willActivateGrace: false,
        reason: 'overage-exceeds-ceiling',
      };
    }

    return {
      kind: 'reject',
      newBalance: lockedBalance,
      willActivateGrace: false,
      reason: 'grace-exhausted',
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
