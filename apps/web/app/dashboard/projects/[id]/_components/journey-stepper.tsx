'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'
import { localePath } from '@/lib/locale-path'
import { JourneyStateDTOSchema, type JourneyStateDTO } from '@repo/contracts/project'
import {
  deriveJourneySteps,
  journeyStepHref,
  type DerivedJourneyStep,
} from '@domain/project-workspace/derive-journey-steps'
import { Check, Lock } from 'lucide-react'

/**
 * Idea → Clarify → PRD → Features → Stories → Tickets → Plan → Ship.
 * Horizontal scrollable pills; each step deep-links into its workspace.
 */
export function JourneyStepper({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [steps, setSteps] = useState<DerivedJourneyStep[] | null>(null)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/journey-state`)
      if (!res.ok) return
      const parsed = JourneyStateDTOSchema.safeParse(await res.json())
      if (parsed.success) {
        setSteps(deriveJourneySteps(parsed.data as JourneyStateDTO))
      }
    } catch {
      // non-blocking — the stepper is guidance only
    }
  }, [projectId])

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  if (!steps) {
    return (
      <div className="h-10 rounded-xl border bg-card/60 animate-pulse" aria-hidden data-testid="journey-stepper-loading" />
    )
  }

  return (
    <nav
      aria-label={t('journey.label')}
      className="rounded-xl border bg-card/60 px-2 py-1.5 overflow-x-auto scrollbar-hide -mx-1"
      data-testid="journey-stepper"
    >
      <ol className="flex items-center gap-1 min-w-max">
        {steps.map(({ step, status }, index) => (
          <li key={step} className="flex items-center">
            {index > 0 && (
              <span
                className={cn(
                  'mx-0.5 h-px w-3 sm:w-5',
                  status === 'done' ? 'bg-primary/50' : 'bg-border'
                )}
                aria-hidden
              />
            )}
            <button
              type="button"
              disabled={status === 'locked'}
              onClick={() => router.push(localePath(journeyStepHref(projectId, step), locale))}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors min-h-9 touch-manipulation',
                status === 'done' && 'text-primary hover:bg-primary/10',
                status === 'current' && 'bg-primary text-primary-foreground shadow-sm',
                status === 'upcoming' && 'text-muted-foreground hover:bg-muted',
                status === 'locked' && 'text-muted-foreground/50 cursor-not-allowed'
              )}
              title={status === 'locked' ? t('journey.lockedHint') : undefined}
              data-testid={`journey-step-${step}`}
              data-status={status}
            >
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0',
                  status === 'done' && 'bg-primary text-primary-foreground',
                  status === 'current' && 'bg-primary-foreground/20',
                  (status === 'upcoming' || status === 'locked') && 'bg-muted'
                )}
              >
                {status === 'done' ? (
                  <Check className="h-2.5 w-2.5" />
                ) : status === 'locked' ? (
                  <Lock className="h-2.5 w-2.5" />
                ) : (
                  index + 1
                )}
              </span>
              {t(`journey.step.${step}`)}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
