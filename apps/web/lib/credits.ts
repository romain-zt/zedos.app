import { db, users, creditTransactions, eq, sql, type UserUpdate, type CreditTransactionInsert } from '@repo/db'

export type OperationType =
  | 'clarification'
  | 'decision'
  | 'mini_form'
  | 'prd_generation'
  | 'prd_challenge'
  | 'feature_split'

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

export async function deductCredits(
  userId: string,
  operationType: OperationType,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number; graceActivated: boolean }> {
  const cost = getCreditCost(operationType)

  const result = await db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`SELECT id, credit_balance, grace_used FROM users WHERE id = ${userId} FOR UPDATE`
    )
    const user = (rows as unknown as Array<{ id: string; credit_balance: number; grace_used: boolean }>)[0]
    if (!user) return null

    const newBalance = user.credit_balance - cost
    const graceActivated = newBalance < 0 && !user.grace_used

    const updateData: UserUpdate = {
      creditBalance: newBalance,
      ...(graceActivated ? { graceUsed: true } : {}),
    }
    await tx.update(users).set(updateData).where(eq(users.id, userId))

    const txData: CreditTransactionInsert = {
      userId,
      type: 'consumption',
      amount: -cost,
      balanceAfter: newBalance,
      operationType,
      metadata: metadata ?? {},
    }
    await tx.insert(creditTransactions).values(txData)

    return { newBalance, graceActivated }
  })

  if (!result) return { success: false, newBalance: 0, graceActivated: false }
  return { success: true, newBalance: result.newBalance, graceActivated: result.graceActivated }
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'auto_reload',
  metadata?: Record<string, unknown>
): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`SELECT id, credit_balance FROM users WHERE id = ${userId} FOR UPDATE`
    )
    const user = (rows as unknown as Array<{ id: string; credit_balance: number }>)[0]
    if (!user) throw new Error('User not found')

    const newBalance = user.credit_balance + amount

    const updateData: UserUpdate = { creditBalance: newBalance }
    await tx.update(users).set(updateData).where(eq(users.id, userId))

    const txData: CreditTransactionInsert = {
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      metadata: metadata ?? {},
    }
    await tx.insert(creditTransactions).values(txData)

    return newBalance
  })
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

  await db.transaction(async (tx) => {
    const updateData: UserUpdate = { creditBalance: newBalance, starterCreditsGranted: true }
    await tx.update(users).set(updateData).where(eq(users.id, userId))

    const txData: CreditTransactionInsert = {
      userId,
      type: 'grant',
      amount: starterAmount,
      balanceAfter: newBalance,
      operationType: 'starter_grant',
      metadata: { reason: 'New account starter credits' },
    }
    await tx.insert(creditTransactions).values(txData)
  })

  return true
}
