/** @vitest-environment happy-dom */

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { ClarificationChat } from './clarification-chat'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/components/milestone-feedback-modal', () => ({
  MilestoneFeedbackModal: () => null,
}))
vi.mock('./decision-card', () => ({
  DecisionCard: () => null,
}))

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

describe('ClarificationChat — Coming up chips', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows next canonical sections based on assistant prd_section_affected from loaded history', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const url = String(input)
      if (url.endsWith('/api/projects/proj-1/questions')) {
        return new Response(
          JSON.stringify([
            {
              structuredQuestion: 'What is the vision?',
              prdImpact: 'Product Vision',
              founderAnswer: 'Build a planner',
              availableOptions: null,
              aiInterpretation: null,
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({}), { status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root.render(
        createElement(ClarificationChat, {
          projectId: 'proj-1',
          prdVersionId: null,
          onPrdGenerated: () => {},
        })
      )
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(document.body.textContent).toContain('Coming up')
    expect(document.body.textContent).toContain('Target Users')
    expect(document.body.textContent).toContain('Core Features')
    expect(document.body.textContent).toContain('User Journeys')
  })
})
