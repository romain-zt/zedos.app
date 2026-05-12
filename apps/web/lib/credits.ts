import { randomUUID } from 'crypto';
import { db, users, creditTransactions, eq } from '@repo/db';
import type { UserUpdate, CreditTransactionInsert } from '@repo/db';
import { DrizzleCreditsRepository } from '@infrastructure/persistence/credits-repository';
import type { OperationType as DomainOperationType } from '@domain/credits/credits';
import { InsufficientCreditsError } from '@shared/errors/application-error';

const creditsRepo = new DrizzleCreditsRepository();

export type OperationType =
  | 'clarification'
  | 'decision'
  | 'mini_form'
  | 'prd_generation'
  | 'prd_challenge'
  | 'feature_split';

export function getCreditCost(operationType: OperationType): number {
  const costs: Record<OperationType, number> = {
    clarification: parseInt(process.env.CREDIT_COST_CLARIFICATION ?? '1', 10),
    decision: parseInt(process.env.CREDIT_COST_DECISION ?? '3', 10),
    mini_form: parseInt(process.env.CREDIT_COST_MINI_FORM ?? '5', 10),
    prd_generation: parseInt(process.env.CREDIT_COST_PRD_GENERATION ?? '10', 10),
    prd_challenge: parseInt(process.env.CREDIT_COST_PRD_CHALLENGE ?? '15', 10),
    feature_split: parseInt(process.env.CREDIT_COST_FEATURE_SPLIT ?? '5', 10),
  }
  return costs[operationType] ?? 1
}

const GRACE_CEILING = parseInt(process.env.GRACE_CREDIT_CEILING ?? '20', 10)

export interface CreditCheckResult {
  allowed: boolean
  reason?: string
  currentBalance: number
  cost: number
  wouldUseGrace: boolean
  graceAlreadyUsed: boolean
}

export async function checkCredits(
  userId: string,
  operationType: OperationType
): Promise<CreditCheckResult> {
  const [user] = await db
    .select({ creditBalance: users.creditBalance, graceUsed: users.graceUsed })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return {
      allowed: false,
      reason: 'User not found',
      currentBalance: 0,
      cost: 0,
      wouldUseGrace: false,
      graceAlreadyUsed: false,
    }
  }

  const cost = getCreditCost(operationType)
  const balance = user.creditBalance
  const graceUsed = user.graceUsed

  if (balance >= cost) {
    return { allowed: true, currentBalance: balance, cost, wouldUseGrace: false, graceAlreadyUsed: graceUsed }
  }

  if (!graceUsed) {
    const overage = cost - balance
    if (overage <= GRACE_CEILING) {
      return { allowed: true, currentBalance: balance, cost, wouldUseGrace: true, graceAlreadyUsed: false }
    }
    return {
      allowed: false,
      reason: `This operation costs ${cost} credits but you only have ${balance}. The projected overage exceeds the ${GRACE_CEILING}-credit grace limit. Please add credits to continue.`,
      currentBalance: balance,
      cost,
      wouldUseGrace: false,
      graceAlreadyUsed: false,
    }
  }

  return {
    allowed: false,
    reason: `Insufficient credits. You have ${balance} credits but this operation costs ${cost}. Please add credits to continue.`,
    currentBalance: balance,
    cost,
    wouldUseGrace: false,
    graceAlreadyUsed: true,
  }
}

/**
 * Deduct credits via the Drizzle ledger (locked rows + idempotent correlationId).
 * Pass a stable correlationId from route handlers when retries are possible.
 */
export async function deductCredits(
  userId: string,
  operationType: OperationType,
  metadata?: Record<string, unknown>,
  correlationId: string = randomUUID()
): Promise<{ success: boolean; newBalance: number; graceActivated: boolean }> {
  const cost = getCreditCost(operationType)
  const domainOp = operationType as DomainOperationType

  const before = await creditsRepo.getBalance(userId)
  if (before.isErr()) {
    return { success: false, newBalance: 0, graceActivated: false }
  }
  const graceUsedBefore = before.unwrap().graceUsed

  const result = await creditsRepo.deductCredits(userId, cost, domainOp, correlationId, metadata)

  if (result.isErr()) {
    if (result.error instanceof InsufficientCreditsError) {
      const available =
        typeof result.error.details?.available === 'number' ? result.error.details.available : 0
      return { success: false, newBalance: available, graceActivated: false }
    }
    return { success: false, newBalance: 0, graceActivated: false }
  }

  const balance = result.unwrap()
  const graceActivated = balance.graceUsed && !graceUsedBefore
  return { success: true, newBalance: balance.amount, graceActivated }
}

/**
 * Add credits via the Drizzle ledger. Pass a stable correlationId when retries are possible (e.g. Stripe session id).
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'auto_reload',
  metadata?: Record<string, unknown>,
  correlationId: string = randomUUID()
): Promise<number> {
  const result = await creditsRepo.addCredits(userId, amount, type, correlationId, metadata)
  if (result.isErr()) {
    throw new Error(result.error.message)
  }
  return result.unwrap().amount
}

/**
 * Compensating reversal after a failed downstream operation.
 */
export async function reverseCredits(
  userId: string,
  originalDeductionCorrelationId: string,
  reversalCorrelationId: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const result = await creditsRepo.reverseCredits(
    userId,
    originalDeductionCorrelationId,
    reversalCorrelationId,
    metadata
  )
  if (result.isErr()) {
    throw new Error(result.error.message)
  }
  return result.unwrap().amount
}

export async function grantStarterCredits(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ creditBalance: users.creditBalance, starterCreditsGranted: users.starterCreditsGranted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || user.starterCreditsGranted) return false

  const starterAmount = parseInt(process.env.STARTER_CREDITS ?? '20', 10)
  const newBalance = user.creditBalance + starterAmount
  const correlationId = `starter_grant:${userId}`

  await db.transaction(async (tx) => {
    const updateData: UserUpdate = { creditBalance: newBalance, starterCreditsGranted: true }
    await tx.update(users).set(updateData).where(eq(users.id, userId))

    const txData: CreditTransactionInsert = {
      userId,
      type: 'grant',
      amount: starterAmount,
      balanceAfter: newBalance,
      operationType: 'starter_grant',
      correlationId,
      metadata: { reason: 'New account starter credits' },
    }
    await tx.insert(creditTransactions).values(txData)
  })

  return true
}
