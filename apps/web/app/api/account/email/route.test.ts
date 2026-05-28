import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';
import { POST } from './route';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const sendEmailChangeNoticeMock = vi.hoisted(() => vi.fn(async () => undefined));
const usersUpdateWhereMock = vi.hoisted(() => vi.fn(async () => undefined));
const accountsUpdateWhereMock = vi.hoisted(() => vi.fn(async () => undefined));
const setQueue = vi.hoisted(() => [] as Array<() => { where: () => Promise<void> }>);

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@repo/mail', () => ({
  sendEmailChangeNotice: sendEmailChangeNoticeMock,
}));

vi.mock('@repo/db', () => ({
  db: {
    update: () => ({
      set: setQueue.shift() ?? (() => ({ where: async () => undefined })),
    }),
  },
  users: { id: 'id', email: 'email' },
  accounts: { userId: 'userId', providerId: 'providerId', accountId: 'accountId' },
  and: vi.fn(),
  eq: vi.fn(),
}));

describe('POST /api/account/email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setQueue.length = 0;
    setQueue.push(() => ({ where: usersUpdateWhereMock }));
    setQueue.push(() => ({ where: accountsUpdateWhereMock }));
    requireUserMock.mockResolvedValue(
      ok({
        id: 'user-1',
        email: 'old@example.com',
      })
    );
  });

  it('returns 401 when unauthorized', async () => {
    requireUserMock.mockResolvedValueOnce(err(createUnauthorizedError('no session')));
    const req = new Request('http://localhost/api/account/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newEmail: 'new@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid email', async () => {
    const req = new Request('http://localhost/api/account/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newEmail: 'invalid-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('updates email and notifies previous address', async () => {
    const req = new Request('http://localhost/api/account/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newEmail: 'new@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: 'Email updated' });
    expect(usersUpdateWhereMock).toHaveBeenCalledTimes(1);
    expect(accountsUpdateWhereMock).toHaveBeenCalledTimes(1);
    expect(sendEmailChangeNoticeMock).toHaveBeenCalledWith({
      to: 'old@example.com',
      newEmail: 'new@example.com',
    });
  });
});
