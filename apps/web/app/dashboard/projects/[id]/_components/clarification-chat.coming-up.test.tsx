/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { waitFor } from '@testing-library/react'
import { ClarificationChat } from './clarification-chat'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}))

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

const historyPayload = [
  {
    id: '1',
    projectId: 'proj-1',
    prdVersionId: null,
    structuredQuestion: 'What is the vision?',
    availableOptions: null,
    founderAnswer: null,
    optionalComment: null,
    aiInterpretation: null,
    prdImpact: 'Product Vision',
    questionType: 'clarification',
    createdAt: '2026-05-11T00:00:00.000Z',
  },
]

describe('ClarificationChat — Coming up chips', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string | URL) => {
        if (String(url).includes('/questions')) {
          return Promise.resolve({
            ok: true,
            json: async () => historyPayload,
          } as Response)
        }
        return Promise.resolve({ ok: false, status: 404 } as Response)
      }) as typeof fetch,
    )
  })

  it('renders upcoming canonical sections after history loads', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)

    await act(async () => {
      root.render(
        createElement(ClarificationChat, {
          projectId: 'proj-1',
          prdVersionId: null,
          journeyMode: 'standard',
          onPrdGenerated: vi.fn(),
        }),
      )
    })

    await waitFor(() => {
      expect(document.body.textContent).toContain('Coming up')
      expect(document.body.textContent).toContain('Target Users')
    })

    root.unmount()
    el.remove()
  })

  it('shows ready-to-generate hint when loaded history covers all canonical PRD sections', async () => {
    const sections = [
      'Product Vision',
      'Target Users',
      'Core Features',
      'User Journeys',
      'Technical Constraints',
      'Success Metrics',
      'Out of Scope',
      'Open Questions',
    ] as const
    const fullHistoryPayload = sections.map((prdImpact, i) => ({
      id: String(i + 1),
      projectId: 'proj-1',
      prdVersionId: null,
      structuredQuestion: `Q about ${prdImpact}?`,
      availableOptions: null,
      founderAnswer: 'ok',
      optionalComment: null,
      aiInterpretation: null,
      prdImpact,
      questionType: 'clarification',
      createdAt: '2026-05-11T00:00:00.000Z',
    }))

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string | URL) => {
        if (String(url).includes('/questions')) {
          return Promise.resolve({
            ok: true,
            json: async () => fullHistoryPayload,
          } as Response)
        }
        return Promise.resolve({ ok: false, status: 404 } as Response)
      }) as typeof fetch,
    )

    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)

    await act(async () => {
      root.render(
        createElement(ClarificationChat, {
          projectId: 'proj-1',
          prdVersionId: null,
          journeyMode: 'standard',
          onPrdGenerated: vi.fn(),
        }),
      )
    })

    await waitFor(() => {
      expect(document.body.textContent).toContain('Ready to generate PRD')
      expect(document.body.textContent).not.toContain('Coming up')
    })

    root.unmount()
    el.remove()
  })
})
