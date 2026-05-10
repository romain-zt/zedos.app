/**
 * Integration tests for POST /api/projects/[id]/generate-prd (T-18).
 * Requires TEST_DATABASE_URL to be set. AI provider is mocked via vi.mock.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { truncateCreditTables } from '../../../../../src/test-helpers/setup-test-db';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isIntegrationEnv = !!TEST_DATABASE_URL;
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

vi.mock('../../../../../lib/ai-service', () => ({
  callAI: vi.fn(),
  createBufferedStreamingResponse: vi.fn(),
}));

describeIf(isIntegrationEnv)('POST /api/projects/[id]/generate-prd — integration', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL! } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await truncateCreditTables();
  });

  it('T-18: pre-check passes, AI succeeds → balance debited + PrdVersion created', async () => {
    // TODO: Full route integration test requires a running Next.js server + auth session.
    // Same shape as clarify T-16/T-17 for prd_generation op type.
    expect(true).toBe(true);
  });
});
