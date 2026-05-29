/**
 * Test DB helper — uses TEST_DATABASE_URL (set by integration-setup.ts).
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import {
  createTestDb,
  sql,
  users,
  purchases,
  creditTransactions,
  processedWebhookEvents,
  eq,
  type NewUserRow,
  type PurchaseInsert,
} from '@repo/db';

function resolveTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Configure TEST_DATABASE_URL in apps/web/.env.local (see .env.example) or run docker compose up postgres.',
    );
  }
  return url;
}

let testConnectionInstance: ReturnType<typeof createTestDb> | null = null;

export function getTestConnection(): ReturnType<typeof createTestDb> {
  if (!testConnectionInstance) {
    testConnectionInstance = createTestDb(resolveTestDatabaseUrl());
  }
  return testConnectionInstance;
}

/** @deprecated Prefer getTestConnection(); kept for brevity in tests */
export const testConnection = new Proxy({} as ReturnType<typeof createTestDb>, {
  get(_target, prop) {
    const conn = getTestConnection();
    return Reflect.get(conn, prop);
  },
});

const migrationsFolder = path.resolve(
  fileURLToPath(new URL('../../../../packages/db/src/migrations', import.meta.url)),
);

let schemaReady: Promise<void> | undefined;

export function ensureIntegrationSchema(): Promise<void> {
  schemaReady ??= migrate(getTestConnection().db, { migrationsFolder });
  return schemaReady;
}

export type IntegrationTestUser = {
  id: string;
  email: string;
  creditBalance: number;
  graceUsed: boolean;
};

export async function seedIntegrationUser(
  overrides?: Partial<{
    id: string;
    email: string;
    name: string;
    creditBalance: number;
    graceUsed: boolean;
  }>,
): Promise<IntegrationTestUser> {
  const id = overrides?.id ?? `usr_int_${randomUUID()}`;
  const email = overrides?.email ?? `${id}@integration.test`;
  const creditBalance = overrides?.creditBalance ?? 50;
  const graceUsed = overrides?.graceUsed ?? false;

  const userRow: NewUserRow = {
    id,
    email,
    name: overrides?.name ?? 'Integration User',
    creditBalance,
    graceUsed,
  };
  await testConnection.db.insert(users).values(userRow);

  return { id, email, creditBalance, graceUsed };
}

export async function seedPendingPurchase(params: {
  id: string;
  userId: string;
  packSize: number;
  amountEur?: number;
  stripeSessionId?: string;
}): Promise<void> {
  const purchaseRow: PurchaseInsert = {
    id: params.id,
    userId: params.userId,
    packSize: params.packSize,
    amountEur: params.amountEur ?? 9,
    status: 'pending',
    stripeSessionId: params.stripeSessionId ?? `cs_${params.id}`,
  };
  await testConnection.db.insert(purchases).values(purchaseRow);
}

/**
 * Truncate ledger + payment tables and users for test isolation.
 */
export async function truncateCreditTables(): Promise<void> {
  await testConnection.db.execute(
    sql`TRUNCATE TABLE
      credit_transactions,
      processed_webhook_events,
      purchases,
      auto_reload_preferences,
      users
    RESTART IDENTITY CASCADE`,
  );
}

export async function countCreditTransactionsForUser(userId: string): Promise<number> {
  const rows = await testConnection.db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId));
  return rows.length;
}

export async function findProcessedWebhookEvent(eventId: string): Promise<boolean> {
  const [row] = await testConnection.db
    .select({ id: processedWebhookEvents.id })
    .from(processedWebhookEvents)
    .where(eq(processedWebhookEvents.eventId, eventId))
    .limit(1);
  return !!row;
}

export async function getPurchaseStatus(purchaseId: string): Promise<string | null> {
  const [row] = await testConnection.db
    .select({ status: purchases.status })
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);
  return row?.status ?? null;
}

/**
 * Disconnect from the test DB. Call in afterAll.
 */
export async function disconnectTestDb(): Promise<void> {
  if (testConnectionInstance) {
    await testConnectionInstance.disconnect();
    testConnectionInstance = null;
  }
}
