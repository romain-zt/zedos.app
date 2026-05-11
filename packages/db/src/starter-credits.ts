/**
 * One-shot starter credit grant for new accounts (better-auth hook + manual backfills).
 * Mirrors legacy SignUpUseCase + DrizzleCreditsRepository grant semantics.
 */

import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { creditTransactions, users } from './schema';

export async function grantStarterCreditsIfNeeded(userId: string): Promise<void> {
  const starterAmount = parseInt(process.env.STARTER_CREDITS ?? '20', 10);
  if (!Number.isFinite(starterAmount) || starterAmount <= 0) {
    return;
  }

  await db.transaction(async (tx) => {
    const lockedRows = await tx.execute(
      sql`SELECT id, credit_balance, starter_credits_granted FROM users WHERE id = ${userId} FOR UPDATE`,
    );
    const rows = lockedRows as unknown as Array<{
      id: string;
      credit_balance: number;
      starter_credits_granted: boolean;
    }>;
    if (!rows?.length) return;
    const row = rows[0];
    if (!row || row.starter_credits_granted) return;

    const newBalance = row.credit_balance + starterAmount;

    await tx
      .update(users)
      .set({
        creditBalance: newBalance,
        starterCreditsGranted: true,
      })
      .where(eq(users.id, userId));

    await tx.insert(creditTransactions).values({
      userId,
      type: 'grant',
      amount: starterAmount,
      balanceAfter: newBalance,
      operationType: 'starter_grant',
      metadata: { reason: 'New account starter credits' },
    });
  });
}
