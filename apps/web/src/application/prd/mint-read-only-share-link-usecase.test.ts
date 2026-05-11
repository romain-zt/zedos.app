import { describe, expect, it, vi } from 'vitest';
import { ok, err } from '@repo/result';
import { NotFoundError } from '@shared/errors/application-error';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import { MintReadOnlyShareLinkUseCase } from './mint-read-only-share-link-usecase';

describe('MintReadOnlyShareLinkUseCase', () => {
  it('forwards repository success', async () => {
    const link = {
      id: 'sl-1',
      prdVersionId: 'pv-1',
      token: 'tok',
      enabled: true,
      createdAt: new Date(),
      disabledAt: null,
    };
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn().mockResolvedValue(ok(link)),
    };
    const useCase = new MintReadOnlyShareLinkUseCase(repo);
    const result = await useCase.execute('pv-1', 'user-1');
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.unwrap().token).toBe('tok');
    expect(repo.mintReadOnlyShareLink).toHaveBeenCalledWith('pv-1', 'user-1');
  });

  it('forwards repository not-found', async () => {
    const repo: IPrdRepository = {
      findByProjectId: vi.fn(),
      findLatestByProjectId: vi.fn(),
      ensureFirstVersion: vi.fn(),
      mintReadOnlyShareLink: vi.fn().mockResolvedValue(err(new NotFoundError('PRD version not found'))),
    };
    const useCase = new MintReadOnlyShareLinkUseCase(repo);
    const result = await useCase.execute('bad', 'user-1');
    expect(result.isErr()).toBe(true);
  });
});
