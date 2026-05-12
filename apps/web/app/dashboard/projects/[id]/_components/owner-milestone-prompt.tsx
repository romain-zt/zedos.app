'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { OwnerMilestoneDetectedPayloadSchema } from '@repo/contracts/feedback/milestone-prompt'
import type { OwnerMilestoneDetectedPayload } from '@repo/contracts/feedback/milestone-prompt'
import { OwnerMilestoneTypeSchema } from '@repo/contracts/feedback/submit'
import type { OwnerMilestoneType } from '@repo/contracts/feedback/submit'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MilestoneFeedbackModal } from '@/components/milestone-feedback-modal'

const STORAGE_PREFIX = 'zedos:owner-milestone-banner:'

function dedupeStorageKey(payload: OwnerMilestoneDetectedPayload): string {
  const v = payload.prdVersionId ?? '_'
  return `${STORAGE_PREFIX}${payload.projectId}:${payload.milestoneType}:${v}`
}

function bannerCopy(milestoneType: OwnerMilestoneType): { title: string; description: string } {
  switch (milestoneType) {
    case 'prd_created':
      return {
        title: 'PRD created',
        description: 'If you have a moment, tell us how the generation flow worked for you.',
      }
    case 'prd_updated':
      return {
        title: 'PRD updated',
        description: 'Quick feedback on the update experience helps us improve.',
      }
    case 'prd_shared':
      return {
        title: 'Share link ready',
        description: 'How was sharing your PRD with stakeholders?',
      }
    case 'prd_viewed':
      return {
        title: 'Reviewing your PRD',
        description: 'We would love a quick rating of the reading experience.',
      }
    default:
      return { title: 'Milestone', description: 'Share quick feedback if you would like.' }
  }
}

function modalCopy(milestoneType: OwnerMilestoneType): { title: string; description: string } {
  switch (milestoneType) {
    case 'prd_created':
      return {
        title: 'PRD generated',
        description: 'Your feedback helps improve the product clarification experience.',
      }
    case 'prd_shared':
      return {
        title: 'PRD shared',
        description: 'Your feedback helps improve sharing and collaboration.',
      }
    case 'prd_updated':
      return {
        title: 'PRD updated',
        description: 'Your feedback helps improve refinement and update flows.',
      }
    case 'prd_viewed':
      return {
        title: 'PRD reading experience',
        description: 'Your feedback helps improve how PRDs are presented in the workspace.',
      }
    default:
      return {
        title: 'How was that?',
        description: 'Your feedback helps us improve the product.',
      }
  }
}

type MilestonePromptContextValue = {
  notifyMilestone: (input: unknown) => void
}

const MilestonePromptContext = createContext<MilestonePromptContextValue | null>(null)

export function useOwnerMilestonePrompt(): MilestonePromptContextValue {
  const ctx = useContext(MilestonePromptContext)
  if (!ctx) {
    return { notifyMilestone: () => {} }
  }
  return ctx
}

export function OwnerMilestonePromptProvider({
  children,
  projectId,
  enabled,
}: {
  children: React.ReactNode
  projectId: string
  enabled: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [bannerPayload, setBannerPayload] = useState<OwnerMilestoneDetectedPayload | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPayload, setModalPayload] = useState<OwnerMilestoneDetectedPayload | null>(null)

  const tryShow = useCallback(
    (payload: OwnerMilestoneDetectedPayload) => {
      if (!enabled || payload.projectId !== projectId) return
      if (typeof sessionStorage === 'undefined') return
      const key = dedupeStorageKey(payload)
      if (sessionStorage.getItem(key)) return
      setBannerPayload(payload)
    },
    [enabled, projectId]
  )

  const notifyMilestone = useCallback(
    (input: unknown) => {
      if (!enabled) return
      const parsed = OwnerMilestoneDetectedPayloadSchema.safeParse(input)
      if (!parsed.success) return
      tryShow(parsed.data)
    },
    [enabled, tryShow]
  )

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const rawType = params.get('om')
    const rawVersion = params.get('omv')
    if (!rawType) return

    const typeParsed = OwnerMilestoneTypeSchema.safeParse(rawType)
    if (!typeParsed.success) return

    const candidate: OwnerMilestoneDetectedPayload = {
      projectId,
      milestoneType: typeParsed.data,
      ...(rawVersion && rawVersion.length > 0 ? { prdVersionId: rawVersion } : {}),
    }
    const validated = OwnerMilestoneDetectedPayloadSchema.safeParse(candidate)
    if (!validated.success) return

    tryShow(validated.data)

    params.delete('om')
    params.delete('omv')
    const next = params.toString()
    const url = next ? `${pathname}?${next}` : pathname
    router.replace(url)
  }, [enabled, pathname, projectId, router, tryShow])

  const skipBanner = useCallback(() => {
    if (bannerPayload && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(dedupeStorageKey(bannerPayload), '1')
    }
    setBannerPayload(null)
  }, [bannerPayload])

  const openModalFromBanner = useCallback(() => {
    if (!bannerPayload) return
    setModalPayload(bannerPayload)
    setModalOpen(true)
    setBannerPayload(null)
  }, [bannerPayload])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    if (modalPayload && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(dedupeStorageKey(modalPayload), '1')
    }
    setModalPayload(null)
  }, [modalPayload])

  const ctx = useMemo(() => ({ notifyMilestone }), [notifyMilestone])

  const bannerText = bannerPayload ? bannerCopy(bannerPayload.milestoneType) : null
  const modalText = modalPayload ? modalCopy(modalPayload.milestoneType) : null

  return (
    <MilestonePromptContext.Provider value={ctx}>
      {children}
      {enabled && bannerPayload && bannerText && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
          <Alert className="pointer-events-auto max-w-3xl mx-auto border-primary/20 bg-background/95 shadow-lg backdrop-blur-sm">
            <AlertTitle className="text-base font-display pr-8">{bannerText.title}</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground mt-1">
              {bannerText.description}
            </AlertDescription>
            <div className="flex flex-wrap gap-2 mt-3 justify-end">
              <Button type="button" variant="ghost" size="sm" className="min-h-[44px]" onClick={skipBanner}>
                Skip
              </Button>
              <Button type="button" size="sm" className="min-h-[44px]" onClick={openModalFromBanner}>
                Share feedback
              </Button>
            </div>
          </Alert>
        </div>
      )}
      {modalPayload && modalText && (
        <MilestoneFeedbackModal
          open={modalOpen}
          onClose={closeModal}
          projectId={modalPayload.projectId}
          prdVersionId={modalPayload.prdVersionId ?? null}
          milestoneType={modalPayload.milestoneType}
          title={modalText.title}
          description={modalText.description}
        />
      )}
    </MilestonePromptContext.Provider>
  )
}
