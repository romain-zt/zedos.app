/** @vitest-environment happy-dom */

import { createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import {
  OwnerMilestonePromptShell,
  useOwnerMilestonePrompt,
} from './[id]/_components/owner-milestone-prompt'

const routerReplace = vi.fn()
/** Same object every render — `OwnerMilestonePromptInner` memoizes callbacks on `router`. */
const mockRouterStable = {
  replace: (...args: unknown[]) => routerReplace(...args),
}
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouterStable,
  usePathname: () => '/dashboard/projects/p1',
  useSearchParams: () => mockSearchParams,
}))

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

function noop() {}

function MilestoneEmitter({
  onReady,
}: {
  onReady: (emit: (p: { projectId: string; milestoneType: 'prd_created' }) => void) => void
}) {
  const { signalMilestone } = useOwnerMilestonePrompt()
  useEffect(() => {
    onReady((payload) => signalMilestone(payload))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalMilestone])
  return null
}

describe('OwnerMilestonePromptShell', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    routerReplace.mockImplementation(() => {
      mockSearchParams.delete('milestonePayload')
    })
    sessionStorage.clear()
    mockSearchParams = new URLSearchParams()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the milestone banner when signalMilestone receives a matching payload', async () => {
    let emit: ((p: { projectId: string; milestoneType: 'prd_created' }) => void) | null = null

    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(MilestoneEmitter, {
            onReady: (fn) => {
              emit = fn
            },
          }),
        }),
      )
    })

    await act(async () => {
      emit?.({ projectId: 'p1', milestoneType: 'prd_created' })
    })

    expect(document.body.textContent).toContain('First PRD version saved')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('records dismiss in sessionStorage when Skip is clicked', async () => {
    let emit: ((p: { projectId: string; milestoneType: 'prd_created' }) => void) | null = null

    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(MilestoneEmitter, {
            onReady: (fn) => {
              emit = fn
            },
          }),
        }),
      )
    })

    await act(async () => {
      emit?.({ projectId: 'p1', milestoneType: 'prd_created' })
    })

    const skip = document.body.querySelector('button')
    expect(skip).not.toBeNull()

    await act(async () => {
      skip!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(sessionStorage.getItem('zedos:milestone-prompt-dismissed:v0:p1')).toContain(
      'prd_created',
    )

    await act(async () => {
      emit?.({ projectId: 'p1', milestoneType: 'prd_created' })
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('parses milestonePayload from URL and replaces route to strip the query param', async () => {
    const payload = JSON.stringify({ projectId: 'p1', milestoneType: 'prd_viewed' })
    const b64url = Buffer.from(payload, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    mockSearchParams = new URLSearchParams(`milestonePayload=${b64url}`)

    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(MilestoneEmitter, { onReady: noop }),
        }),
      )
    })

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve))
    })

    expect(document.body.textContent).toContain('Welcome back to your PRD')
    expect(routerReplace).toHaveBeenCalledWith('/dashboard/projects/p1', {
      scroll: false,
    })
  })
})
