import { prisma } from '@/lib/prisma'

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
  const balance = user.creditBalance
  const graceUsed = user.graceUsed

  // Has enough credits
  if (balance >= cost) {
    return { allowed: true, currentBalance: balance, cost, wouldUseGrace: false, graceAlreadyUsed: graceUsed }
  }

  // Not enough credits - check grace
  if (!graceUsed) {
    // First-circuit grace: allow if overage would be within ceiling
    const overage = cost - balance
    if (overage <= GRACE_CEILING) {
      return { allowed: true, currentBalance: balance, cost, wouldUseGrace: true, graceAlreadyUsed: false }
    } else {
      return {
        allowed: false,
        reason: `This operation costs ${cost} credits but you only have ${balance}. The projected overage exceeds the ${GRACE_CEILING}-credit grace limit. Please add credits to continue.`,
        currentBalance: balance,
        cost,
        wouldUseGrace: false,
        graceAlreadyUsed: false,
      }
    }
  }

  // Grace already used - block at zero
  return {
    allowed: false,
    reason: `Insufficient credits. You have ${balance} credits but this operation costs ${cost}. Please add credits to continue.`,
    currentBalance: balance,
    cost,
    wouldUseGrace: false,
    graceAlreadyUsed: true,
  }
}

export async function deductCredits(
  userId: string,
  operationType: OperationType,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; graceActivated: boolean }> {
  const cost = getCreditCost(operationType)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, newBalance: 0, graceActivated: false }

  const newBalance = user.creditBalance - cost
  const graceActivated = newBalance < 0 && !user.graceUsed

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: newBalance,
        ...(graceActivated ? { graceUsed: true } : {}),
      },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'consumption',
        amount: -cost,
        balanceAfter: newBalance,
        operationType,
        metadata: metadata ?? {},
      },
    }),
  ])

  return { success: true, newBalance, graceActivated }
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'auto_reload',
  metadata?: Record<string, any>
): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const newBalance = user.creditBalance + amount

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter: newBalance,
        metadata: metadata ?? {},
      },
    }),
  ])

  return newBalance
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
      },
    }),
  ])

  return true
}
