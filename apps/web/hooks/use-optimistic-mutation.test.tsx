// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useOptimisticMutation } from './use-optimistic-mutation'
import { useAgentJob } from './use-agent-job'

function useHarness() {
  const [items, setItems] = useState<string[]>(['a'])
  const [error, setError] = useState<string | null>(null)
  const [committed, setCommitted] = useState(0)
  const mutation = useOptimisticMutation<string[]>({
    getState: () => items,
    setState: setItems,
    onError: (message) => setError(message ?? 'generic'),
    onCommitted: () => setCommitted((c) => c + 1),
  })
  return { items, error, committed, ...mutation }
}

describe('useOptimisticMutation', () => {
  it('applies the optimistic state immediately and commits on success', async () => {
    let resolveRequest: (value: { ok: boolean }) => void = () => {}
    const { result } = renderHook(() => useHarness())

    let mutatePromise: Promise<boolean> = Promise.resolve(false)
    act(() => {
      mutatePromise = result.current.mutate({
        optimistic: (items) => [...items, 'b'],
        request: () => new Promise((resolve) => (resolveRequest = resolve)),
      })
    })

    // optimistic state visible before the request resolves
    expect(result.current.items).toEqual(['a', 'b'])
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveRequest({ ok: true })
      await mutatePromise
    })

    expect(result.current.items).toEqual(['a', 'b'])
    expect(result.current.committed).toBe(1)
    expect(result.current.isPending).toBe(false)
  })

  it('rolls back to the snapshot and surfaces the error on failure', async () => {
    const { result } = renderHook(() => useHarness())

    await act(async () => {
      await result.current.mutate({
        optimistic: (items) => [...items, 'b'],
        request: async () => ({ ok: false, errorMessage: 'nope' }),
      })
    })

    expect(result.current.items).toEqual(['a'])
    expect(result.current.error).toBe('nope')
    expect(result.current.committed).toBe(0)
  })

  it('rolls back when the request throws', async () => {
    const { result } = renderHook(() => useHarness())

    await act(async () => {
      await result.current.mutate({
        optimistic: (items) => [...items, 'b'],
        request: async () => {
          throw new Error('network down')
        },
      })
    })

    expect(result.current.items).toEqual(['a'])
    expect(result.current.error).toBe('generic')
  })
})

describe('useAgentJob', () => {
  it('moves idle → optimistic → committed and delivers the value', async () => {
    const onCommitted = vi.fn()
    const { result } = renderHook(() => useAgentJob<string>())

    let resolveRequest: (v: { ok: true; value: string }) => void = () => {}
    act(() => {
      void result.current.run({
        request: () => new Promise((resolve) => (resolveRequest = resolve)),
        onCommitted,
      })
    })

    expect(result.current.phase).toBe('optimistic')
    expect(result.current.isRunning).toBe(true)

    await act(async () => {
      resolveRequest({ ok: true, value: 'plan' })
    })
    await waitFor(() => expect(result.current.phase).toBe('committed'))
    expect(onCommitted).toHaveBeenCalledWith('plan')
  })

  it('resets to failed with the server message on error', async () => {
    const onFailed = vi.fn()
    const { result } = renderHook(() => useAgentJob())

    await act(async () => {
      await result.current.run({
        request: async () => ({ ok: false, errorMessage: 'quota' }),
        onFailed,
      })
    })

    expect(result.current.phase).toBe('failed')
    expect(result.current.errorMessage).toBe('quota')
    expect(onFailed).toHaveBeenCalledWith('quota')
  })

  it('guards against double submit while running', async () => {
    const firstRequest = vi.fn(
      () => new Promise<{ ok: true; value: null }>(() => {}) // never resolves
    )
    const secondRequest = vi.fn(async () => ({ ok: true as const, value: null }))
    const { result } = renderHook(() => useAgentJob<null>())

    act(() => {
      void result.current.run({ request: firstRequest })
    })
    act(() => {
      void result.current.run({ request: secondRequest })
    })

    expect(firstRequest).toHaveBeenCalledTimes(1)
    expect(secondRequest).not.toHaveBeenCalled()
  })

  it('reset returns to idle', async () => {
    const { result } = renderHook(() => useAgentJob())
    await act(async () => {
      await result.current.run({ request: async () => ({ ok: false }) })
    })
    expect(result.current.phase).toBe('failed')
    act(() => result.current.reset())
    expect(result.current.phase).toBe('idle')
  })
})
