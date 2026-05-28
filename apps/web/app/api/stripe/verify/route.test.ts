import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const retrieveSessionMock = vi.hoisted(() => vi.fn());
const addPurchaseCreditsForApiMock = vi.hoisted(() => vi.fn());
const executeMock = vi.hoisted(() => vi.fn(async () => undefined));
const selectQueue = vi.hoisted(() => [] as Array<Array<{ id?: string; status?: string; creditBalance?: number }>>);

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@infrastructure/http/credits-http-bridge', () => ({
  addPurchaseCreditsForApi: addPurchaseCreditsForApiMock,
}));

vi.mock('@repo/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => selectQueue.shift() ?? [],
        }),
      }),
    }),
    execute: executeMock,
  },
  purchases: { id: 'id' },
  users: { id: 'id', creditBalance: 'creditBalance' },
  eq: vi.fn(),
  sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        retrieve: retrieveSessionMock,
      },
    };
  },
}));

async function loadRoute() {
  vi.resetModules();
  const mod = await import('./route');
  return mod.POST;
}

describe('POST /api/stripe/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue.length = 0;
    requireUserMock.mockResolvedValue(ok({ id: 'user-1' }));
  });

  it('returns 400 when sessionId is missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Session ID is required' });
  });

  it('returns alreadyProcessed balance when purchase is completed', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    retrieveSessionMock.mockResolvedValue({
      payment_status: 'paid',
      metadata: { purchaseId: 'pur-1', packSize: '100' },
    });
    selectQueue.push([{ id: 'pur-1', status: 'completed' }]);
    selectQueue.push([{ creditBalance: 320 }]);

    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ balance: 320, alreadyProcessed: true });
  });

  it('returns 401 when user is unauthorized', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    requireUserMock.mockResolvedValueOnce(err(createUnauthorizedError('no session')));
    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('adds credits and marks purchase completed', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    retrieveSessionMock.mockResolvedValue({
      payment_status: 'paid',
      metadata: { purchaseId: 'pur-1', packSize: '100' },
      payment_intent: 'pi_123',
    });
    selectQueue.push([{ id: 'pur-1', status: 'pending' }]);
    addPurchaseCreditsForApiMock.mockResolvedValue(ok(500));

    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ balance: 500, creditsAdded: 100 });
    expect(executeMock).toHaveBeenCalledTimes(1);
  });
});
