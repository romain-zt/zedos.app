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
import { useI18n } from '@/src/i18n'

const STORAGE_PREFIX = 'zedos:owner-milestone-banner:'

function dedupeStorageKey(payload: OwnerMilestoneDetectedPayload): string {
  const v = payload.prdVersionId ?? '_'
  return `${STORAGE_PREFIX}${payload.projectId}:${payload.milestoneType}:${v}`
}

function bannerCopy(
  milestoneType: OwnerMilestoneType,
  t: (key: string) => string
): { title: string; description: string } {
  switch (milestoneType) {
    case 'prd_created':
      return {
        title: t('feedback.banner.prdCreatedTitle'),
        description: t('feedback.banner.prdCreatedDescription'),
      }
    case 'prd_updated':
      return {
        title: t('feedback.banner.prdUpdatedTitle'),
        description: t('feedback.banner.prdUpdatedDescription'),
      }
    case 'prd_shared':
      return {
        title: t('feedback.banner.prdSharedTitle'),
        description: t('feedback.banner.prdSharedDescription'),
      }
    case 'prd_viewed':
      return {
        title: t('feedback.banner.prdViewedTitle'),
        description: t('feedback.banner.prdViewedDescription'),
      }
    default:
      return { title: t('feedback.banner.defaultTitle'), description: t('feedback.banner.defaultDescription') }
  }
}

function modalCopy(
  milestoneType: OwnerMilestoneType,
  t: (key: string) => string
): { title: string; description: string } {
  switch (milestoneType) {
    case 'prd_created':
      return {
        title: t('feedback.modal.prdCreatedTitle'),
        description: t('feedback.modal.prdCreatedDescription'),
      }
    case 'prd_shared':
      return {
        title: t('feedback.modal.prdSharedTitle'),
        description: t('feedback.modal.prdSharedDescription'),
      }
    case 'prd_updated':
      return {
        title: t('feedback.modal.prdUpdatedTitle'),
        description: t('feedback.modal.prdUpdatedDescription'),
      }
    case 'prd_viewed':
      return {
        title: t('feedback.modal.prdViewedTitle'),
        description: t('feedback.modal.prdViewedDescription'),
      }
    default:
      return {
        title: t('common.feedbackPromptTitle'),
        description: t('common.feedbackPromptDescription'),
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
  const { t } = useI18n()
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

  const bannerText = bannerPayload ? bannerCopy(bannerPayload.milestoneType, t) : null
  const modalText = modalPayload ? modalCopy(modalPayload.milestoneType, t) : null

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
                {t('feedback.banner.skip')}
              </Button>
              <Button type="button" size="sm" className="min-h-[44px]" onClick={openModalFromBanner}>
                {t('feedback.banner.shareFeedback')}
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
