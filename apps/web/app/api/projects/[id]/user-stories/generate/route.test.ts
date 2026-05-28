import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@repo/result';
import { createUnauthorizedError } from '@repo/auth';
import { POST } from './route';
import { NotFoundError } from '@shared/errors/application-error';

const requireUserMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn(async () => new Headers()));
const executeMock = vi.hoisted(() => vi.fn());
const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}));

vi.mock('@application/user-stories', () => ({
  GenerateUserStoryDraftUseCase: class {
    execute = executeMock;
  },
}));

vi.mock('@infrastructure/persistence/project-repository', () => ({
  DrizzleProjectRepository: class {},
}));

vi.mock('@infrastructure/persistence/feature-split-repository', () => ({
  DrizzleFeatureSplitRepository: class {},
}));

vi.mock('@infrastructure/persistence/user-story-corpus-repository', () => ({
  DrizzleUserStoryCorpusRepository: class {},
}));

vi.mock('@infrastructure/ai/user-story-draft-generator-adapter', () => ({
  UserStoryDraftGeneratorAdapter: class {},
}));

vi.mock('@shared/observability/logger', () => ({
  createLogger: () => ({
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('POST /api/projects/[id]/user-stories/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(ok({ id: 'user-1' }));
  });

  it('returns 401 when unauthorized', async () => {
    requireUserMock.mockResolvedValueOnce(err(createUnauthorizedError('no session')));
    const req = new Request('http://localhost/api/projects/proj-1/user-stories/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        featureSplitClusterId: 'cluster-1',
        mode: 'template',
      }),
    });

    const res = await POST(req as never, { params: { id: 'proj-1' } });
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input', async () => {
    const req = new Request('http://localhost/api/projects/proj-1/user-stories/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'template',
      }),
    });

    const res = await POST(req as never, { params: { id: 'proj-1' } });
    expect(res.status).toBe(400);
  });

  it('returns outline response when use case succeeds', async () => {
    executeMock.mockResolvedValue(
      ok({
        kind: 'outline',
        outlines: [{ title: 'As a founder, I can define roles' }],
        total: 1,
      })
    );
    const req = new Request('http://localhost/api/projects/proj-1/user-stories/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        featureSplitClusterId: 'cluster-1',
        mode: 'ai',
        aiStep: 'outline',
      }),
    });

    const res = await POST(req as never, { params: { id: 'proj-1' } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      kind: 'outline',
      outlines: [{ title: 'As a founder, I can define roles' }],
      total: 1,
    });
  });

  it('maps application error to route status', async () => {
    executeMock.mockResolvedValue(err(new NotFoundError('Cluster not found')));
    const req = new Request('http://localhost/api/projects/proj-1/user-stories/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        featureSplitClusterId: 'cluster-1',
        mode: 'template',
      }),
    });

    const res = await POST(req as never, { params: { id: 'proj-1' } });
    expect(res.status).toBe(404);
  });
});
