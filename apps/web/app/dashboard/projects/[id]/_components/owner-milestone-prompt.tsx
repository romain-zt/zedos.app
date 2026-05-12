'use client'

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  OwnerMilestoneDetectedPayloadSchema,
  type OwnerMilestoneDetectedPayload,
} from '@repo/contracts/feedback/milestone-prompt'
import type { OwnerMilestoneType } from '@repo/contracts/feedback/submit'

const STORAGE_PREFIX = 'zedos:milestone-prompt-dismissed:v0:'

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`
}

function readDismissed(projectId: string): Set<OwnerMilestoneType> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(storageKey(projectId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { types?: OwnerMilestoneType[] }
    return new Set(parsed.types ?? [])
  } catch {
    return new Set()
  }
}

function recordDismissed(projectId: string, milestoneType: OwnerMilestoneType): void {
  const next = readDismissed(projectId)
  next.add(milestoneType)
  sessionStorage.setItem(storageKey(projectId), JSON.stringify({ types: [...next] }))
}

function parseMilestonePayloadFromSearch(raw: string | null): OwnerMilestoneDetectedPayload | null {
  if (!raw) return null
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const json = decodeURIComponent(escape(window.atob(b64 + pad)))
    const data: unknown = JSON.parse(json)
    const parsed = OwnerMilestoneDetectedPayloadSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function milestoneTitle(milestoneType: OwnerMilestoneType): string {
  switch (milestoneType) {
    case 'prd_created':
      return 'First PRD version saved'
    case 'prd_updated':
      return 'PRD updated after clarification'
    case 'prd_shared':
      return 'Share link ready'
    case 'prd_viewed':
      return 'Welcome back to your PRD'
    default:
      return 'Quick feedback'
  }
}

type OwnerMilestonePromptContextValue = {
  signalMilestone: (payload: OwnerMilestoneDetectedPayload) => void
}

const OwnerMilestonePromptContext = createContext<OwnerMilestonePromptContextValue | null>(null)

export function useOwnerMilestonePrompt(): OwnerMilestonePromptContextValue {
  const ctx = useContext(OwnerMilestonePromptContext)
  if (!ctx) {
    throw new Error('useOwnerMilestonePrompt must be used within OwnerMilestonePromptShell')
  }
  return ctx
}

type InnerProps = {
  projectId: string
  children: React.ReactNode
}

function OwnerMilestonePromptInner({ projectId, children }: InnerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState<OwnerMilestoneDetectedPayload | null>(null)

  const stripMilestoneParam = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    if (!next.has('milestonePayload')) return
    next.delete('milestonePayload')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const tryShow = useCallback(
    (payload: OwnerMilestoneDetectedPayload) => {
      if (payload.projectId !== projectId) return
      const dismissed = readDismissed(projectId)
      if (dismissed.has(payload.milestoneType)) return
      setActive(payload)
    },
    [projectId]
  )

  const signalMilestone = useCallback(
    (payload: OwnerMilestoneDetectedPayload) => {
      const parsed = OwnerMilestoneDetectedPayloadSchema.safeParse(payload)
      if (!parsed.success) return
      tryShow(parsed.data)
    },
    [tryShow]
  )

  useEffect(() => {
    const raw = searchParams.get('milestonePayload')
    const fromUrl = parseMilestonePayloadFromSearch(raw)
    if (fromUrl && fromUrl.projectId === projectId) {
      tryShow(fromUrl)
      stripMilestoneParam()
    }
  }, [projectId, searchParams, stripMilestoneParam, tryShow])

  const contextValue = useMemo(() => ({ signalMilestone }), [signalMilestone])

  const onSkip = useCallback(() => {
    if (!active) return
    recordDismissed(projectId, active.milestoneType)
    setActive(null)
  }, [active, projectId])

  return (
    <OwnerMilestonePromptContext.Provider value={contextValue}>
      {children}
      {active ? (
        <aside
          role="dialog"
          aria-modal="false"
          aria-label="Feedback prompt"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:rounded-lg sm:border sm:px-4 sm:py-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-neutral-900">
              <span className="font-medium">{milestoneTitle(active.milestoneType)}</span>
              <span className="text-neutral-600"> — tell us how it&apos;s going? (optional)</span>
            </p>
            <div className="flex shrink-0 justify-end gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="min-h-11 min-w-11 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-base font-medium text-neutral-800 sm:min-h-10"
              >
                Skip
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </OwnerMilestonePromptContext.Provider>
  )
}

export function OwnerMilestonePromptShell({ projectId, children }: InnerProps) {
  return (
    <Suspense fallback={children}>
      <OwnerMilestonePromptInner projectId={projectId}>{children}</OwnerMilestonePromptInner>
    </Suspense>
  )
}
