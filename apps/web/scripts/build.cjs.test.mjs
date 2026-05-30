import assert from 'node:assert';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { shouldRunDbMigrate } = require('./build.cjs');

const deployEnv = {
  VERCEL: '1',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/zedos',
};

test('shouldRunDbMigrate returns true on Vercel with DATABASE_URL', () => {
  assert.equal(shouldRunDbMigrate(deployEnv), true);
});

test('shouldRunDbMigrate returns true when RUN_DB_MIGRATE=1 and DATABASE_URL is set', () => {
  assert.equal(
    shouldRunDbMigrate({
      RUN_DB_MIGRATE: '1',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/zedos',
    }),
    true,
  );
});

test('shouldRunDbMigrate returns false in CI even with DATABASE_URL', () => {
  assert.equal(
    shouldRunDbMigrate({
      CI: 'true',
      VERCEL: '1',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/zedos',
    }),
    false,
  );
});

test('shouldRunDbMigrate returns false without DATABASE_URL', () => {
  assert.equal(shouldRunDbMigrate({ VERCEL: '1' }), false);
});

test('shouldRunDbMigrate returns false when SKIP_DB_MIGRATE=1', () => {
  assert.equal(
    shouldRunDbMigrate({
      ...deployEnv,
      SKIP_DB_MIGRATE: '1',
    }),
    false,
  );
});

test('shouldRunDbMigrate returns false for local build without deploy flags', () => {
  assert.equal(
    shouldRunDbMigrate({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/zedos',
    }),
    false,
  );
});
