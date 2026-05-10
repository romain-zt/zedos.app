'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, ArrowRight, HelpCircle, FileText } from 'lucide-react'
import { Stagger, StaggerItem } from '@/components/ui/animate'

interface QuestionHistoryPanelProps {
  projectId: string
}

export function QuestionHistoryPanel({ projectId }: QuestionHistoryPanelProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/questions`)
        if (res?.ok) {
          const data = await res.json()
          setQuestions(data ?? [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i: number) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if ((questions?.length ?? 0) === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-semibold mb-1">No decisions yet</h3>
          <p className="text-sm text-muted-foreground">
            Decisions made during clarification will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions?.length ?? 0} decision{(questions?.length ?? 0) !== 1 ? 's' : ''} recorded
        </p>
      </div>

      <Stagger staggerDelay={0.03}>
        <div className="space-y-3">
          {(questions ?? []).map((q: any, i: number) => (
            <StaggerItem key={q?.id ?? i}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {/* Question */}
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q?.structuredQuestion ?? 'Question'}</p>
                      {q?.questionType && (
                        <Badge variant="secondary" className="mt-1 text-xs">{q.questionType}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                  </div>

                  {/* Answer */}
                  {q?.founderAnswer && (
                    <div className="flex items-start gap-2 pl-6">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{q.founderAnswer}</p>
                    </div>
                  )}

                  {/* AI Interpretation */}
                  {q?.aiInterpretation && (
                    <div className="bg-muted/50 rounded-lg p-2.5 ml-6">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">AI interpretation:</span> {q.aiInterpretation}
                      </p>
                    </div>
                  )}

                  {/* PRD Impact */}
                  {q?.prdImpact && (
                    <div className="flex items-center gap-1.5 pl-6">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Affects: {q.prdImpact}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </Stagger>
    </div>
  )
}
