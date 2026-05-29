import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';
import { POST } from './route';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const deleteWhereMock = vi.hoisted(() => vi.fn(async () => undefined));
const signOutMock = vi.hoisted(() => vi.fn(async () => undefined));
const sendAccountDeletionNoticeMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@repo/auth/server', () => ({
  auth: {
    api: {
      signOut: signOutMock,
    },
  },
}));

vi.mock('@repo/mail', () => ({
  sendAccountDeletionNotice: sendAccountDeletionNoticeMock,
}));

vi.mock('@repo/db', () => ({
  db: {
    delete: () => ({
      where: deleteWhereMock,
    }),
  },
  users: { id: 'id' },
  eq: vi.fn(),
}));

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(
      ok({
        id: 'user-1',
        email: 'owner@example.com',
      })
    );
  });

  it('returns 401 when unauthorized', async () => {
    requireUserMock.mockResolvedValueOnce(err(createUnauthorizedError('no session')));
    const req = new Request('http://localhost/api/account/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'secret123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    const req = new Request('http://localhost/api/account/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('deletes account and signs out user', async () => {
    const req = new Request('http://localhost/api/account/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'secret123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: 'Account deleted' });
    expect(sendAccountDeletionNoticeMock).toHaveBeenCalledWith({ to: 'owner@example.com' });
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
