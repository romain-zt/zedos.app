'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GitBranch, RefreshCw, Filter } from 'lucide-react'
import { Stagger, StaggerItem } from '@/components/ui/animate'
import {
  DecisionListResponseSchema,
  BackfillDecisionsResponseSchema,
  type DecisionDTO,
} from '@repo/contracts/decisions/decision'
import { PRD_SECTIONS } from '@repo/contracts/questions/history'
import type { PrdVersionDTO } from '@repo/contracts/prd/prd-contracts'
import { useI18n } from '@/src/i18n'
import { toast } from 'sonner'

interface DecisionsPanelProps {
  projectId: string
  prdVersions: PrdVersionDTO[]
  isTabActive: boolean
  initialSectionFilter?: string | null
  onSectionFilterApplied?: () => void
}

function formatWhen(createdAt: Date) {
  try {
    return createdAt.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

function PrdVersionLabel({
  prdVersionId,
  versions,
  t,
}: {
  prdVersionId: string | null
  versions: PrdVersionDTO[]
  t: (key: string) => string
}) {
  if (!prdVersionId) {
    return <span className="text-xs text-muted-foreground">{t('decisions.prdNotLinked')}</span>
  }
  const match = versions.find((v) => v.id === prdVersionId)
  if (match) {
    return (
      <span className="text-xs text-muted-foreground">
        {t('decisions.prdVersion')}{' '}
        <span className="font-mono font-medium text-foreground">v{match.versionNumber}</span>
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground font-mono" title={prdVersionId}>
      {t('decisions.prdVersionPending')}
    </span>
  )
}

export function DecisionsPanel({
  projectId,
  prdVersions,
  isTabActive,
  initialSectionFilter,
  onSectionFilterApplied,
}: DecisionsPanelProps) {
  const { t } = useI18n()
  const [decisions, setDecisions] = useState<DecisionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [sectionFilter, setSectionFilter] = useState<string>('all')

  useEffect(() => {
    if (initialSectionFilter && (PRD_SECTIONS as readonly string[]).includes(initialSectionFilter)) {
      setSectionFilter(initialSectionFilter)
      onSectionFilterApplied?.()
    }
  }, [initialSectionFilter, onSectionFilterApplied])

  const fetchDecisions = useCallback(async () => {
    setLoading(true)
    try {
      const query =
        sectionFilter !== 'all'
          ? `?section=${encodeURIComponent(sectionFilter)}`
          : ''
      const res = await fetch(`/api/projects/${projectId}/decisions${query}`)
      if (!res.ok) {
        if (res.status !== 401) toast.error(t('decisions.loadFailed'))
        return
      }
      const raw = await res.json()
      const parsed = DecisionListResponseSchema.safeParse(raw)
      if (!parsed.success) {
        toast.error(t('decisions.loadFailed'))
        return
      }
      setDecisions(parsed.data)
    } catch {
      toast.error(t('decisions.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [projectId, sectionFilter, t])

  useEffect(() => {
    if (isTabActive) {
      void fetchDecisions()
    }
  }, [isTabActive, fetchDecisions])

  const handleBackfill = async () => {
    setBackfilling(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/decision-graph/backfill`, {
        method: 'POST',
      })
      if (!res.ok) {
        toast.error(t('decisions.backfillFailed'))
        return
      }
      const raw = await res.json()
      const parsed = BackfillDecisionsResponseSchema.safeParse(raw)
      if (!parsed.success) {
        toast.error(t('decisions.backfillFailed'))
        return
      }
      const { inserted, skipped } = parsed.data
      toast.success(
        t('decisions.backfillSuccess')
          .replace('{inserted}', String(inserted))
          .replace('{skipped}', String(skipped)),
      )
      await fetchDecisions()
    } catch {
      toast.error(t('decisions.backfillFailed'))
    } finally {
      setBackfilling(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('decisions.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('decisions.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2 shrink-0" />
              <SelectValue placeholder={t('decisions.filterSection')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('decisions.allSections')}</SelectItem>
              {PRD_SECTIONS.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchDecisions()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {t('decisions.refresh')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleBackfill()} loading={backfilling}>
            {t('decisions.syncFromHistory')}
          </Button>
        </div>
      </div>

      {decisions.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t('decisions.empty')}
          </CardContent>
        </Card>
      ) : (
        <Stagger staggerDelay={0.04}>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <StaggerItem key={decision.id}>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug flex-1 min-w-0">
                        {decision.structuredQuestion}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatWhen(decision.createdAt)}
                      </span>
                    </div>

                    {decision.chosenOption ? (
                      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                          {t('decisions.chosen')}
                        </span>
                        {decision.chosenOption}
                      </div>
                    ) : null}

                    {decision.rejectedOptions.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{t('decisions.rejected')}: </span>
                        {decision.rejectedOptions.join(' · ')}
                      </div>
                    ) : null}

                    {decision.ownerComment ? (
                      <p className="text-xs text-muted-foreground italic">{decision.ownerComment}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      {decision.sectionIds.map((sectionId) => (
                        <Badge key={sectionId} variant="secondary" className="text-xs">
                          {sectionId}
                        </Badge>
                      ))}
                      <PrdVersionLabel
                        prdVersionId={decision.prdVersionId}
                        versions={prdVersions}
                        t={t}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      )}
    </div>
  )
}
