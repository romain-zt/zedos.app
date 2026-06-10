'use client'

import { useCallback, useRef, useState } from 'react'

export interface OptimisticMutationOptions<S> {
  /** Read the current state (snapshot source). */
  getState: () => S
  /** Write state (used for both optimistic apply and rollback). */
  setState: (next: S) => void
  /** Called with the error message after a rollback. */
  onError?: (message: string | null) => void
  /** Called after the server confirmed the mutation. */
  onCommitted?: () => void
}

export interface MutateArgs<S> {
  /** Pure state transition applied instantly. */
  optimistic: (current: S) => S
  /** The server request; resolve `ok: false` (or throw) to roll back. */
  request: () => Promise<{ ok: boolean; errorMessage?: string | null }>
}

/**
 * Generic optimistic mutation helper:
 *   1. snapshot state → apply optimistic transition immediately
 *   2. run the request
 *   3. commit on success (server truth wins via onCommitted refetch)
 *      or roll back to the snapshot + surface the error
 *
 * Concurrent mutations are supported — rollback restores the snapshot taken
 * at *this* mutation's start, so callers should keep mutations coarse enough
 * (board moves, field saves) that overlapping rollbacks stay coherent.
 */
export function useOptimisticMutation<S>(options: OptimisticMutationOptions<S>) {
  const [pendingCount, setPendingCount] = useState(0)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const mutate = useCallback(async ({ optimistic, request }: MutateArgs<S>): Promise<boolean> => {
    const { getState, setState, onError, onCommitted } = optionsRef.current
    const snapshot = getState()
    setState(optimistic(snapshot))
    setPendingCount((count) => count + 1)
    try {
      const response = await request()
      if (!response.ok) {
        setState(snapshot)
        onError?.(response.errorMessage ?? null)
        return false
      }
      onCommitted?.()
      return true
    } catch {
      setState(snapshot)
      onError?.(null)
      return false
    } finally {
      setPendingCount((count) => count - 1)
    }
  }, [])

  return { mutate, isPending: pendingCount > 0 }
}
