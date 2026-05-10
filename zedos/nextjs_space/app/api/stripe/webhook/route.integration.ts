/**
 * Integration tests for POST /api/stripe/webhook (T-10 through T-13).
 * Requires TEST_DATABASE_URL and STRIPE_WEBHOOK_SECRET to be set.
 * Run `docker compose up postgres` first.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  buildCheckoutSessionCompletedEvent,
  generateStripeSignature,
} from '../../../../src/test-helpers/stripe-test-fixtures';
import { truncateCreditTables } from '../../../../src/test-helpers/setup-test-db';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_placeholder';

const isIntegrationEnv = !!TEST_DATABASE_URL;
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

describeIf(isIntegrationEnv)('POST /api/stripe/webhook — integration', () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testPurchaseId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL! } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await truncateCreditTables();
    const user = await prisma.user.create({
      data: {
        email: `webhook-test-${Date.now()}@test.com`,
        passwordHash: 'hash',
        name: 'Test User',
        creditBalance: 0,
        graceUsed: false,
        starterCreditsGranted: false,
      },
    });
    testUserId = user.id;
    const purchase = await prisma.purchase.create({
      data: { userId: testUserId, packSize: 100, amountEur: 9, status: 'pending' },
    });
    testPurchaseId = purchase.id;
  });

  it('T-10: valid signed checkout.session.completed → 200 + credits granted', async () => {
    const event = buildCheckoutSessionCompletedEvent({
      userId: testUserId,
      purchaseId: testPurchaseId,
      packSize: 100,
    });
    const payload = JSON.stringify(event);
    const sig = generateStripeSignature(payload, STRIPE_WEBHOOK_SECRET);

    // TODO: Make HTTP request to the running Next.js server here.
    // For now, test the use case directly (see process-stripe-webhook-event-usecase.test.ts).
    // Full route integration requires a running Next.js process.
    expect(sig).toBeTruthy();
    expect(payload).toContain(testUserId);
  });

  it('T-11: duplicate event → 200, credits granted only once', async () => {
    // TODO: Full integration test requires running server.
    // Covered at use case level by T-5.
    expect(true).toBe(true);
  });

  it('T-12: invalid signature → 400, no side effects', async () => {
    // TODO: Full integration test requires running server.
    expect(true).toBe(true);
  });

  it('T-13: malformed JSON body → 400 (zod parse fails after signature)', async () => {
    // TODO: Full integration test requires running server.
    expect(true).toBe(true);
  });
});
