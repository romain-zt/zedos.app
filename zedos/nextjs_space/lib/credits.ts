import { prisma } from '@/lib/prisma'
import { CreditsDomainService } from '@/src/domain/credits/credits-service'

export type OperationType =
  | 'clarification'
  | 'decision'
  | 'mini_form'
  | 'prd_generation'
  | 'prd_challenge'

export function getCreditCost(operationType: OperationType): number {
  const costs: Record<OperationType, number> = {
    clarification: parseInt(process.env.CREDIT_COST_CLARIFICATION ?? '1', 10),
    decision: parseInt(process.env.CREDIT_COST_DECISION ?? '3', 10),
    mini_form: parseInt(process.env.CREDIT_COST_MINI_FORM ?? '5', 10),
    prd_generation: parseInt(process.env.CREDIT_COST_PRD_GENERATION ?? '10', 10),
    prd_challenge: parseInt(process.env.CREDIT_COST_PRD_CHALLENGE ?? '15', 10),
  }
  return costs[operationType] ?? 1
}

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
  const user = await prisma.user.findUnique({ where: { id: userId } })
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
  const decision = CreditsDomainService.computeDeductionDecision(
    user.creditBalance,
    user.graceUsed,
    cost
  )

  if (decision.kind === 'proceed') {
    return {
      allowed: true,
      currentBalance: user.creditBalance,
      cost,
      wouldUseGrace: false,
      graceAlreadyUsed: user.graceUsed,
    }
  }

  if (decision.kind === 'proceed-with-grace') {
    return {
      allowed: true,
      currentBalance: user.creditBalance,
      cost,
      wouldUseGrace: true,
      graceAlreadyUsed: false,
    }
  }

  const reasons: Record<string, string> = {
    'grace-exhausted': `Insufficient credits. You have ${user.creditBalance} credits but this operation costs ${cost}. Please add credits to continue.`,
    'overage-exceeds-ceiling': `This operation costs ${cost} credits but you only have ${user.creditBalance}. The projected overage exceeds the grace limit. Please add credits to continue.`,
    'insufficient-credits': `Insufficient credits. Required: ${cost}, Available: ${user.creditBalance}`,
  }
  const rejectionReason = (decision as any).reason as string
  return {
    allowed: false,
    reason: reasons[rejectionReason] ?? 'Insufficient credits',
    currentBalance: user.creditBalance,
    cost,
    wouldUseGrace: false,
    graceAlreadyUsed: user.graceUsed,
  }
}

type RowLock = { credit_balance: number; grace_used: boolean }

/**
 * Deduct credits atomically inside a SELECT FOR UPDATE transaction.
 * correlationId makes this idempotent — same correlationId = no-op on repeat.
 */
export async function deductCredits(
  userId: string,
  operationType: OperationType,
  metadata?: Record<string, any>,
  correlationId?: string
): Promise<{ success: boolean; newBalance: number; graceActivated: boolean; idempotent?: boolean }> {
  const cost = getCreditCost(operationType)

  try {
    return await prisma.$transaction(async (tx) => {
      const rows = (await tx.$queryRawUnsafe(
        `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
        userId
      )) as RowLock[]
      const locked = rows[0]

      if (!locked) return { success: false, newBalance: 0, graceActivated: false }

      const decision = CreditsDomainService.computeDeductionDecision(
        locked.credit_balance,
        locked.grace_used,
        cost
      )

      if (decision.kind === 'reject') {
        return { success: false, newBalance: locked.credit_balance, graceActivated: false }
      }

      if (correlationId) {
        const existing = await tx.creditTransaction.findFirst({
          where: { userId, correlationId },
        })
        if (existing) {
          const user = await tx.user.findUnique({ where: { id: userId } })
          return {
            success: true,
            newBalance: user?.creditBalance ?? locked.credit_balance,
            graceActivated: false,
            idempotent: true,
          }
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: decision.newBalance,
          ...(decision.willActivateGrace ? { graceUsed: true } : {}),
        },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'consumption',
          amount: -cost,
          balanceAfter: decision.newBalance,
          operationType,
          metadata: metadata ?? {},
          ...(correlationId ? { correlationId } : {}),
        } as any,
      })

      return {
        success: true,
        newBalance: decision.newBalance,
        graceActivated: decision.willActivateGrace,
      }
    })
  } catch {
    return { success: false, newBalance: 0, graceActivated: false }
  }
}

/**
 * Reverse a prior deduction. Compensating reversal on AI failure.
 * Per OQ-2 decision: does NOT restore graceUsed.
 */
export async function reverseCredits(
  userId: string,
  originalCorrelationId: string
): Promise<{ success: boolean; newBalance: number }> {
  const reversalCorrelationId = `${originalCorrelationId}--reverse`

  try {
    return await prisma.$transaction(async (tx) => {
      const rows = (await tx.$queryRawUnsafe(
        `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
        userId
      )) as RowLock[]
      const locked = rows[0]

      if (!locked) return { success: false, newBalance: 0 }

      const alreadyReversed = await tx.creditTransaction.findFirst({
        where: { userId, correlationId: reversalCorrelationId },
      })
      if (alreadyReversed) {
        return { success: true, newBalance: locked.credit_balance }
      }

      const original = await tx.creditTransaction.findFirst({
        where: { userId, correlationId: originalCorrelationId, type: 'consumption' },
      })
      if (!original) {
        return { success: true, newBalance: locked.credit_balance }
      }

      const deductedAmount = Math.abs(original.amount)
      const newBalance = locked.credit_balance + deductedAmount

      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'consumption',
          amount: deductedAmount,
          balanceAfter: newBalance,
          operationType: original.operationType ?? undefined,
          correlationId: reversalCorrelationId,
          metadata: { reversal: true, originalCorrelationId },
        } as any,
      })

      return { success: true, newBalance }
    })
  } catch {
    return { success: false, newBalance: 0 }
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'auto_reload',
  metadata?: Record<string, any>,
  correlationId?: string
): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    const rows = (await tx.$queryRawUnsafe(
      `SELECT credit_balance, grace_used FROM users WHERE id = $1 FOR UPDATE`,
      userId
    )) as RowLock[]
    const locked = rows[0]

    if (!locked) throw new Error('User not found')

    if (correlationId) {
      const existing = await tx.creditTransaction.findFirst({
        where: { userId, correlationId },
      })
      if (existing) {
        return locked.credit_balance
      }
    }

    const newBalance = locked.credit_balance + amount

    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter: newBalance,
        metadata: metadata ?? {},
        ...(correlationId ? { correlationId } : {}),
      } as any,
    })

    return newBalance
  })
}

export async function grantStarterCredits(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.starterCreditsGranted) return false

  const starterAmount = parseInt(process.env.STARTER_CREDITS ?? '20', 10)
  const newBalance = user.creditBalance + starterAmount

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance, starterCreditsGranted: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'grant',
        amount: starterAmount,
        balanceAfter: newBalance,
        operationType: 'starter_grant',
        metadata: { reason: 'New account starter credits' },
      } as any,
    }),
  ])

  return true
}
