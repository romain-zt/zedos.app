/**
 * Legacy credit helpers — delegate to application use cases + DrizzleCreditsRepository.
 * Mutations honor correlation idempotency on `credit_transactions`.
 */

import type { OperationType as DomainOperationType } from '@domain/credits/credits';
import type { CreditCheckResult as DomainCreditCheckResult } from '@domain/credits/credits';
import { getCreditsComposition } from '@/lib/composition';
import { db, users, eq } from '@repo/db';
import type { CreditTransactionMetadata } from '@repo/contracts/credits';
import { NotFoundError } from '@shared/errors/application-error';

export type OperationType =
  | 'clarification'
  | 'decision'
  | 'mini_form'
  | 'prd_generation'
  | 'prd_challenge'
  | 'feature_split';

function toDomainOperation(operationType: OperationType): DomainOperationType {
  return operationType as DomainOperationType;
}

export function getCreditCost(operationType: OperationType): number {
  const costs: Record<OperationType, number> = {
    clarification: parseInt(process.env.CREDIT_COST_CLARIFICATION ?? '1', 10),
    decision: parseInt(process.env.CREDIT_COST_DECISION ?? '3', 10),
    mini_form: parseInt(process.env.CREDIT_COST_MINI_FORM ?? '5', 10),
    prd_generation: parseInt(process.env.CREDIT_COST_PRD_GENERATION ?? '10', 10),
    prd_challenge: parseInt(process.env.CREDIT_COST_PRD_CHALLENGE ?? '15', 10),
    feature_split: parseInt(process.env.CREDIT_COST_FEATURE_SPLIT ?? '5', 10),
  };
  return costs[operationType] ?? 1;
}

export interface CreditCheckResult {
  allowed: boolean
  reason?: string
  currentBalance: number
  cost: number
  wouldUseGrace: boolean
  graceAlreadyUsed: boolean
}

function domainCheckToLegacy(
  d: DomainCreditCheckResult,
  graceUsedFromBalance: boolean
): Omit<CreditCheckResult, 'cost'> & { cost: number } {
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

export async function checkCredits(
  userId: string,
  operationType: OperationType
): Promise<CreditCheckResult> {
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

  return domainCheckToLegacy(result.unwrap(), graceUsedFromBalance);
}

function consumptionCorrelationId(
  userId: string,
  operationType: OperationType,
  metadata?: CreditTransactionMetadata
): string | undefined {
  const m = metadata ?? {};
  const explicit = m.correlationId;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;

  const projectId = m.projectId ?? m.project_id;
  const prdVersionId = m.prdVersionId ?? m.prd_version_id;
  const operation = m.operation;
  const parts: string[] = ['consume', userId, operationType];
  if (projectId != null) parts.push(String(projectId));
  if (prdVersionId != null) parts.push(String(prdVersionId));
  if (operation != null) parts.push(String(operation));
  return parts.join(':');
}

function purchaseCorrelationId(metadata?: CreditTransactionMetadata): string | undefined {
  const m = metadata ?? {};
  const purchaseId = m.purchaseId ?? m.purchase_id;
  if (typeof purchaseId === 'string' && purchaseId.length > 0) return `purchase:${purchaseId}`;
  const sessionId = m.stripeSessionId ?? m.stripe_session_id;
  if (typeof sessionId === 'string' && sessionId.length > 0) return `stripe_session:${sessionId}`;
  return undefined;
}

export async function deductCredits(
  userId: string,
  operationType: OperationType,
  metadata?: CreditTransactionMetadata
): Promise<{ success: boolean; newBalance: number; graceActivated: boolean }> {
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
    return { success: false, newBalance: 0, graceActivated: false };
  }

  const dto = deductResult.unwrap();
  const graceActivated = dto.graceUsed && !graceUsedBefore;

  return {
    success: true,
    newBalance: dto.amount,
    graceActivated,
  };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'auto_reload',
  metadata?: CreditTransactionMetadata
): Promise<number> {
  const { addCredits: addUc } = getCreditsComposition();
  const correlationId =
    type === 'purchase'
      ? purchaseCorrelationId(metadata)
      : typeof metadata?.correlationId === 'string' && metadata.correlationId.length > 0
        ? metadata.correlationId
        : undefined;

  const result = await addUc.execute({
    userId,
    amount,
    type,
    correlationId,
    metadata: metadata ?? {},
  });

  if (result.isErr()) {
    if (result.error instanceof NotFoundError) {
      throw new Error('User not found');
    }
    throw new Error(result.error.message);
  }

  return result.unwrap().amount;
}

export async function grantStarterCredits(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ starterCreditsGranted: users.starterCreditsGranted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.starterCreditsGranted) return false;

  const starterAmount = parseInt(process.env.STARTER_CREDITS ?? '20', 10);
  const { addCredits: addUc } = getCreditsComposition();

  const result = await addUc.execute({
    userId,
    amount: starterAmount,
    type: 'grant',
    correlationId: `starter-grant:${userId}`,
    metadata: { reason: 'New account starter credits' },
  });

  return result.isOk();
}
