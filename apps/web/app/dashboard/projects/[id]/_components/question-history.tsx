'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowRight, HelpCircle, FileText, ListOrdered, RefreshCw } from 'lucide-react'
import { Stagger, StaggerItem } from '@/components/ui/animate'
import {
  QuestionHistoryListResponseSchema,
  type QuestionHistoryRow,
} from '@repo/contracts/questions/history'
import type { PrdVersionDTO } from '@repo/contracts/prd/prd-contracts'

interface QuestionHistoryPanelProps {
  projectId: string
  prdVersions: PrdVersionDTO[]
  isTabActive: boolean
  onOpenRefinement?: (payload: { label: string; prdVersionId: string | null }) => void
}

function formatDecisionWhen(createdAt: Date) {
  try {
    return createdAt.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

function PrdVersionLabel({ prdVersionId, versions }: { prdVersionId: string | null; versions: PrdVersionDTO[] }) {
  if (!prdVersionId) {
    return <span className="text-xs text-muted-foreground">PRD: not linked to a version</span>
  }
  const match = versions.find((v) => v.id === prdVersionId)
  if (match) {
    return (
      <span className="text-xs text-muted-foreground">
        PRD version{' '}
        <span className="font-mono font-medium text-foreground">v{match.versionNumber}</span>
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground font-mono" title={prdVersionId}>
      PRD version (pending list)
    </span>
  )
}

function AvailableOptionsBlock({ row }: { row: QuestionHistoryRow }) {
  const ui = row.availableOptions
  if (!ui) {
    return (
      <div className="pl-6 text-xs text-muted-foreground italic">
        No structured options on file for this entry.
      </div>
    )
  }
  return (
    <div className="pl-6 space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <ListOrdered className="h-3.5 w-3.5" />
        Options presented
      </div>
      <p className="text-xs font-medium">{ui.title}</p>
      {ui.description ? <p className="text-xs text-muted-foreground">{ui.description}</p> : null}
      <ul className="space-y-1.5">
        {(ui.options ?? []).map((opt) => (
          <li key={opt.id} className="text-xs">
            <span className="font-medium">{opt.label}</span>
            {opt.description ? (
              <span className="text-muted-foreground"> — {opt.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        {ui.allow_custom ? 'Custom answers allowed' : 'Fixed options'}
        {' · '}
        {ui.allow_not_sure ? '"Not sure" allowed' : 'No "not sure"'}
      </p>
    </div>
  )
}

export function QuestionHistoryPanel({
  projectId,
  prdVersions,
  isTabActive,
  onOpenRefinement,
}: QuestionHistoryPanelProps) {
  const [rows, setRows] = useState<QuestionHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/questions`)
      if (res.status === 401) {
        setLoadError('You need to be signed in to view history.')
        setRows([])
        return
      }
      if (res.status === 404) {
        setLoadError('Project not found.')
        setRows([])
        return
      }
      if (!res.ok) {
        setLoadError('Could not load decision history.')
        setRows([])
        return
      }
      const raw: unknown = await res.json()
      const parsed = QuestionHistoryListResponseSchema.safeParse(raw)
      if (!parsed.success) {
        setLoadError('Received invalid data from the server. Try again or contact support.')
        setRows([])
        return
      }
      setRows(parsed.data)
    } catch {
      setLoadError('Network error. Check your connection and try again.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!isTabActive) return
    void load()
  }, [isTabActive, load])

  if (!isTabActive) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 min-h-[7rem] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-14 px-4 text-center">
          <p className="text-sm text-foreground">{loadError}</p>
          <Button type="button" variant="outline" className="min-h-11 min-w-[44px]" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" aria-hidden />
          <h3 className="font-display text-lg font-semibold mb-1">No decisions yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Structured decisions from clarification will appear here. Only you can see this log; it is not shown on
            shared links.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} decision{rows.length !== 1 ? 's' : ''} recorded
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 w-full sm:w-auto self-start"
          onClick={() => void load()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Stagger staggerDelay={0.03}>
        <div className="space-y-3">
          {rows.map((q, i) => (
            <StaggerItem key={q.id}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground break-words">{q.structuredQuestion}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {q.questionType ? (
                            <Badge variant="secondary" className="text-xs">
                              {q.questionType}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                      {onOpenRefinement ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11 text-xs"
                          onClick={() =>
                            onOpenRefinement({
                              label: q.structuredQuestion,
                              prdVersionId: q.prdVersionId,
                            })
                          }
                        >
                          Revise
                        </Button>
                      ) : null}
                      <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDecisionWhen(q.createdAt)}</span>
                    </div>
                  </div>

                  <PrdVersionLabel prdVersionId={q.prdVersionId} versions={prdVersions} />

                  <AvailableOptionsBlock row={q} />

                  {q.founderAnswer ? (
                    <div className="flex items-start gap-2 pl-6 sm:pl-8">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Your answer</p>
                        <p className="text-sm text-foreground break-words">{q.founderAnswer}</p>
                      </div>
                    </div>
                  ) : null}

                  {q.optionalComment ? (
                    <div className="pl-6 sm:pl-8">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Your comment</p>
                      <p className="text-sm text-foreground break-words">{q.optionalComment}</p>
                    </div>
                  ) : null}

                  {q.aiInterpretation ? (
                    <div className="bg-muted/50 rounded-lg p-2.5 ml-6 sm:ml-8">
                      <p className="text-xs text-muted-foreground break-words">
                        <span className="font-medium text-foreground/80">AI interpretation:</span> {q.aiInterpretation}
                      </p>
                    </div>
                  ) : null}

                  {q.prdImpact ? (
                    <div className="flex items-start gap-1.5 pl-6 sm:pl-8">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">PRD impact</p>
                        <p className="text-xs text-foreground break-words">{q.prdImpact}</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </Stagger>
    </div>
  )
}
