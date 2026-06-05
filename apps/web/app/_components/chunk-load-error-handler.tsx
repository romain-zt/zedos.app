'use client'

// IMPORTANT: Do not remove this component.
// It handles a known Next.js dev server race condition where dynamic chunks
// imported by next/dynamic haven't been compiled yet and cause webpack to throw
// a ChunkLoadError

import { useEffect } from 'react'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import {
  captureClient,
  captureClientException,
} from '@infrastructure/analytics/posthog-client'

function isChunkLoadError(error: Error): boolean {
  if (error.name === 'ChunkLoadError') return true
  return typeof error.message === 'string' && error.message.includes('Loading chunk')
}

function currentPathname(): string | null {
  if (typeof window === 'undefined') return null
  const path = window.location?.pathname
  return typeof path === 'string' ? path : null
}

export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const candidate: Error | null = event.error instanceof Error ? event.error : null
      if (!candidate || !isChunkLoadError(candidate)) return
      event.preventDefault()
      const route = currentPathname()
      captureClient(AnalyticsEvents.CHUNK_LOAD_ERROR, {
        component: 'ChunkLoadErrorHandler',
        route,
      })
      captureClientException(candidate, {
        component: 'ChunkLoadErrorHandler',
        error_code: 'chunk_load_error',
        route,
      })
      window.location.reload()
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  return null
}
