import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';
import { POST } from './route';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const changePasswordMock = vi.hoisted(() => vi.fn(async () => undefined));
const sendPasswordChangeNoticeMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@repo/auth/server', () => ({
  auth: {
    api: {
      changePassword: changePasswordMock,
    },
  },
}));

vi.mock('@repo/mail', () => ({
  sendPasswordChangeNotice: sendPasswordChangeNoticeMock,
}));

describe('POST /api/account/password', () => {
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
    const req = new Request('http://localhost/api/account/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    const req = new Request('http://localhost/api/account/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        currentPassword: '',
        newPassword: 'short',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('changes password and sends notification', async () => {
    const req = new Request('http://localhost/api/account/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
        revokeOtherSessions: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: 'Password updated' });
    expect(changePasswordMock).toHaveBeenCalledTimes(1);
    expect(sendPasswordChangeNoticeMock).toHaveBeenCalledWith({ to: 'owner@example.com' });
  });
});
