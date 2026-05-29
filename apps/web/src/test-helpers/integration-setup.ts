/**
 * Vitest integration setup — loads env and points DATABASE_URL at the test DB.
 * Must not import setup-test-db at top level (ESM hoisting runs before env is set).
 */

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { afterAll, beforeAll } from 'vitest';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(webRoot, envFile);
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://zedos_test:zedos_test@localhost:5433/zedos_test';

process.env.TEST_DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL = testDatabaseUrl;
process.env.GRACE_CREDIT_CEILING = process.env.GRACE_CREDIT_CEILING ?? '20';

beforeAll(async () => {
  const { ensureIntegrationSchema } = await import('./setup-test-db');
  await ensureIntegrationSchema();
}, 120_000);

afterAll(async () => {
  const { disconnectTestDb } = await import('./setup-test-db');
  await disconnectTestDb();
  const { closeDatabaseConnections } = await import('@repo/db');
  await closeDatabaseConnections();
});
