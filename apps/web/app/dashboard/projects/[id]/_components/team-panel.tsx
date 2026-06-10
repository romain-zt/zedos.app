'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import {
  AgentActivityListResponseSchema,
  TeamPlanDTOSchema,
  type AgentActivityDTO,
  type AgentRole,
  type TeamPlanDTO,
} from '@repo/contracts/team'
import { AGENT_ROSTER } from '@domain/team/agent-roster'
import { Loader2, Sparkles, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { z } from 'zod'

const TeamPlanResponseSchema = z.object({ teamPlan: TeamPlanDTOSchema.nullable() })

function AgentAvatar({ role, size = 'md' }: { role: AgentRole; size?: 'sm' | 'md' }) {
  const profile = AGENT_ROSTER[role]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full text-primary-foreground',
        profile.colorClass,
        size === 'sm' ? 'h-6 w-6 text-xs' : 'h-9 w-9 text-base'
      )}
      title={profile.name}
      aria-hidden
    >
      {profile.emoji}
    </span>
  )
}

function timeAgo(date: Date, locale: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (seconds < 60) return rtf.format(-seconds, 'second')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.floor(hours / 24), 'day')
}

export function TeamPanel({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n()
  const [activities, setActivities] = useState<AgentActivityDTO[]>([])
  const [teamPlan, setTeamPlan] = useState<TeamPlanDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/activities`)
      if (!res.ok) return
      const parsed = AgentActivityListResponseSchema.safeParse(await res.json())
      if (parsed.success) setActivities(parsed.data.activities)
    } catch {
      // polling failure is non-fatal
    }
  }, [projectId])

  const fetchTeamPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/team-plan`)
      if (!res.ok) return
      const parsed = TeamPlanResponseSchema.safeParse(await res.json())
      if (parsed.success) setTeamPlan(parsed.data.teamPlan)
    } catch {
      // non-fatal
    }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await Promise.all([fetchActivities(), fetchTeamPlan()])
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [fetchActivities, fetchTeamPlan])

  // Poll faster while a job is running, slower otherwise.
  const hasRunning = activities.some((a) => a.status === 'running') || generatingPlan
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => void fetchActivities(), hasRunning ? 4000 : 20000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchActivities, hasRunning])

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/team-plan`, { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(body?.error ?? t('team.planFailed'))
        return
      }
      const parsed = TeamPlanResponseSchema.safeParse(await res.json())
      if (parsed.success && parsed.data.teamPlan) {
        setTeamPlan(parsed.data.teamPlan)
        toast.success(t('team.planReady'))
      }
      void fetchActivities()
    } catch {
      toast.error(t('team.planFailed'))
    } finally {
      setGeneratingPlan(false)
    }
  }

  const roster = useMemo(() => Object.values(AGENT_ROSTER), [])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Roster */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">{t('team.rosterTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('team.rosterSubtitle')}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roster.map((agent) => (
            <div key={agent.role} className="flex items-center gap-3 rounded-lg border p-3">
              <AgentAvatar role={agent.role} />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{agent.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t(`team.role.${agent.role}`)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            {t('team.activityTitle')}
            {hasRunning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('team.activitySubtitle')}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-muted" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t('team.activityEmpty')}
            </p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3">
                  <AgentAvatar role={activity.agentRole} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{activity.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(new Date(activity.createdAt), locale)}
                    </p>
                  </div>
                  {activity.status === 'running' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary mt-0.5" />
                  ) : activity.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Scout's team plan */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AgentAvatar role="talent_scout" size="sm" />
              {t('team.planTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t('team.planSubtitle')}</p>
          </div>
          <Button
            size="sm"
            variant={teamPlan ? 'outline' : 'default'}
            onClick={() => void handleGeneratePlan()}
            disabled={generatingPlan}
            className="shrink-0"
          >
            {generatingPlan ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : teamPlan ? (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            {generatingPlan
              ? t('team.planGenerating')
              : teamPlan
                ? t('team.planRegenerate')
                : t('team.planGenerate')}
          </Button>
        </CardHeader>
        <CardContent>
          {generatingPlan && !teamPlan ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('team.planOptimistic')}
            </div>
          ) : !teamPlan ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('team.planEmpty')}</p>
          ) : (
            <div className={cn('space-y-4', generatingPlan && 'opacity-60')}>
              <p className="text-sm">{teamPlan.plan.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teamPlan.plan.roles.map((role, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {role.agentRole && <AgentAvatar role={role.agentRole} size="sm" />}
                      <p className="text-sm font-medium">{role.role}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{role.mission}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {role.skills.map((skill, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px] font-normal">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {(teamPlan.plan.recommendedAgents.length > 0 ||
                teamPlan.plan.recommendedRules.length > 0) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {teamPlan.plan.recommendedAgents.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        {t('team.planAgents')}
                      </p>
                      <ul className="space-y-1.5">
                        {teamPlan.plan.recommendedAgents.map((agent, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{agent.name}</span>
                            <span className="text-muted-foreground"> — {agent.purpose}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {teamPlan.plan.recommendedRules.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        {t('team.planRules')}
                      </p>
                      <ul className="space-y-1.5">
                        {teamPlan.plan.recommendedRules.map((rule, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{rule.name}</span>
                            <span className="text-muted-foreground"> — {rule.rationale}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
