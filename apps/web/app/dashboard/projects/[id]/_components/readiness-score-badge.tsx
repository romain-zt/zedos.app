'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { PRD_SECTIONS, QuestionReadinessScoreResponseSchema } from '@repo/contracts/questions'

const TOTAL_SECTIONS = PRD_SECTIONS.length

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
          const parsed = QuestionReadinessScoreResponseSchema.safeParse(raw)
          if (parsed.success) {
            const { score: nextScore, coveredSections } = parsed.data
            setScore(nextScore)
            setSectionsCovered(coveredSections.length)
          }
        }
      } catch {
        // Leave defaults
      }
      setLoading(false)
    }
    fetchScore()
  }, [projectId])

  if (loading) return <Badge variant="outline">Loading...</Badge>
  return (
    <Badge className="gap-1 tabular-nums">
      <span>{score}% ready</span>
      <span className="opacity-80">·</span>
      <span className="font-normal">{sectionsCovered}/{TOTAL_SECTIONS} sections</span>
    </Badge>
  )
}
