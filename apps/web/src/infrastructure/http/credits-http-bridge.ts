/**
 * HTTP-layer helpers for credit checks/consumption via composed use cases.
 * Used by App Router API routes instead of `@/lib/credits`.
 */

import type { OperationType as DomainOperationType } from '@domain/credits/credits';
import type { CreditCheckResult as DomainCreditCheckResult } from '@domain/credits/credits';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import type { CreditTransactionMetadata } from '@repo/contracts/credits';
import type { AutoReloadAttemptOutcome } from '@repo/contracts/payments';
import { getCreditsComposition } from '@/lib/composition';
import { AttemptAutoReloadUseCase } from '@application/auto-reload/attempt-auto-reload-usecase';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';

export type ApiCreditOperationType =
  | 'clarification'
  | 'decision'
  | 'mini_form'
  | 'prd_generation'
  | 'prd_challenge'
  | 'feature_split'
  | 'user_stories'
  | 'task_split';

function toDomainOperation(operationType: ApiCreditOperationType): DomainOperationType {
  return operationType as DomainOperationType;
}

export function getCreditCost(operationType: ApiCreditOperationType): number {
  const costs: Record<ApiCreditOperationType, number> = {
    clarification: parseInt(process.env.CREDIT_COST_CLARIFICATION ?? '1', 10),
    decision: parseInt(process.env.CREDIT_COST_DECISION ?? '3', 10),
    mini_form: parseInt(process.env.CREDIT_COST_MINI_FORM ?? '5', 10),
    prd_generation: parseInt(process.env.CREDIT_COST_PRD_GENERATION ?? '10', 10),
    prd_challenge: parseInt(process.env.CREDIT_COST_PRD_CHALLENGE ?? '15', 10),
    feature_split: parseInt(process.env.CREDIT_COST_FEATURE_SPLIT ?? '5', 10),
    user_stories: parseInt(process.env.CREDIT_COST_USER_STORIES ?? '5', 10),
    task_split: parseInt(process.env.CREDIT_COST_TASK_SPLIT ?? '5', 10),
  };
  return costs[operationType] ?? 1;
}

export interface CreditCheckHttpResult {
  allowed: boolean;
  reason?: string;
  currentBalance: number;
  cost: number;
  wouldUseGrace: boolean;
  graceAlreadyUsed: boolean;
  autoReloadOutcome?: AutoReloadAttemptOutcome;
}

function domainCheckToHttp(
  d: DomainCreditCheckResult,
  graceUsedFromBalance: boolean
): Omit<CreditCheckHttpResult, 'cost'> & { cost: number } {
  const wouldUseGrace = !!(d.canProceed && d.graceApplicable && d.graceWillExpire);
  const graceAlreadyUsed = d.canProceed
    ? wouldUseGrace
      ? false
      : graceUsedFromBalance
    : !d.graceApplicable;

  return {
    allowed: d.canProceed,
    reason: d.canProceed ? undefined : d.message,
    currentBalance: d.currentBalance,
    cost: d.requiredAmount,
    wouldUseGrace,
    graceAlreadyUsed,
  };
}

export async function checkCreditsForApi(
  userId: string,
  operationType: ApiCreditOperationType
): Promise<CreditCheckHttpResult> {
  const { repo, checkCredits: checkCreditsUc } = getCreditsComposition();
  const cost = getCreditCost(operationType);

  const balResult = await repo.getBalance(userId);
  if (balResult.isErr()) {
    if (balResult.error instanceof NotFoundError) {
      return {
        allowed: false,
        reason: 'User not found',
        currentBalance: 0,
        cost: 0,
        wouldUseGrace: false,
        graceAlreadyUsed: false,
      };
    }
    return {
      allowed: false,
      reason: balResult.error.message ?? 'Credit check failed',
      currentBalance: 0,
      cost,
      wouldUseGrace: false,
      graceAlreadyUsed: false,
    };
  }
  const graceUsedFromBalance = balResult.unwrap().graceUsed;

  const result = await checkCreditsUc.execute({
    userId,
    operationType: toDomainOperation(operationType),
    operationCost: cost,
  });

  if (result.isErr()) {
    return {
      allowed: false,
      reason: result.error.message,
      currentBalance: 0,
      cost,
      wouldUseGrace: false,
      graceAlreadyUsed: graceUsedFromBalance,
    };
  }

  const domainCheck = result.unwrap();
  if (domainCheck.canProceed) {
    return domainCheckToHttp(domainCheck, graceUsedFromBalance);
  }

  if (!domainCheck.graceApplicable) {
    const attemptUc = new AttemptAutoReloadUseCase(new DrizzleAutoReloadRepository());
    const reload = await attemptUc.execute(userId, cost);
    if (reload.outcome === 'succeeded') {
      const retry = await checkCreditsUc.execute({
        userId,
        operationType: toDomainOperation(operationType),
        operationCost: cost,
      });
      if (retry.isOk() && retry.unwrap().canProceed) {
        const afterReload = domainCheckToHttp(retry.unwrap(), graceUsedFromBalance);
        return { ...afterReload, autoReloadOutcome: 'succeeded' };
      }
    }
    if (
      reload.outcome === 'declined' ||
      reload.outcome === 'authentication_required' ||
      reload.outcome === 'not_configured'
    ) {
      const blocked = domainCheckToHttp(domainCheck, graceUsedFromBalance);
      return { ...blocked, autoReloadOutcome: reload.outcome };
    }
  }

  return domainCheckToHttp(domainCheck, graceUsedFromBalance);
}

function consumptionCorrelationId(
  userId: string,
  operationType: ApiCreditOperationType,
  metadata?: CreditTransactionMetadata
): string | undefined {
  const m = metadata ?? {};
  const explicit = m.correlationId;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;

  const projectId = m.projectId ?? m.project_id;
  if (projectId != null && String(projectId).length > 0) {
    return `${String(projectId)}--${operationType}--${crypto.randomUUID()}`;
  }

  const prdVersionId = m.prdVersionId ?? m.prd_version_id;
  const operation = m.operation;
  const parts: string[] = ['consume', userId, operationType];
  if (prdVersionId != null) parts.push(String(prdVersionId));
  if (operation != null) parts.push(String(operation));
  return parts.join(':');
}

export async function deductCreditsForApi(
  userId: string,
  operationType: ApiCreditOperationType,
  metadata?: CreditTransactionMetadata
): Promise<{
  success: boolean;
  newBalance: number;
  graceActivated: boolean;
  correlationId: string | null;
}> {
  const { repo, deductCredits: deductUc } = getCreditsComposition();
  const cost = getCreditCost(operationType);
  const correlationId = consumptionCorrelationId(userId, operationType, metadata);

  const balBefore = await repo.getBalance(userId);
  const graceUsedBefore = balBefore.isOk() ? balBefore.unwrap().graceUsed : false;

  const deductResult = await deductUc.execute({
    userId,
    amount: cost,
    operationType: toDomainOperation(operationType),
    correlationId,
    metadata: metadata ?? {},
  });

  if (deductResult.isErr()) {
    return { success: false, newBalance: 0, graceActivated: false, correlationId: null };
  }

  const dto = deductResult.unwrap();
  const graceActivated = dto.graceUsed && !graceUsedBefore;

  return {
    success: true,
    newBalance: dto.amount,
    graceActivated,
    correlationId: correlationId ?? null,
  };
}

export async function reverseCreditsForApi(
  userId: string,
  originalConsumptionCorrelationId: string,
  metadata?: CreditTransactionMetadata
): Promise<{ success: boolean; newBalance: number }> {
  const { reverseCredits: reverseUc } = getCreditsComposition();

  const result = await reverseUc.execute({
    userId,
    originalConsumptionCorrelationId,
    metadata: metadata ?? {},
  });

  if (result.isErr()) {
    return { success: false, newBalance: 0 };
  }

  return { success: true, newBalance: result.unwrap().amount };
}

export function purchaseCorrelationId(metadata?: CreditTransactionMetadata): string | undefined {
  const m = metadata ?? {};
  const purchaseId = m.purchaseId ?? m.purchase_id;
  if (typeof purchaseId === 'string' && purchaseId.length > 0) return `purchase:${purchaseId}`;
  const sessionId = m.stripeSessionId ?? m.stripe_session_id;
  if (typeof sessionId === 'string' && sessionId.length > 0) return `stripe_session:${sessionId}`;
  return undefined;
}

export async function addPurchaseCreditsForApi(
  userId: string,
  amount: number,
  metadata?: CreditTransactionMetadata,
  creditType: 'purchase' | 'auto_reload' = 'purchase'
): Promise<Result<number, ApplicationError>> {
  const { addCredits: addUc } = getCreditsComposition();
  const correlationId = purchaseCorrelationId(metadata);

  const result = await addUc.execute({
    userId,
    amount,
    type: creditType,
    correlationId,
    metadata: metadata ?? {},
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok(result.unwrap().amount);
}
