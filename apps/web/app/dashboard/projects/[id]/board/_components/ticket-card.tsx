'use client'

import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import type { TicketDTO, TicketPriority } from '@repo/contracts/tickets'
import { AGENT_ROSTER } from '@domain/team/agent-roster'
import { CalendarDays } from 'lucide-react'

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  urgent: 'bg-destructive/10 text-destructive',
}

export function TicketCard({
  ticket,
  onClick,
  onDragStart,
}: {
  ticket: TicketDTO
  onClick: () => void
  onDragStart: (event: React.DragEvent) => void
}) {
  const { t } = useI18n()
  const assignee = ticket.assigneeRole ? AGENT_ROSTER[ticket.assigneeRole] : null

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-grab active:cursor-grabbing touch-manipulation"
      data-testid={`ticket-card-${ticket.key}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{ticket.key}</span>
        <span
          className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            PRIORITY_STYLES[ticket.priority]
          )}
        >
          {t(`board.priority.${ticket.priority}`)}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium leading-snug line-clamp-2">{ticket.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {assignee && (
          <span
            className={cn(
              'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-primary-foreground',
              assignee.colorClass
            )}
            title={assignee.name}
          >
            {assignee.emoji}
          </span>
        )}
        {ticket.estimate !== null && (
          <span className="rounded bg-muted px-1.5 py-0.5 tabular-nums">{ticket.estimate} pt</span>
        )}
        {ticket.dueDate && (
          <span className="ml-auto inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {ticket.dueDate.slice(5)}
          </span>
        )}
      </div>
    </button>
  )
}
