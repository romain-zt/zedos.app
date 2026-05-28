import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { UnauthorizedError } from '@shared/errors/application-error';
import { POST } from './route';

const requireUserMock = vi.fn();
const selectQueue: Array<Array<{ id: string }>> = [];
const insertReturningMock = vi.fn(async () => [
  {
    id: 'fb-1',
    userId: 'user-1',
    projectId: 'project-1',
    prdVersionId: 'prd-1',
    milestoneType: 'prd_created',
    ratingType: 'stars',
    ratingValue: 4,
    comment: 'Great',
    createdAt: new Date().toISOString(),
  },
]);

function dequeueSelectResult(): Array<{ id: string }> {
  if (selectQueue.length === 0) return [];
  const [first] = selectQueue;
  selectQueue.splice(0, 1);
  return first;
}

vi.mock('@repo/auth/guards', () => ({
  requireUser: (...args: Array<object>) => requireUserMock(...args),
}));

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
}));

vi.mock('@repo/db', () => {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: async () => dequeueSelectResult(),
  };
  return {
    db: {
      select: () => chain,
      insert: () => ({
        values: () => ({
          returning: insertReturningMock,
        }),
      }),
    },
    milestoneFeedback: {
      id: 'id',
      userId: 'userId',
      projectId: 'projectId',
      prdVersionId: 'prdVersionId',
      milestoneType: 'milestoneType',
      createdAt: 'createdAt',
    },
    projects: {
      id: 'id',
      userId: 'userId',
    },
    eq: (..._args: Array<object | string | null>) => true,
    and: (..._args: Array<boolean>) => true,
    or: (..._args: Array<boolean>) => true,
    isNull: (..._args: Array<object | string>) => true,
    desc: (..._args: Array<object | string>) => true,
  };
});

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue.length = 0;
  });

  it('returns 401 when user is not authenticated', async () => {
    requireUserMock.mockResolvedValueOnce(err(new UnauthorizedError()));
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'project-1', milestoneType: 'prd_created' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    requireUserMock.mockResolvedValueOnce(ok({ id: 'user-1' }));
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: '' }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('returns 403 when project is not owned by user', async () => {
    requireUserMock.mockResolvedValueOnce(ok({ id: 'user-1' }));
    selectQueue.push([]);
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId: 'project-1',
        prdVersionId: 'prd-1',
        milestoneType: 'prd_created',
        ratingValue: 4,
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it('returns duplicate message when feedback already exists', async () => {
    requireUserMock.mockResolvedValueOnce(ok({ id: 'user-1' }));
    selectQueue.push([{ id: 'project-1' }]);
    selectQueue.push([{ id: 'existing-feedback' }]);

    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId: 'project-1',
        prdVersionId: 'prd-1',
        milestoneType: 'prd_created',
        ratingValue: 4,
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Feedback already submitted' });
    expect(insertReturningMock).not.toHaveBeenCalled();
  });
});
