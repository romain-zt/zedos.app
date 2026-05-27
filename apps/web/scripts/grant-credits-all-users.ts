import { randomUUID } from 'node:crypto';
import { db, sql } from '@repo/db';

const GRANT_AMOUNT = 1000;

type UserRow = {
  id: string;
  email: string;
  credit_balance: number;
};

async function main() {
  console.log('Starting credit grant process...');

  const userRows = await db.execute(
    sql`SELECT id, email, credit_balance FROM users`,
  );
  const allUsers = userRows as unknown as UserRow[];
  console.log(`Found ${allUsers.length} users`);

  if (allUsers.length === 0) {
    console.log('No users to grant credits to.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of allUsers) {
    try {
      const newBalance = user.credit_balance + GRANT_AMOUNT;

      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE users
          SET credit_balance = ${newBalance}, updated_at = NOW()
          WHERE id = ${user.id}
        `);

        await tx.execute(sql`
          INSERT INTO credit_transactions (
            id,
            user_id,
            type,
            amount,
            balance_after,
            operation_type
          )
          VALUES (
            ${randomUUID()},
            ${user.id},
            ${'grant'},
            ${GRANT_AMOUNT},
            ${newBalance},
            ${'admin_bulk_grant'}
          )
        `);
      });

      console.log(`✓ ${user.email}: ${user.credit_balance} → ${newBalance}`);
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ ${user.email}: ${message}`);
      errorCount++;
    }
  }

  console.log(`\nCompleted: ${successCount} users credited, ${errorCount} errors`);
  console.log(`Total credits distributed: ${successCount * GRANT_AMOUNT}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
