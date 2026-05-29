#!/usr/bin/env node
/**
 * Production build: run pending DB migrations on Vercel (live DATABASE_URL),
 * then lint + next build. CI/local builds skip migrate — no Postgres required.
 */
const { execSync } = require('child_process');

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

if (process.env.VERCEL === '1') {
  run('pnpm --filter @repo/db db:migrate');
}

run('pnpm lint && next build');
