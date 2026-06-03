'use client'

import { useEffect, useState } from 'react'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'

export function useWorkspaceJourneyMode(projectId: string | null): JourneyMode | null {
  const [journeyMode, setJourneyMode] = useState<JourneyMode | null>(null)

  useEffect(() => {
    if (!projectId) {
      setJourneyMode(null)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) return
        const data = (await res.json()) as { journeyMode?: string }
        if (cancelled) return
        if (data.journeyMode === 'express' || data.journeyMode === 'standard') {
          setJourneyMode(data.journeyMode)
        }
      } catch {
        // Keep null — nav stays enabled until mode is known
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  return journeyMode
}
