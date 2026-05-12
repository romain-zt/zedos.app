/**
 * Credits Domain Service
 * 
 * Pure domain logic for credit operations.
 * No I/O; coordinates between repositories and domain rules.
 */

import {
  OperationType,
  CreditCheckResult,
  CreditDeductionDecision,
  DEFAULT_GRACE_CREDIT_CEILING,
} from './credits';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'CreditsService' });

export class CreditsDomainService {
  /**
   * Locked-row deduct verdict: single authority for concurrent deduct + libCredits (`FOR UPDATE`).
   *
   * @param lockedGraceUsed Same semantics as persisted `grace_used`: once true, grace cannot apply again (OQ-2).
   */
  static computeDeductionDecision(
    lockedBalance: number,
    lockedGraceUsed: boolean,
    cost: number,
    graceCreditCeiling: number = DEFAULT_GRACE_CREDIT_CEILING
  ): CreditDeductionDecision {
    if (lockedBalance >= cost) {
      return {
        kind: 'proceed',
        newBalance: lockedBalance - cost,
        willActivateGrace: false,
      };
    }

    if (!lockedGraceUsed && cost - lockedBalance <= graceCreditCeiling) {
      return {
        kind: 'proceed-with-grace',
        newBalance: lockedBalance - cost,
        willActivateGrace: true,
      };
    }

    return { kind: 'reject', currentBalance: lockedBalance, cost };
  }

  /**
   * Determine if an operation can proceed
   */
  static canOperationProceed(
    operationCost: number,
    currentBalance: number,
    gracePeriodAvailable: boolean,
    graceAlreadyUsed: boolean,
    graceCreditCeiling: number = DEFAULT_GRACE_CREDIT_CEILING
  ): { canProceed: boolean; useGrace: boolean } {
    const d = CreditsDomainService.computeDeductionDecision(
      currentBalance,
      graceAlreadyUsed,
      operationCost,
      graceCreditCeiling
    );

    const balanceOkWithoutGrace = currentBalance >= operationCost;

    if (!gracePeriodAvailable) {
      return { canProceed: balanceOkWithoutGrace, useGrace: false };
    }

    switch (d.kind) {
      case 'proceed':
        return { canProceed: true, useGrace: false };
      case 'proceed-with-grace':
        return { canProceed: true, useGrace: true };
      default:
        return { canProceed: false, useGrace: false };
    }
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
