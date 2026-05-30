#!/usr/bin/env node
/**
 * Production build: run pending DB migrations on Vercel (live DATABASE_URL),
 * then lint + next build. CI/local builds skip migrate — no Postgres required.
 */
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../../..');

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
function shouldRunDbMigrate(env = process.env) {
  if (env.SKIP_DB_MIGRATE === '1') return false;
  if (!env.DATABASE_URL) return false;
  // CI applies migrations in a dedicated workflow step before build.
  if (env.CI === 'true') return false;
  return true;
}

function run(command, options = {}) {
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
    cwd: options.cwd ?? process.cwd(),
  });
}

function main() {
  if (shouldRunDbMigrate()) {
    console.log('[build] Applying Drizzle migrations (DATABASE_URL set, deploy target)...');
    run('pnpm --filter @repo/db db:migrate', { cwd: repoRoot });
  } else {
    console.log('[build] Skipping Drizzle migrations (CI, local, or SKIP_DB_MIGRATE=1).');
  }

  run('pnpm lint && next build');
}

module.exports = { shouldRunDbMigrate };

if (require.main === module) {
  main();
}
