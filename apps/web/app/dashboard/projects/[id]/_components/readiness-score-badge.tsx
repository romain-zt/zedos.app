'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { QuestionCoverageReadinessScoreResponseSchema } from '@repo/contracts/questions/history'

interface ReadinessScoreBadgeProps {
  projectId: string
}

export function ReadinessScoreBadge({ projectId }: ReadinessScoreBadgeProps) {
  const [score, setScore] = useState<number>(0)
  const [sectionsCovered, setSectionsCovered] = useState<number>(0)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/readiness-score`)
        if (!res.ok) {
          setPhase('error')
          return
        }
        const raw = await res.json()
        const parsed = QuestionCoverageReadinessScoreResponseSchema.safeParse(raw)
        if (!parsed.success) {
          setPhase('error')
          return
        }
        setScore(parsed.data.score)
        setSectionsCovered(parsed.data.coveredSections.length)
        setPhase('ready')
      } catch {
        setPhase('error')
      }
    }
    void fetchScore()
  }, [projectId])

  if (phase === 'loading') return <Badge variant="outline">…</Badge>
  if (phase === 'error') return <Badge variant="outline">—</Badge>
  return (
    <Badge className="gap-1.5">
      <span>{score}% ready</span>
      <span className="opacity-80 font-normal">·</span>
      <span className="font-normal">{sectionsCovered}/8 sections</span>
    </Badge>
  )
}
