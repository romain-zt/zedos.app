import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const createCheckoutSessionForUserMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@application/payments/stripe-checkout-flows', () => ({
  createCheckoutSessionForUser: createCheckoutSessionForUserMock,
}));

async function loadRoute() {
  vi.resetModules();
  const mod = await import('./route');
  return mod.POST;
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(ok({ id: 'user-1' }));
    createCheckoutSessionForUserMock.mockResolvedValue({
      ok: true,
      value: { url: 'https://checkout.stripe.dev/session' },
    });
  });

  it('returns 503 when Stripe is not configured', async () => {
    createCheckoutSessionForUserMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      error: 'Stripe is not configured',
    });
    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ packId: 'pack_100' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it('creates checkout session for a valid pack', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ packId: 'pack_100' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.dev/session' });
    expect(createCheckoutSessionForUserMock).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when user is unauthorized', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    requireUserMock.mockResolvedValueOnce(err(createUnauthorizedError('no session')));
    const POST = await loadRoute();
    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ packId: 'pack_100' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });
});
