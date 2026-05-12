import { describe, expect, it, vi } from 'vitest';
import { ok, err } from '@repo/result';
import { NotFoundError } from '@shared/errors/application-error';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import { RevokeReadOnlyShareLinkUseCase } from './revoke-read-only-share-link-usecase';

describe('RevokeReadOnlyShareLinkUseCase', () => {
  it('forwards repository success', async () => {
    const link = {
      id: 'sl-1',
      prdVersionId: 'pv-1',
      token: 'tok',
      enabled: false,
      createdAt: new Date(),
      disabledAt: new Date(),
    };
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn(),
      revokeReadOnlyShareLink: vi.fn().mockResolvedValue(ok(link)),
      getAnonymousPrdVersionByShareToken: vi.fn(),
      findVersionByIdForOwner: vi.fn(),
    };
    const useCase = new RevokeReadOnlyShareLinkUseCase(repo);
    const result = await useCase.execute('sl-1', 'user-1');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.unwrap().enabled).toBe(false);
    expect(repo.revokeReadOnlyShareLink).toHaveBeenCalledWith('sl-1', 'user-1');
  });

  it('forwards repository not-found', async () => {
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn(),
      revokeReadOnlyShareLink: vi.fn().mockResolvedValue(err(new NotFoundError('Share link not found'))),
      getAnonymousPrdVersionByShareToken: vi.fn(),
      findVersionByIdForOwner: vi.fn(),
    };
    const useCase = new RevokeReadOnlyShareLinkUseCase(repo);
    const result = await useCase.execute('bad', 'user-1');
    expect(result.isErr()).toBe(true);
  });
});
