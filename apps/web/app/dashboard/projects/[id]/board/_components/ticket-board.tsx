'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import {
  TICKET_STATUSES,
  TicketListResponseSchema,
  GenerateTicketsResponseSchema,
  type TicketDTO,
  type TicketStatus,
  type UpdateTicketRequest,
} from '@repo/contracts/tickets'
import { z } from 'zod'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { TicketCard } from './ticket-card'
import { TicketDetailDialog } from './ticket-detail-dialog'
import { FadeIn } from '@/components/ui/animate'
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation'
import { useAgentJob } from '@/hooks/use-agent-job'
import { JourneyStepper } from '../../_components/journey-stepper'

const TicketResponseSchema = z.object({ ticket: z.unknown() })

const STATUS_ACCENTS: Record<TicketStatus, string> = {
  backlog: 'bg-muted-foreground/50',
  todo: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  in_review: 'bg-violet-500',
  done: 'bg-emerald-500',
}

export function TicketBoard({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const { t } = useI18n()
  const [tickets, setTickets] = useState<TicketDTO[]>([])
  const ticketsRef = useRef<TicketDTO[]>([])
  ticketsRef.current = tickets
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TicketDTO | null>(null)
  const [creating, setCreating] = useState(false)
  const [dragOverStatus, setDragOverStatus] = useState<TicketStatus | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tickets`)
      if (!res.ok) {
        toast.error(t('board.loadFailed'))
        return
      }
      const parsed = TicketListResponseSchema.safeParse(await res.json())
      if (parsed.success) setTickets(parsed.data.tickets)
    } catch {
      toast.error(t('board.loadFailed'))
    }
  }, [projectId, t])

  useEffect(() => {
    let cancelled = false
    void fetchTickets().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [fetchTickets])

  /** Shared optimistic mutation: instant apply, rollback + toast on failure, refetch on commit. */
  const errorMessageRef = useRef(t('board.updateFailed'))
  const { mutate } = useOptimisticMutation<TicketDTO[]>({
    getState: () => ticketsRef.current,
    setState: setTickets,
    onError: () => toast.error(errorMessageRef.current),
    onCommitted: () => void fetchTickets(),
  })

  const patchTicket = useCallback(
    async (ticketId: string, patch: UpdateTicketRequest) => {
      errorMessageRef.current = t('board.updateFailed')
      setSelected((prev) =>
        prev && prev.id === ticketId ? ({ ...prev, ...patch } as TicketDTO) : prev
      )
      return mutate({
        optimistic: (current) =>
          current.map((ticket) =>
            ticket.id === ticketId ? ({ ...ticket, ...patch } as TicketDTO) : ticket
          ),
        request: async () => {
          const res = await fetch(`/api/projects/${projectId}/tickets/${ticketId}`, {
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

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      errorMessageRef.current = t('board.deleteFailed')
      setSelected(null)
      await mutate({
        optimistic: (current) => current.filter((ticket) => ticket.id !== ticketId),
        request: async () => {
          const res = await fetch(`/api/projects/${projectId}/tickets/${ticketId}`, {
            method: 'DELETE',
          })
          return { ok: res.ok }
        },
      })
    },
    [projectId, mutate, t]
  )

  const createTicket = useCallback(
    async (input: { title: string }) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) {
          toast.error(t('board.createFailed'))
          return
        }
        const parsed = TicketResponseSchema.safeParse(await res.json())
        if (parsed.success) {
          await fetchTickets()
          toast.success(t('board.created'))
        }
      } catch {
        toast.error(t('board.createFailed'))
      }
    },
    [projectId, fetchTickets, t]
  )

  /** Milo's ticket generation as an agent job: optimistic skeletons → commit or reset. */
  const generateJob = useAgentJob<{ created: number; skipped: number }>()
  const generating = generateJob.isRunning

  const generateTickets = useCallback(() => {
    void generateJob.run({
      request: async (signal) => {
        const res = await fetch(`/api/projects/${projectId}/tickets/generate`, {
          method: 'POST',
          signal,
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          return { ok: false, errorMessage: (body as { error?: string } | null)?.error ?? null }
        }
        const parsed = GenerateTicketsResponseSchema.safeParse(body)
        if (!parsed.success) return { ok: false }
        return { ok: true, value: { created: parsed.data.created, skipped: parsed.data.skipped } }
      },
      onCommitted: (value) => {
        void fetchTickets()
        toast.success(
          t('board.generated')
            .replace('{created}', String(value.created))
            .replace('{skipped}', String(value.skipped))
        )
      },
      onFailed: (message) => toast.error(message ?? t('board.generateFailed')),
    })
  }, [projectId, generateJob, fetchTickets, t])

  const columns = useMemo(
    () =>
      TICKET_STATUSES.map((status) => ({
        status,
        tickets: tickets.filter((ticket) => ticket.status === status),
      })),
    [tickets]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent, status: TicketStatus) => {
      event.preventDefault()
      setDragOverStatus(null)
      const ticketId = event.dataTransfer.getData('text/ticket-id')
      if (!ticketId) return
      const ticket = tickets.find((item) => item.id === ticketId)
      if (!ticket || ticket.status === status) return
      void patchTicket(ticketId, { status })
    },
    [tickets, patchTicket]
  )

  return (
    <div className="space-y-4">
      <JourneyStepper projectId={projectId} />
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{t('board.title')}</h1>
            <p className="text-sm text-muted-foreground">{projectName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateTickets()}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              {generating ? t('board.generating') : t('board.generateCta')}
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('board.newTicket')}
            </Button>
          </div>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex gap-3 overflow-hidden animate-pulse">
          {TICKET_STATUSES.map((status) => (
            <div key={status} className="w-72 shrink-0 space-y-2">
              <div className="h-6 rounded bg-muted" />
              <div className="h-24 rounded-xl border bg-card" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 && !generating ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <p className="font-medium">{t('board.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('board.emptyBody')}</p>
          <Button onClick={() => generateTickets()} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            {t('board.generateCta')}
          </Button>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none -mx-4 px-4 sm:mx-0 sm:px-0"
          data-testid="ticket-board"
        >
          {generating && tickets.length === 0
            ? null
            : columns.map(({ status, tickets: columnTickets }) => (
                <div
                  key={status}
                  className={cn(
                    'w-[82vw] max-w-[20rem] sm:w-72 shrink-0 snap-center rounded-xl bg-muted/30 border p-2 transition-colors',
                    dragOverStatus === status && 'border-primary bg-primary/5'
                  )}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOverStatus(status)
                  }}
                  onDragLeave={() => setDragOverStatus(null)}
                  onDrop={(event) => handleDrop(event, status)}
                  data-testid={`board-column-${status}`}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_ACCENTS[status])} />
                    <p className="text-sm font-medium">{t(`board.status.${status}`)}</p>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {columnTickets.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[6rem] p-1">
                    {generating && (
                      <div className="rounded-lg border border-dashed bg-card/50 p-3 animate-pulse">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                      </div>
                    )}
                    {columnTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setSelected(ticket)}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/ticket-id', ticket.id)
                          event.dataTransfer.effectAllowed = 'move'
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
        </div>
      )}

      <TicketDetailDialog
        ticket={selected}
        isCreate={creating}
        onClose={() => {
          setSelected(null)
          setCreating(false)
        }}
        onPatch={patchTicket}
        onCreate={createTicket}
        onDelete={deleteTicket}
      />
    </div>
  )
}
