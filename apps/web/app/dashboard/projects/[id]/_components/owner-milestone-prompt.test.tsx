/** @vitest-environment happy-dom */

import { createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import type { OwnerMilestoneDetectedPayload } from '@repo/contracts/feedback/milestone-prompt'
import { OwnerMilestonePromptShell, useOwnerMilestonePrompt } from './owner-milestone-prompt'

const nav = vi.hoisted(() => {
  const replace = vi.fn()
  let params = new URLSearchParams()
  return {
    replace,
    getParams: () => params,
    setParams: (p: URLSearchParams) => {
      params = p
    },
    resetParams: () => {
      params = new URLSearchParams()
    },
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/dashboard/projects/p1',
  useSearchParams: () => nav.getParams(),
}))

function milestonePayloadToSearchParam(payload: OwnerMilestoneDetectedPayload): string {
  const json = JSON.stringify(payload)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function SignalOnMount({ payload }: { payload: OwnerMilestoneDetectedPayload }) {
  const { signalMilestone } = useOwnerMilestonePrompt()
  useEffect(() => {
    signalMilestone(payload)
  }, [signalMilestone, payload])
  return null
}

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

describe('OwnerMilestonePromptShell', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    nav.resetParams()
    nav.replace.mockReset()
    // Simulate Next applying the URL update after `router.replace` (otherwise
    // `milestonePayload` stays in our mock params and the effect re-fires forever).
    nav.replace.mockImplementation(() => {
      nav.getParams().delete('milestonePayload')
    })
    sessionStorage.clear()
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
    vi.restoreAllMocks()
  })

  it('shows prompt when signalMilestone receives a matching project payload', async () => {
    const payload: OwnerMilestoneDetectedPayload = {
      projectId: 'p1',
      milestoneType: 'prd_created',
    }
    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(SignalOnMount, { payload }),
        })
      )
    })

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('First PRD version saved')
  })

  it('ignores signal when projectId does not match shell', async () => {
    const payload: OwnerMilestoneDetectedPayload = {
      projectId: 'other-project',
      milestoneType: 'prd_created',
    }
    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(SignalOnMount, { payload }),
        })
      )
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('does not show when milestone type was dismissed in sessionStorage', async () => {
    sessionStorage.setItem(
      'zedos:milestone-prompt-dismissed:v0:p1',
      JSON.stringify({ types: ['prd_shared'] })
    )
    const payload: OwnerMilestoneDetectedPayload = {
      projectId: 'p1',
      milestoneType: 'prd_shared',
      prdVersionId: 'pv-1',
    }
    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement(SignalOnMount, { payload }),
        })
      )
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('opens from milestonePayload search param and strips it via router.replace', async () => {
    const payload: OwnerMilestoneDetectedPayload = {
      projectId: 'p1',
      milestoneType: 'prd_viewed',
      prdVersionId: 'pv-1',
    }
    const encoded = milestonePayloadToSearchParam(payload)
    nav.setParams(new URLSearchParams({ milestonePayload: encoded }))

    await act(async () => {
      root.render(
        createElement(OwnerMilestonePromptShell, {
          projectId: 'p1',
          children: createElement('span', null, 'child'),
        })
      )
    })

    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Welcome back to your PRD')
    expect(nav.replace).toHaveBeenCalledWith('/dashboard/projects/p1', { scroll: false })
  })
})
