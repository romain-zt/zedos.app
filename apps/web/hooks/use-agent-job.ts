'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type AgentJobPhase = 'idle' | 'optimistic' | 'committed' | 'failed'

export interface AgentJobState {
  phase: AgentJobPhase
  errorMessage: string | null
}

export interface RunAgentJobArgs<T> {
  /** The long-running request (AI generation, bulk creation, …). */
  request: (signal: AbortSignal) => Promise<
    { ok: true; value: T } | { ok: false; errorMessage?: string | null }
  >
  /** Called once with the value when the job commits. */
  onCommitted?: (value: T) => void
  /** Called with the error message when the job fails. */
  onFailed?: (message: string | null) => void
}

/**
 * Long async "agent job" lifecycle for the team-driven generations:
 *   idle → optimistic (instant placeholder UI) → committed | failed
 *
 * Guarantees:
 * - double-submit guard: `run` is a no-op while a job is in flight
 * - the terminal event commits or resets the UI — never stuck in optimistic
 * - in-flight jobs abort on unmount
 */
export function useAgentJob<T = unknown>() {
  const [state, setState] = useState<AgentJobState>({ phase: 'idle', errorMessage: null })
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const run = useCallback(async ({ request, onCommitted, onFailed }: RunAgentJobArgs<T>) => {
    if (abortRef.current) return // already running
    const controller = new AbortController()
    abortRef.current = controller
    setState({ phase: 'optimistic', errorMessage: null })

    try {
      const response = await request(controller.signal)
      if (!mountedRef.current) return
      if (response.ok === false) {
        const message = response.errorMessage ?? null
        setState({ phase: 'failed', errorMessage: message })
        onFailed?.(message)
      } else {
        setState({ phase: 'committed', errorMessage: null })
        onCommitted?.(response.value)
      }
    } catch (error) {
      if (!mountedRef.current) return
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      if (aborted) {
        setState({ phase: 'idle', errorMessage: null })
      } else {
        setState({ phase: 'failed', errorMessage: null })
        onFailed?.(null)
      }
    } finally {
      abortRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState({ phase: 'idle', errorMessage: null })
  }, [])

  return {
    ...state,
    isRunning: state.phase === 'optimistic',
    run,
    reset,
  }
}
