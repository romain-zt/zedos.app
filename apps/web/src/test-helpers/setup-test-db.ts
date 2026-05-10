/**
 * Test DB setup helper.
 * Uses TEST_DATABASE_URL env var. Run `docker compose up postgres` locally to start Postgres.
 * TODO: Consider @testcontainers/postgresql for zero-setup contributor experience.
 */

import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Set it in .env.test or run docker compose up postgres first.'
  );
}

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

/**
 * Truncate all tables relevant to credit + payment integration tests.
 * Called in beforeEach to ensure test isolation.
 */
export async function truncateCreditTables(): Promise<void> {
  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE credit_transactions, processed_webhook_events, purchases RESTART IDENTITY CASCADE`
  );
}

/**
 * Disconnect from the test DB. Call in afterAll.
 */
export async function disconnectTestDb(): Promise<void> {
  await testPrisma.$disconnect();
}
