import { describe, it, expect, vi } from 'vitest'
import { GetProjectUseCase } from './get-project-usecase'
import { ok, err } from '@repo/result'
import { NotFoundError } from '@shared/errors/application-error'
import type { IProjectRepository } from '@domain/project/project-repository'

const makeMockRepo = (): IProjectRepository => ({
  findById: vi.fn(),
  findByIdAndUserId: vi.fn(),
  findAllByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
})

describe('GetProjectUseCase', () => {
  it('returns project when repository succeeds', async () => {
    const repo = makeMockRepo()
    const project = {
      id: 'p1',
      userId: 'u1',
      name: 'Alpha',
      description: null,
      phase: 'intake' as const,
      architectureStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(repo.findByIdAndUserId).mockResolvedValue(ok(project))

    const uc = new GetProjectUseCase(repo)
    const result = await uc.execute('p1', 'u1')
    expect(result.isOk()).toBe(true)
    if (result.isOk()) expect(result.unwrap().id).toBe('p1')
    expect(repo.findByIdAndUserId).toHaveBeenCalledWith('p1', 'u1')
  })

  it('propagates not-found from repository', async () => {
    const repo = makeMockRepo()
    vi.mocked(repo.findByIdAndUserId).mockResolvedValue(err(new NotFoundError('Project not found')))

    const uc = new GetProjectUseCase(repo)
    const result = await uc.execute('missing', 'u1')
    expect(result.isErr()).toBe(true)
  })
})
