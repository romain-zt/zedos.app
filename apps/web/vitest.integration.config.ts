import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.ts', 'app/**/*.integration.ts'],
    setupFiles: ['./src/test-helpers/integration-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    /** One worker — migrations + TRUNCATE must not run in parallel across files */
    maxWorkers: 1,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
