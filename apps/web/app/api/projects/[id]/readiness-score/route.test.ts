import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, err } from '@repo/result'
import { createUnauthorizedError } from '@repo/auth'

const fetchProjectReadinessScore = vi.fn()
vi.mock('./readiness-score-data', () => ({
  fetchProjectReadinessScore: (...args: unknown[]) => fetchProjectReadinessScore(...args),
}))

const requireUser = vi.fn()
vi.mock('@repo/auth/guards', () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

describe('GET /api/projects/[id]/readiness-score', () => {
  beforeEach(() => {
    vi.resetModules()
    fetchProjectReadinessScore.mockReset()
    requireUser.mockReset()
  })

  it('returns 401 when requireUser fails', async () => {
    requireUser.mockResolvedValue(err(createUnauthorizedError('No active session')))
    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost'), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when lookup fails', async () => {
    requireUser.mockResolvedValue(ok({ id: 'user-1' } as never))
    fetchProjectReadinessScore.mockResolvedValue({
      ok: false,
      error: 'Project not found',
      status: 404,
    })
    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost'), { params: { id: 'p-missing' } })
    expect(res.status).toBe(404)
  })

  it('returns validated JSON on success', async () => {
    requireUser.mockResolvedValue(ok({ id: 'user-1' } as never))
    const dto = {
      score: 50,
      answered: 4,
      remaining: 4,
      coveredSections: ['Product Vision', 'Target Users', 'Core Features', 'User Journeys'] as string[],
      remainingSections: ['Technical Constraints', 'Success Metrics', 'Out of Scope', 'Open Questions'],
    }
    fetchProjectReadinessScore.mockResolvedValue({ ok: true, data: dto })
    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost'), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(dto)
    expect(fetchProjectReadinessScore).toHaveBeenCalledWith('p1', 'user-1')
  })
})
