/**
 * Integration tests for PrismaCreditsRepository — concurrency safety.
 * Requires TEST_DATABASE_URL to be set. Run `docker compose up postgres` first.
 *
 * These tests verify the row-lock + SELECT FOR UPDATE implementation (T-6 through T-9).
 * They are run separately via `npm run test:integration`, not as part of the unit test suite.
 *
 * TODO: When TEST_DATABASE_URL is available in CI, these tests run against a real Postgres.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaCreditsRepository } from './credits-repository';
import { truncateCreditTables, disconnectTestDb } from '../../test-helpers/setup-test-db';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const isIntegrationEnv = !!TEST_DATABASE_URL;

const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

describeIf(isIntegrationEnv)('PrismaCreditsRepository — concurrency integration', () => {
  let prisma: PrismaClient;
  let repo: PrismaCreditsRepository;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL! } } });
    repo = new PrismaCreditsRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await truncateCreditTables();
    // Create a test user with 10 credits
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        passwordHash: 'hash',
        name: 'Test User',
        creditBalance: 10,
        graceUsed: false,
        starterCreditsGranted: false,
      },
    });
    testUserId = user.id;
  });

  it('T-6: 10 parallel deduct attempts — only N succeed (concurrency-safe)', async () => {
    // 10 parallel deducts of 6 credits each; user has 10 credits → only 1 can succeed normally,
    // the 2nd might succeed via grace if grace not used. After that all should fail.
    const tasks = Array.from({ length: 10 }, (_, i) =>
      repo.deductCredits(testUserId, 6, 'clarification', `corr-concurrent-${i}`)
    );

    const results = await Promise.all(tasks);
    const successes = results.filter((r) => r.isOk());
    const failures = results.filter((r) => r.isErr());

    // At most 2 can succeed (1 normal + 1 grace), rest must fail
    expect(successes.length).toBeGreaterThanOrEqual(1);
    expect(successes.length).toBeLessThanOrEqual(2);
    expect(failures.length).toBeGreaterThanOrEqual(8);

    // Verify no double-deduct: user balance should never go below -6 (grace ceiling)
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.creditBalance).toBeGreaterThanOrEqual(-6);
  });

  it('T-7: deductCredits is idempotent — same correlationId deducts only once', async () => {
    const correlationId = 'deduct-idem-001';

    const r1 = await repo.deductCredits(testUserId, 5, 'clarification', correlationId);
    const r2 = await repo.deductCredits(testUserId, 5, 'clarification', correlationId);

    expect(r1.isOk()).toBe(true);
    expect(r2.isOk()).toBe(true);
    if (r2.isOk()) {
      expect((r2.unwrap() as any).idempotent).toBe(true);
    }

    // Balance should only have been deducted once
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.creditBalance).toBe(5);

    const txs = await prisma.creditTransaction.findMany({
      where: { userId: testUserId, correlationId },
    });
    expect(txs).toHaveLength(1);
  });

  it('T-8: addCredits is idempotent — same correlationId adds only once', async () => {
    const correlationId = 'add-idem-001';

    const r1 = await repo.addCredits(testUserId, 50, 'purchase', correlationId);
    const r2 = await repo.addCredits(testUserId, 50, 'purchase', correlationId);

    expect(r1.isOk()).toBe(true);
    expect(r2.isOk()).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.creditBalance).toBe(60); // 10 + 50, not 10 + 50 + 50

    const txs = await prisma.creditTransaction.findMany({
      where: { userId: testUserId, correlationId },
    });
    expect(txs).toHaveLength(1);
  });

  it('T-9: reverseCredits restores balance; double-reverse is no-op', async () => {
    const deductCorr = 'deduct-for-reverse-001';

    await repo.deductCredits(testUserId, 5, 'clarification', deductCorr);

    const userAfterDeduct = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userAfterDeduct!.creditBalance).toBe(5);

    const r1 = await repo.reverseCredits(testUserId, deductCorr);
    expect(r1.isOk()).toBe(true);

    const userAfterReverse = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userAfterReverse!.creditBalance).toBe(10);

    // Double-reverse is no-op
    const r2 = await repo.reverseCredits(testUserId, deductCorr);
    expect(r2.isOk()).toBe(true);

    const userAfterDoubleReverse = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userAfterDoubleReverse!.creditBalance).toBe(10);
  });
});
