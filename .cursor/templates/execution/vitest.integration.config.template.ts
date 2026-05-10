/**
 * Vitest Integration Test Config — ready-to-copy template
 *
 * Location (pre-migration):  zedos/nextjs_space/vitest.integration.config.ts
 * Location (post-migration): apps/web/vitest.integration.config.ts
 *                            (or per-package: packages/<name>/vitest.integration.config.ts)
 *
 * Usage:
 *   1. Copy this file to the relevant package root.
 *   2. Update `include` to match your integration test glob.
 *   3. Add `"test:integration": "vitest run --config vitest.integration.config.ts"` to package.json scripts.
 *   4. Set DATABASE_URL_TEST in your .env.test (or CI secrets). Never reuse the production DB.
 *
 * Governed by: .cursor/rules/78-testing.mdc §3 (*.integration.ts), §6 (test:integration script), §7.2 (concurrent test mandate)
 * See also: .cursor/skills/execution/add-test/SKILL.md §Integration test harness setup
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    /**
     * Glob pattern for integration tests. Colocate under __tests__/ or alongside source.
     * Per 78-testing.mdc §3: use *.integration.ts suffix to distinguish from unit tests.
     */
    include: ['src/**/*.integration.ts', 'src/**/__tests__/*.integration.ts'],

    /**
     * Integration tests run sequentially by default to avoid DB race conditions.
     * Override to `true` only for tests explicitly designed for concurrent execution
     * (e.g., the credit ledger double-spend test). Each concurrent test must own its
     * own test-user/test-account row to prevent cross-test interference.
     */
    sequence: {
      concurrent: false,
    },

    /**
     * Longer timeout for DB round-trips. 10s is generous; tune down if tests are fast.
     * Per 78-testing.mdc §7: concurrent integration tests for credit/payment paths must
     * complete within CI time budget.
     */
    testTimeout: 10_000,
    hookTimeout: 15_000,

    /**
     * Environment variables for the test database.
     * Prefer .env.test over process.env injection — keeps CI config explicit.
     */
    env: {
      NODE_ENV: 'test',
    },

    /**
     * Global setup / teardown for DB lifecycle.
     * Point to a helper that provisions a test schema (or test-container) before the suite
     * and tears it down after. See the integration test recipe in add-test/SKILL.md.
     */
    globalSetup: [
      // './src/__test-helpers__/global-setup.ts',   // ← uncomment and implement
    ],

    /**
     * Path aliases — must mirror tsconfig.json `paths`.
     * Adjust if your monorepo uses a different alias strategy.
     */
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        // Add other aliases to match tsconfig paths
      },
    },

    /**
     * Reporter: verbose in CI (shows individual test names), dot locally.
     * Override via VITEST_REPORTER env var if needed.
     */
    reporter: process.env.CI ? 'verbose' : 'dot',

    /**
     * Coverage is optional for integration runs — unit tests own coverage floors.
     * Enable here only if you need combined coverage reports.
     */
    coverage: {
      enabled: false,
    },
  },
});
