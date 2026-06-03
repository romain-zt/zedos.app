'use client'

import { useState } from 'react'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChevronDown, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/src/i18n'

type PendingSwitch = {
  target: JourneyMode
  kind: 'switch' | 'approfondir'
}

export interface JourneyModeControlsProps {
  projectId: string
  journeyMode: JourneyMode
  onJourneyModeChange: (mode: JourneyMode) => void
  onExpressActivated?: () => void
}

export function JourneyModeControls({
  projectId,
  journeyMode,
  onJourneyModeChange,
  onExpressActivated,
}: JourneyModeControlsProps) {
  const { t } = useI18n()
  const [pending, setPending] = useState<PendingSwitch | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const applyMode = async (target: JourneyMode) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/journey-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyMode: target }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? t('workspace.journeyModeUpdateFailed'))
        return
      }
      const data = (await res.json()) as { journeyMode?: JourneyMode }
      const next = data.journeyMode === 'express' ? 'express' : 'standard'
      onJourneyModeChange(next)
      if (next === 'express' && journeyMode !== 'express') {
        toast.success(t('workspace.journeyModeExpressActivated'))
        onExpressActivated?.()
      } else if (next === 'standard' && journeyMode === 'express') {
        toast.success(t('workspace.journeyModeStandardActivated'))
      }
    } catch {
      toast.error(t('workspace.journeyModeUpdateFailed'))
    } finally {
      setSubmitting(false)
      setPending(null)
    }
  }

  const confirmPending = () => {
    if (!pending) return
    void applyMode(pending.target)
  }

  const badgeLabel =
    journeyMode === 'express'
      ? t('workspace.journeyModeExpress')
      : t('workspace.journeyModeStandard')

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          variant={journeyMode === 'express' ? 'default' : 'secondary'}
          className="gap-1 font-normal"
        >
          {journeyMode === 'express' ? <Zap className="h-3 w-3" /> : null}
          {badgeLabel}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={submitting}
              data-testid="journey-mode-change"
            >
              {t('workspace.journeyModeChange')}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {journeyMode === 'standard' ? (
              <DropdownMenuItem
                data-testid="journey-mode-switch-express"
                onSelect={() => setPending({ target: 'express', kind: 'switch' })}
              >
                {t('workspace.journeyModeSwitchToExpress')}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={() => setPending({ target: 'standard', kind: 'approfondir' })}
                >
                  {t('workspace.journeyModeApprofondir')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setPending({ target: 'standard', kind: 'switch' })}
                >
                  {t('workspace.journeyModeSwitchToStandard')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === 'approfondir'
                ? t('workspace.journeyModeConfirmApprofondirTitle')
                : pending?.target === 'express'
                  ? t('workspace.journeyModeConfirmExpressTitle')
                  : t('workspace.journeyModeConfirmStandardTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'approfondir'
                ? t('workspace.journeyModeConfirmApprofondirBody')
                : pending?.target === 'express'
                  ? t('workspace.journeyModeConfirmExpressBody')
                  : t('workspace.journeyModeConfirmStandardBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="journey-mode-confirm"
              onClick={confirmPending}
              disabled={submitting}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
