'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface ReadinessScoreBadgeProps {
  projectId: string
}

export function ReadinessScoreBadge({ projectId }: ReadinessScoreBadgeProps) {
  const [score, setScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/readiness-score`)
        if (res.ok) {
          const data = await res.json()
          setScore(Math.round((data.total.points / data.total.weight) * 100))
        }
      } catch {}
      setLoading(false)
    }
    fetchScore()
  }, [projectId])

  if (loading) return <Badge variant="outline">Loading...</Badge>
  return <Badge>{score}% ready</Badge>
}
