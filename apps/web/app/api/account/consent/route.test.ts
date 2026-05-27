import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';
import { GET, POST } from './route';

const requireUserMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const executeMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@repo/db', () => ({
  db: {
    select: selectMock,
    update: updateMock,
    execute: executeMock,
  },
  users: {
    id: 'id',
    marketingConsent: 'marketingConsent',
    productUpdatesConsent: 'productUpdatesConsent',
    consentUpdatedAt: 'consentUpdatedAt',
  },
  sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
  eq: vi.fn(),
}));

describe('account consent route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(
      ok({
        id: 'user-1',
        email: 'john@doe.dev',
        name: 'John',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      }),
    );
  });

  it('returns 401 when unauthorized on GET', async () => {
    requireUserMock.mockResolvedValue(err(createUnauthorizedError('no session')));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns consent values on GET', async () => {
    selectMock.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                marketingConsent: true,
                productUpdatesConsent: false,
                consentUpdatedAt: null,
              },
            ]),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.marketingConsent).toBe(true);
    expect(body.productUpdatesConsent).toBe(false);
  });

  it('updates consent on POST', async () => {
    updateMock.mockReturnValue({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    });

    const req = new Request('http://localhost/api/account/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ marketingConsent: true, productUpdatesConsent: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
