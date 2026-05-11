/**
 * One-shot starter credit grant for new accounts (better-auth hook + manual backfills).
 * Mirrors legacy SignUpUseCase + DrizzleCreditsRepository grant semantics.
 *
 * Uses parameterized `sql` for writes so Next/web typecheck stays stable (see Drizzle + bundler resolution).
 */

import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './client';

export async function grantStarterCreditsIfNeeded(userId: string): Promise<void> {
  const starterAmount = parseInt(process.env.STARTER_CREDITS ?? '20', 10);
  if (!Number.isFinite(starterAmount) || starterAmount <= 0) {
    return;
  }

  const metadataJson = JSON.stringify({ reason: 'New account starter credits' });

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

    await tx.execute(sql`
      UPDATE users
      SET
        credit_balance = ${newBalance},
        starter_credits_granted = true,
        updated_at = NOW()
      WHERE id = ${userId}
    `);

    await tx.execute(sql`
      INSERT INTO credit_transactions (
        id,
        user_id,
        type,
        amount,
        balance_after,
        operation_type,
        metadata
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        ${'grant'},
        ${starterAmount},
        ${newBalance},
        ${'starter_grant'},
        ${metadataJson}::json
      )
    `);
  });
}
