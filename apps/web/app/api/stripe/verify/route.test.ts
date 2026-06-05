import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const verifyCheckoutSessionForUserMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@infrastructure/payments/stripe-checkout-flows', () => ({
  verifyCheckoutSessionForUser: verifyCheckoutSessionForUserMock,
}));

async function loadRoute() {
  vi.resetModules();
  const mod = await import('./route');
  return mod.POST;
}

describe('POST /api/stripe/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(ok({ id: 'user-1' }));
  });

  it('returns 400 when sessionId is missing', async () => {
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
    verifyCheckoutSessionForUserMock.mockResolvedValue({
      ok: true,
      value: { status: 'completed', balance: 320, alreadyProcessed: true },
    });

    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'completed',
      balance: 320,
      alreadyProcessed: true,
    });
  });

  it('returns 401 when user is unauthorized', async () => {
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

  it('returns processing status while webhook has not completed purchase', async () => {
    verifyCheckoutSessionForUserMock.mockResolvedValue({
      ok: true,
      value: { status: 'processing', balance: 120 },
    });

    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'processing', balance: 120 });
  });

  it('returns completed status with creditsAdded in e2e grant path', async () => {
    verifyCheckoutSessionForUserMock.mockResolvedValue({
      ok: true,
      value: { status: 'completed', balance: 500, creditsAdded: 100 },
    });

    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'cs_test_123' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'completed',
      balance: 500,
      creditsAdded: 100,
    });
    expect(verifyCheckoutSessionForUserMock).toHaveBeenCalledTimes(1);
  });
});
