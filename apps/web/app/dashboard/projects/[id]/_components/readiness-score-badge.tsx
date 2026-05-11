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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/readiness-score`)
        if (res.ok) {
          const raw = await res.json()
                const parsed = QuestionCoverageReadinessScoreResponseSchema.safeParse(raw)
          if (parsed.success) {
            setScore(parsed.data.score)
            setSectionsCovered(parsed.data.coveredSections.length)
          }
        }
      } catch {
        /* keep defaults */
      }
      setLoading(false)
    }
    fetchScore()
  }, [projectId])

  if (loading) return <Badge variant="outline">Loading...</Badge>
  return (
    <Badge className="gap-1.5">
      <span>{score}% ready</span>
      <span className="opacity-80 font-normal">·</span>
      <span className="font-normal">{sectionsCovered}/8 sections</span>
    </Badge>
  )
}
