import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, sql } from '@repo/db';

async function main() {
  const passwordHash = await bcrypt.hash('johndoe123', 12);
  const starterCredits = parseInt(process.env.STARTER_CREDITS ?? '20', 10);
  const email = 'john@doe.com';
  const metadataJson = JSON.stringify({ reason: 'New account starter credits' });

  await db.execute(sql`
    INSERT INTO users (
      id,
      email,
      password_hash,
      name,
      credit_balance,
      starter_credits_granted
    )
    VALUES (
      ${randomUUID()},
      ${email},
      ${passwordHash},
      ${'John Doe'},
      ${starterCredits},
      ${true}
    )
    ON CONFLICT (email) DO NOTHING
  `);

  const userRows = await db.execute(
    sql`SELECT id, credit_balance FROM users WHERE email = ${email} LIMIT 1`,
  );
  const usersResult = userRows as unknown as Array<{ id: string; credit_balance: number }>;
  const user = usersResult[0];

  if (!user) {
    throw new Error('Failed to upsert seed user');
  }

  const txRows = await db.execute(sql`
    SELECT id FROM credit_transactions
    WHERE user_id = ${user.id} AND type = ${'grant'}
    LIMIT 1
  `);
  const existingTx = (txRows as unknown as Array<{ id: string }>)[0];

  if (!existingTx) {
    await db.execute(sql`
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
        ${user.id},
        ${'grant'},
        ${starterCredits},
        ${user.credit_balance},
        ${'starter_grant'},
        ${metadataJson}::json
      )
    `);
  }

  console.log('Seed completed successfully');
}

main().catch(console.error);
