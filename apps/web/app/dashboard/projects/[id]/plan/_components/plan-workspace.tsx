'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import { localePath } from '@/lib/locale-path'
import {
  MilestoneListResponseSchema,
  GeneratePlanResponseSchema,
  type MilestoneDTO,
  type UpdateMilestoneRequest,
} from '@repo/contracts/planning'
import { TicketListResponseSchema, type TicketDTO } from '@repo/contracts/tickets'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/ui/animate'
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation'
import { useAgentJob } from '@/hooks/use-agent-job'
import { useRef } from 'react'

const MILESTONE_BORDERS: Record<string, string> = {
  violet: 'border-l-violet-500',
  sky: 'border-l-sky-500',
  amber: 'border-l-amber-500',
  emerald: 'border-l-emerald-500',
  pink: 'border-l-pink-500',
  orange: 'border-l-orange-500',
}

export function PlanWorkspace({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([])
  const milestonesRef = useRef<MilestoneDTO[]>([])
  milestonesRef.current = milestones
  const [tickets, setTickets] = useState<TicketDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const fetchAll = useCallback(async () => {
    try {
      const [milestonesRes, ticketsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/milestones`),
        fetch(`/api/projects/${projectId}/tickets`),
      ])
      if (milestonesRes.ok) {
        const parsed = MilestoneListResponseSchema.safeParse(await milestonesRes.json())
        if (parsed.success) setMilestones(parsed.data.milestones)
      }
      if (ticketsRes.ok) {
        const parsed = TicketListResponseSchema.safeParse(await ticketsRes.json())
        if (parsed.success) setTickets(parsed.data.tickets)
      }
    } catch {
      toast.error(t('plan.loadFailed'))
    }
  }, [projectId, t])

  useEffect(() => {
    let cancelled = false
    void fetchAll().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [fetchAll])

  /** Milo's planning as an agent job: optimistic placeholder → commit or reset. */
  const planJob = useAgentJob<z.infer<typeof GeneratePlanResponseSchema>>()
  const planning = planJob.isRunning

  const generatePlan = useCallback(() => {
    void planJob.run({
      request: async (signal) => {
        const res = await fetch(`/api/projects/${projectId}/plan/generate`, {
          method: 'POST',
          signal,
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          return { ok: false, errorMessage: (body as { error?: string } | null)?.error ?? null }
        }
        const parsed = GeneratePlanResponseSchema.safeParse(body)
        if (!parsed.success) return { ok: false }
        return { ok: true, value: parsed.data }
      },
      onCommitted: (value) => {
        const parsed = GeneratePlanResponseSchema.safeParse(value)
        if (parsed.success) {
          setMilestones((prev) => [...prev, ...parsed.data.milestones])
          setTickets(parsed.data.tickets)
          const firstStart = parsed.data.milestones[0]?.startsOn
          if (firstStart) setMonth(startOfMonth(parseISO(firstStart)))
        }
        toast.success(t('plan.generated'))
        void fetchAll()
      },
      onFailed: (message) => toast.error(message ?? t('plan.generateFailed')),
    })
  }, [projectId, planJob, fetchAll, t])

  /** Shared optimistic mutation for milestone edits/deletes. */
  const errorMessageRef = useRef(t('plan.updateFailed'))
  const { mutate } = useOptimisticMutation<MilestoneDTO[]>({
    getState: () => milestonesRef.current,
    setState: setMilestones,
    onError: () => toast.error(errorMessageRef.current),
  })

  const patchMilestone = useCallback(
    async (milestoneId: string, patch: UpdateMilestoneRequest) => {
      errorMessageRef.current = t('plan.updateFailed')
      await mutate({
        optimistic: (current) =>
          current.map((m) => (m.id === milestoneId ? ({ ...m, ...patch } as MilestoneDTO) : m)),
        request: async () => {
          const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })
          return { ok: res.ok }
        },
      })
    },
    [projectId, mutate, t]
  )

  const deleteMilestone = useCallback(
    async (milestoneId: string) => {
      errorMessageRef.current = t('plan.deleteFailed')
      const ok = await mutate({
        optimistic: (current) => current.filter((m) => m.id !== milestoneId),
        request: async () => {
          const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
            method: 'DELETE',
          })
          return { ok: res.ok }
        },
      })
      if (ok) void fetchAll()
    },
    [projectId, mutate, fetchAll, t]
  )

  const ticketsByMilestone = useMemo(() => {
    const map = new Map<string, TicketDTO[]>()
    for (const ticket of tickets) {
      if (!ticket.milestoneId) continue
      const list = map.get(ticket.milestoneId) ?? []
      list.push(ticket)
      map.set(ticket.milestoneId, list)
    }
    return map
  }, [tickets])

  const ticketsByDueDate = useMemo(() => {
    const map = new Map<string, TicketDTO[]>()
    for (const ticket of tickets) {
      if (!ticket.dueDate) continue
      const list = map.get(ticket.dueDate) ?? []
      list.push(ticket)
      map.set(ticket.dueDate, list)
    }
    return map
  }, [tickets])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    const days: Date[] = []
    let cursor = start
    while (cursor <= end) {
      days.push(cursor)
      cursor = addDays(cursor, 1)
    }
    return days
  }, [month])

  const goToBoard = () => router.push(localePath(`/dashboard/projects/${projectId}/board`, locale))

  return (
    <div className="space-y-4">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{t('plan.title')}</h1>
            <p className="text-sm text-muted-foreground">{projectName}</p>
          </div>
          <Button size="sm" onClick={() => generatePlan()} disabled={planning}>
            {planning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            {planning ? t('plan.generating') : t('plan.generateCta')}
          </Button>
        </div>
      </FadeIn>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[20rem,1fr] animate-pulse">
          <div className="space-y-3">
            <div className="h-24 rounded-xl border bg-card" />
            <div className="h-24 rounded-xl border bg-card" />
          </div>
          <div className="h-96 rounded-xl border bg-card hidden lg:block" />
        </div>
      ) : milestones.length === 0 && !planning ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">{t('plan.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('plan.emptyBody')}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={goToBoard}>
              {t('plan.goToBoard')}
            </Button>
            <Button onClick={() => generatePlan()} disabled={planning}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {t('plan.generateCta')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem,1fr] items-start">
          {/* Milestone timeline / agenda */}
          <div className="space-y-3">
            {planning && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground animate-pulse">
                {t('plan.optimistic')}
              </div>
            )}
            {milestones.map((milestone) => {
              const milestoneTickets = ticketsByMilestone.get(milestone.id) ?? []
              const doneCount = milestoneTickets.filter((ticket) => ticket.status === 'done').length
              return (
                <div
                  key={milestone.id}
                  className={cn(
                    'rounded-xl border border-l-4 bg-card p-3 space-y-2',
                    MILESTONE_BORDERS[milestone.color ?? ''] ?? 'border-l-primary'
                  )}
                  data-testid={`milestone-${milestone.title}`}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      defaultValue={milestone.title}
                      className="h-8 border-transparent px-1 font-medium focus-visible:border-input"
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const next = e.target.value.trim()
                        if (next && next !== milestone.title) {
                          void patchMilestone(milestone.id, { title: next })
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      onClick={() => void deleteMilestone(milestone.id)}
                      title={t('plan.deleteMilestone')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Input
                      type="date"
                      defaultValue={milestone.startsOn ?? ''}
                      className="h-8 text-xs"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        void patchMilestone(milestone.id, {
                          startsOn: e.target.value === '' ? null : e.target.value,
                        })
                      }
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="date"
                      defaultValue={milestone.dueOn ?? ''}
                      className="h-8 text-xs"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        void patchMilestone(milestone.id, {
                          dueOn: e.target.value === '' ? null : e.target.value,
                        })
                      }
                    />
                  </div>
                  {milestoneTickets.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t('plan.ticketProgress')
                          .replace('{done}', String(doneCount))
                          .replace('{total}', String(milestoneTickets.length))}
                      </p>
                      <ul className="space-y-1">
                        {milestoneTickets.map((ticket) => (
                          <li key={ticket.id}>
                            <button
                              type="button"
                              onClick={goToBoard}
                              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                            >
                              <span className="font-mono text-muted-foreground shrink-0">
                                {ticket.key}
                              </span>
                              <span
                                className={cn(
                                  'truncate',
                                  ticket.status === 'done' && 'line-through text-muted-foreground'
                                )}
                              >
                                {ticket.title}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Month calendar (desktop) */}
          <div className="hidden lg:block rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-semibold">{format(month, 'MMMM yyyy')}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
                  {t('plan.today')}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const iso = format(day, 'yyyy-MM-dd')
                const dayTickets = ticketsByDueDate.get(iso) ?? []
                return (
                  <div
                    key={iso}
                    className={cn(
                      'bg-card min-h-[5.5rem] p-1.5 space-y-1',
                      !isSameMonth(day, month) && 'opacity-40'
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs tabular-nums',
                        isSameDay(day, new Date())
                          ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                    {dayTickets.slice(0, 3).map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={goToBoard}
                        className={cn(
                          'block w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-[10px] text-primary hover:bg-primary/20 transition-colors',
                          ticket.status === 'done' && 'line-through opacity-60'
                        )}
                        title={`${ticket.key} ${ticket.title}`}
                      >
                        {ticket.key} {ticket.title}
                      </button>
                    ))}
                    {dayTickets.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{dayTickets.length - 3}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
