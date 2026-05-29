import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const webRoot = dirname(fileURLToPath(import.meta.url));

for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(webRoot, envFile);
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
  }
}

/** Local runs use 3001 by default so `pnpm dev` on 3000 can stay up. CI uses 3000. */
const e2ePort = process.env.E2E_PORT ?? (process.env.CI ? '3000' : '3001');
const baseURL = process.env.CI
  ? (process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`)
  : `http://127.0.0.1:${e2ePort}`;
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  'postgresql://zedos_test:zedos_test@localhost:5433/zedos_test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : `pnpm dev -p ${e2ePort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXTAUTH_URL: baseURL,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'e2e-better-auth-secret-min-32-chars-long',
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ?? 'e2e-nextauth-secret-min-32-chars',
      E2E_MODE: 'true',
    },
  },
});
