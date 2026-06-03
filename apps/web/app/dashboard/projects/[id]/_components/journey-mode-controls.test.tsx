/** @vitest-environment happy-dom */

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { JourneyModeControls } from './journey-mode-controls'

const toastFns = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: toastFns,
}))

vi.mock('@/src/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tp: (_k: string, fb: string) => fb,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}))

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

describe('JourneyModeControls', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ journeyMode: 'express' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    toastFns.error.mockReset()
    toastFns.success.mockReset()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows express badge when journey mode is express', async () => {
    await act(async () => {
      root.render(
        createElement(JourneyModeControls, {
          projectId: 'p1',
          journeyMode: 'express',
          onJourneyModeChange: vi.fn(),
        })
      )
    })

    expect(document.body.textContent).toContain('workspace.journeyModeExpress')
  })

  it('PATCHes express mode after confirmation', async () => {
    const onChange = vi.fn()
    const onExpress = vi.fn()

    await act(async () => {
      root.render(
        createElement(JourneyModeControls, {
          projectId: 'p1',
          journeyMode: 'standard',
          onJourneyModeChange: onChange,
          onExpressActivated: onExpress,
        })
      )
    })

    const changeBtn = document.querySelector('[data-testid="journey-mode-change"]') as HTMLButtonElement
    expect(changeBtn).toBeTruthy()

    await act(async () => {
      fireEvent.pointerDown(changeBtn, { button: 0, ctrlKey: false })
      fireEvent.click(changeBtn)
    })

    const expressItem = document.querySelector('[data-testid="journey-mode-switch-express"]')
    expect(expressItem).toBeTruthy()

    await act(async () => {
      fireEvent.click(expressItem!)
    })

    const confirmBtn = document.querySelector('[data-testid="journey-mode-confirm"]') as HTMLButtonElement
    expect(confirmBtn).toBeTruthy()

    await act(async () => {
      fireEvent.click(confirmBtn)
      await Promise.resolve()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/journey-mode',
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(onChange).toHaveBeenCalledWith('express')
    expect(onExpress).toHaveBeenCalledOnce()
    expect(toastFns.success).toHaveBeenCalled()
  })
})
