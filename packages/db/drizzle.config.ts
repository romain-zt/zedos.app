import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit loads this file as CJS — import.meta.dirname is unavailable.
// pnpm runs these scripts with cwd = packages/db.
const packageRoot = process.cwd();
const localEnv = resolve(packageRoot, '.env');
const webAppEnv = resolve(packageRoot, '../../apps/web/.env');

if (existsSync(localEnv)) {
  config({ path: localEnv });
} else if (existsSync(webAppEnv)) {
  config({ path: webAppEnv });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy packages/db/.env.example to packages/db/.env ' +
      '(or set DATABASE_URL in apps/web/.env).',
  );
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
