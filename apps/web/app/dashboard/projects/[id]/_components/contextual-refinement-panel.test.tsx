/** @vitest-environment happy-dom */

import type { ComponentProps } from 'react'
import { createElement } from 'react'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import {
  ContextualRefinementPanel,
  buildContextualClarifyBody,
  reduceClarifySseDataLine,
} from './contextual-refinement-panel'

const toastFns = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: toastFns,
}))

function sseResponse(chunks: string[]) {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(enc.encode(c))
      }
      controller.close()
    },
  })
}

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

/** Triggers React `onChange` for controlled textareas (Radix portal + React 18). */
function setTextareaValue(el: HTMLTextAreaElement | null, value: string) {
  if (!el) throw new Error('textarea not found (Sheet may render in a portal)')
  act(() => {
    fireEvent.change(el, { target: { value } })
  })
}

function refinementTextarea() {
  return document.querySelector(
    'textarea[aria-label="Refinement message"]'
  ) as HTMLTextAreaElement | null
}

function refinementSendButton() {
  return document.querySelector(
    'button[aria-label="Send refinement"]'
  ) as HTMLButtonElement | null
}

describe('buildContextualClarifyBody / reduceClarifySseDataLine', () => {
  it('prefixes message with context label', () => {
    const body = buildContextualClarifyBody('Goals', 'expand pricing', 'pv-1')
    expect(body).toEqual({
      message: 'Refine [Goals]: expand pricing',
      prdVersionId: 'pv-1',
    })
  })

  it('aggregates processing partials and parses completed JSON', () => {
    let s = ''
    s = reduceClarifySseDataLine('data: {"status":"processing","partial":"a"}', s)
      .nextAssistantContent
    s = reduceClarifySseDataLine('data: {"status":"processing","partial":"b"}', s)
      .nextAssistantContent
    const done = reduceClarifySseDataLine(
      `data: {"status":"completed","result":${JSON.stringify(JSON.stringify({ message: 'ab', reasoning: 'z' }))}}`,
      s
    )
    expect(done.finalMessage).toBe('ab')
    expect(done.finalReasoning).toBe('z')
  })

  it('surfaces stream error status', () => {
    const r = reduceClarifySseDataLine(
      'data: {"status":"error","message":"bad"}',
      ''
    )
    expect(r.streamError).toBe('bad')
  })
})

describe('ContextualRefinementPanel', () => {
  let container: HTMLDivElement
  let root: Root
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    toastFns.error.mockClear()
    toastFns.success.mockClear()
    fetchMock.mockReset()
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
  })

  function renderPanel(
    props: Partial<ComponentProps<typeof ContextualRefinementPanel>> & {
      onClose?: () => void
    } = {}
  ) {
    const { onClose: onCloseProp, ...rest } = props
    const onClose = onCloseProp ?? vi.fn()
    act(() => {
      root.render(
        createElement(ContextualRefinementPanel, {
          projectId: 'proj-1',
          prdVersionId: 'pv-1',
          contextLabel: 'My Context',
          isOpen: true,
          onClose,
          ...rest,
        })
      )
    })
    return { onClose }
  }

  it('renders sheet title with context label', () => {
    renderPanel()
    expect(document.body.textContent).toContain('Refine: My Context')
  })

  it('POSTs clarify with prefixed message and prdVersionId', async () => {
    fetchMock.mockResolvedValue(
      new Response(sseResponse([]), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    )

    renderPanel()

    const ta = refinementTextarea()
    setTextareaValue(ta, 'Please tweak this')

    const send = refinementSendButton()!
    await act(async () => {
      send.click()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/proj-1/clarify',
      expect.objectContaining({ method: 'POST' })
    )
    const [, init] = fetchMock.mock.calls[0]!
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toMatchObject({
      message: 'Refine [My Context]: Please tweak this',
      prdVersionId: 'pv-1',
      decisionResponse: null,
    })
  })

  it('shows streamed assistant message (and reasoning) when SSE completes', async () => {
    const resultJson = JSON.stringify({
      message: 'Done',
      reasoning: 'Short chain',
    })
    fetchMock.mockResolvedValue(
      new Response(
        sseResponse([
          'data: {"status":"processing","partial":"ignored"}\n\n',
          `data: {"status":"completed","result":${JSON.stringify(resultJson)}}\n\n`,
        ]),
        { status: 200 }
      )
    )

    renderPanel()

    const ta = refinementTextarea()
    setTextareaValue(ta, 'go')

    const send = refinementSendButton()!
    await act(async () => {
      send.click()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('Done')
    expect(document.body.textContent).toContain('Short chain')
    expect(document.body.textContent).not.toContain('Thinking')
  })

  it('on 402: toast, credit block disables send', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not enough credits' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    renderPanel()

    const ta = refinementTextarea()
    setTextareaValue(ta, 'x')

    const send = refinementSendButton()!
    await act(async () => {
      send.click()
    })

    expect(toastFns.error).toHaveBeenCalledWith('Not enough credits')

    await act(async () => {
      await Promise.resolve()
    })

    const sendAfter = refinementSendButton()!
    expect(sendAfter.disabled).toBe(true)
  })

  it('calls onClose when Close is clicked after response', async () => {
    const resultJson = JSON.stringify({ message: 'ok' })
    fetchMock.mockResolvedValue(
      new Response(
        sseResponse([
          `data: {"status":"completed","result":${JSON.stringify(resultJson)}}\n\n`,
        ]),
        { status: 200 }
      )
    )

    const { onClose } = renderPanel()

    const ta = refinementTextarea()
    setTextareaValue(ta, 'm')

    await act(async () => {
      refinementSendButton()!.click()
      await Promise.resolve()
    })

    const closeBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent === 'Close'
    ) as HTMLButtonElement

    await act(async () => {
      closeBtn.click()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
