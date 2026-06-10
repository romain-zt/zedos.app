'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketDTO,
  type UpdateTicketRequest,
} from '@repo/contracts/tickets'
import { AGENT_ROSTER } from '@domain/team/agent-roster'
import type { AgentRole } from '@repo/contracts/team'
import { Trash2 } from 'lucide-react'

const ASSIGNABLE_ROLES: AgentRole[] = [
  'product_manager',
  'engineering_manager',
  'architect',
  'frontend_dev',
  'backend_dev',
]

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function TicketDetailDialog({
  ticket,
  isCreate,
  onClose,
  onPatch,
  onCreate,
  onDelete,
}: {
  ticket: TicketDTO | null
  isCreate: boolean
  onClose: () => void
  onPatch: (ticketId: string, patch: UpdateTicketRequest) => Promise<boolean>
  onCreate: (input: { title: string }) => Promise<void>
  onDelete: (ticketId: string) => Promise<void>
}) {
  const { t } = useI18n()
  const open = ticket !== null || isCreate
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setTitle(ticket?.title ?? '')
    setDescription(ticket?.description ?? '')
  }, [ticket, isCreate])

  const commitText = async () => {
    if (!ticket) return
    const patch: UpdateTicketRequest = {}
    if (title.trim() && title !== ticket.title) patch.title = title.trim()
    if (description !== ticket.description) patch.description = description
    if (Object.keys(patch).length > 0) await onPatch(ticket.id, patch)
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    await onCreate({ title: title.trim() })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {isCreate ? (
              t('board.newTicket')
            ) : (
              <>
                <span className="font-mono text-sm text-muted-foreground">{ticket?.key}</span>
                {t('board.ticketDetails')}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('board.fieldTitle')}</label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              onBlur={() => void commitText()}
              placeholder={t('board.titlePlaceholder')}
              autoFocus={isCreate}
            />
          </div>

          {!isCreate && ticket && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('board.fieldDescription')}</label>
                <Textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  onBlur={() => void commitText()}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder={t('board.descriptionPlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('board.fieldStatus')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {TICKET_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void onPatch(ticket.id, { status })}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-9',
                        ticket.status === status
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {t(`board.status.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('board.fieldPriority')}</label>
                  <select
                    className={selectClass}
                    value={ticket.priority}
                    onChange={(e) =>
                      void onPatch(ticket.id, {
                        priority: e.target.value as TicketDTO['priority'],
                      })
                    }
                  >
                    {TICKET_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {t(`board.priority.${priority}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('board.fieldAssignee')}</label>
                  <select
                    className={selectClass}
                    value={ticket.assigneeRole ?? ''}
                    onChange={(e) =>
                      void onPatch(ticket.id, {
                        assigneeRole: e.target.value === '' ? null : (e.target.value as AgentRole),
                      })
                    }
                  >
                    <option value="">{t('board.unassigned')}</option>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {AGENT_ROSTER[role].emoji} {AGENT_ROSTER[role].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('board.fieldEstimate')}</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={ticket.estimate ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const raw = e.target.value
                      void onPatch(ticket.id, {
                        estimate: raw === '' ? null : Number.parseInt(raw, 10),
                      })
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('board.fieldDueDate')}</label>
                  <Input
                    type="date"
                    value={ticket.dueDate ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      void onPatch(ticket.id, {
                        dueDate: e.target.value === '' ? null : e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            {!isCreate && ticket ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => void onDelete(ticket.id)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t('board.deleteTicket')}
              </Button>
            ) : (
              <span />
            )}
            {isCreate ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => void handleCreate()} disabled={!title.trim()}>
                  {t('board.createTicket')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
