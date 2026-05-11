import { describe, it, expect, vi, beforeEach } from 'vitest'
import { err, ok } from '@repo/result'
import { createUnauthorizedError } from '@repo/auth'
import { GET } from './route'

const requireUserMock = vi.hoisted(() => vi.fn())
const selectMock = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@repo/auth/guards', () => ({
  requireUser: requireUserMock,
}))

vi.mock('@repo/db', () => ({
  db: { select: selectMock },
  projects: {},
  questionHistory: {},
  prdVersions: {},
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(() => ({})),
}))

function setupSelectChain(opts: {
  projectRows: { id: string }[]
  qRows: { founderAnswer: string | null; prdImpact: string | null }[]
  prdCountRows: { c: number }[]
}) {
  let step = 0
  selectMock.mockImplementation(() => {
    step++
    if (step === 1) {
      return {
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(opts.projectRows),
          }),
        }),
      }
    }
    if (step === 2) {
      return {
        from: () => ({
          where: () => Promise.resolve(opts.qRows),
        }),
      }
    }
    return {
      from: () => ({
        where: () => Promise.resolve(opts.prdCountRows),
      }),
    }
  })
}

describe('GET /api/projects/[id]/readiness-score', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireUserMock.mockResolvedValue(
      ok({
        id: 'user-1',
        email: 'a@b.c',
        name: 'n',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      }),
    )
  })

  it('returns 401 when requireUser fails', async () => {
    requireUserMock.mockResolvedValue(err(createUnauthorizedError('no session')))
    const res = await GET(new Request('http://localhost'), { params: { id: 'p1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    setupSelectChain({ projectRows: [], qRows: [], prdCountRows: [{ c: 0 }] })
    const res = await GET(new Request('http://localhost'), { params: { id: 'p1' } })
    expect(res.status).toBe(404)
  })

  it('returns validated readiness JSON when data exists', async () => {
    setupSelectChain({
      projectRows: [{ id: 'p1' }],
      qRows: [{ founderAnswer: 'yes', prdImpact: 'Product Vision' }],
      prdCountRows: [{ c: 0 }],
    })
    const res = await GET(new Request('http://localhost'), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.score).toBe('number')
    expect(body).toHaveProperty('answered')
    expect(body).toHaveProperty('remaining')
    expect(Array.isArray(body.coveredSections)).toBe(true)
    expect(Array.isArray(body.remainingSections)).toBe(true)
  })
})
