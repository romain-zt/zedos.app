'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText, Share2, Copy, Check, XCircle, Download,
  AlertCircle, CheckCircle2, CircleDot, MessageSquare, GitBranch,
} from 'lucide-react'
import { formatPrdContentForAi } from '@/lib/prd-content-for-ai'
import { toast } from 'sonner'
import { ShareOutcomeModal } from '@/components/share-outcome-modal'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { PrdVersionDTO } from '@repo/contracts/prd/prd-contracts'
import {
  GeneratePrdAiResponseSchema,
  type GeneratePrdSection,
} from '@repo/contracts/ai/generate-prd-stream'
import { ShareLinkMintResponseSchema, ShareLinkSummarySchema } from '@repo/contracts/share/mint'
import {
  SectionDecisionCountsResponseSchema,
} from '@repo/contracts/decisions/decision'
import { PRD_SECTIONS } from '@repo/contracts/questions/history'
import { useOwnerMilestonePrompt } from './owner-milestone-prompt'
import { SectionCommentsPanel } from './section-comments-panel'
import { useI18n } from '@/src/i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExpressPrdDisclaimer } from '@/components/express-prd-disclaimer'

interface PrdViewerProps {
  projectId: string
  versions: PrdVersionDTO[]
  selectedVersion: PrdVersionDTO | null
  onSelectVersion: (v: PrdVersionDTO) => void
  onRefresh: () => void
  onOpenRefinement?: (payload: {
    label: string
    prdVersionId: string | null
    initialPrompt?: string
  }) => void
  onViewDecisionsForSection?: (sectionTitle: string) => void
}

export function PrdViewer({
  projectId,
  versions,
  selectedVersion,
  onSelectVersion,
  onRefresh,
  onOpenRefinement,
  onViewDecisionsForSection,
}: PrdViewerProps) {
  const { t } = useI18n()
  const { notifyMilestone } = useOwnerMilestonePrompt()
  const [sharePassword, setSharePassword] = useState('')
  const [shareExpiresDays, setShareExpiresDays] = useState('30')
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareLinkObj, setShareLinkObj] = useState<
    { id: string; token: string; enabled: boolean } | null
  >(null)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOutcomePrompt, setShowOutcomePrompt] = useState(false)
  const [sectionDecisionCounts, setSectionDecisionCounts] = useState<Record<string, number>>({})

  // Check for existing share link
  useEffect(() => {
    const existing = selectedVersion?.shareLinks?.[0]
    const summary = existing ? ShareLinkSummarySchema.safeParse(existing) : null
    if (summary?.success && summary.data.token) {
      const { id, token, enabled } = summary.data
      setShareLink(`${window?.location?.origin ?? ''}/share/${token}`)
      setShareLinkObj({ id, token, enabled })
    } else {
      setShareLink(null)
      setShareLinkObj(null)
    }
  }, [selectedVersion])

  useEffect(() => {
    if (!selectedVersion?.id) return
    notifyMilestone({
      projectId,
      milestoneType: 'prd_viewed',
      prdVersionId: selectedVersion.id,
    })
  }, [projectId, selectedVersion?.id, notifyMilestone])

  useEffect(() => {
    const loadSectionCounts = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/decisions/section-counts`)
        if (!res.ok) return
        const raw = await res.json()
        const parsed = SectionDecisionCountsResponseSchema.safeParse(raw)
        if (parsed.success) {
          setSectionDecisionCounts(parsed.data)
        }
      } catch {
        /* non-blocking */
      }
    }
    void loadSectionCounts()
  }, [projectId, selectedVersion?.id])

  const parsedContent = GeneratePrdAiResponseSchema.safeParse(selectedVersion?.content)
  const content = parsedContent.success ? parsedContent.data : null
  const sections: GeneratePrdSection[] = content?.sections ?? []

  const refinementSeedPromptForSection = (section: GeneratePrdSection): string => {
    const fromOpenQuestion = (section?.open_questions?.[0] ?? '').trim()
    if (fromOpenQuestion.length > 0) return fromOpenQuestion

    const sectionTitle = (section?.title ?? t('prd.section')).trim()
    const sectionContent = (section?.content ?? '').trim()
    const seedFromSectionTemplate = t('refine.seedFromSection')
    const seedFromSectionWithContentTemplate = t('refine.seedFromSectionWithContent')
    const resolvedSeedFromSectionTemplate =
      seedFromSectionTemplate === 'refine.seedFromSection'
        ? 'Quelle décision clé souhaitez-vous prendre maintenant pour la section "{section}" ?'
        : seedFromSectionTemplate
    const resolvedSeedFromSectionWithContentTemplate =
      seedFromSectionWithContentTemplate === 'refine.seedFromSectionWithContent'
        ? 'Pour la section "{section}", quelle décision prioritaire voulez-vous trancher maintenant ? Contexte actuel : {content}'
        : seedFromSectionWithContentTemplate

    if (sectionContent.length > 0) {
      const snippet = sectionContent.length > 280 ? `${sectionContent.slice(0, 279)}…` : sectionContent
      return resolvedSeedFromSectionWithContentTemplate
        .replace('{section}', sectionTitle)
        .replace('{content}', snippet)
    }

    return resolvedSeedFromSectionTemplate.replace('{section}', sectionTitle)
  }

  const handleShare = async () => {
    if (!selectedVersion?.id) return
    setSharing(true)
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdVersionId: selectedVersion.id,
          ...(sharePassword.trim().length >= 8 ? { password: sharePassword.trim() } : {}),
          ...(shareExpiresDays ? { expiresInDays: Number.parseInt(shareExpiresDays, 10) } : {}),
        }),
      })
      if (res?.ok) {
        const raw = await res.json()
        const validated = ShareLinkMintResponseSchema.safeParse(raw)
        if (!validated.success) {
          toast.error(t('prd.invalidShareLinkResponse'))
          return
        }
        const data = validated.data
        const link = `${window?.location?.origin ?? ''}/share/${data.token}`
        setShareLink(link)
        setShareLinkObj({ id: data.id, token: data.token, enabled: data.enabled })
        toast.success(t('prd.shareLinkCreated'))
        setShowOutcomePrompt(true)
        notifyMilestone({
          projectId,
          milestoneType: 'prd_shared',
          prdVersionId: selectedVersion.id,
        })
      } else {
        let msg = t('prd.createShareLinkFailed')
        try {
          const errBody = (await res.json()) as { error?: string }
          if (errBody?.error) msg = errBody.error
        } catch {
          /* ignore */
        }
        toast.error(msg)
      }
    } catch {
      toast.error(t('prd.createShareLinkFailed'))
    } finally {
      setSharing(false)
    }
  }

  const handleDisableShare = async () => {
    if (!shareLinkObj?.id) return
    try {
      await fetch('/api/share/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareLinkId: shareLinkObj.id }),
      })
      setShareLink(null)
      setShareLinkObj(null)
      toast.success(t('prd.shareLinkDisabled'))
      onRefresh()
    } catch {
      toast.error(t('prd.disableShareLinkFailed'))
    }
  }

  const handleCopy = () => {
    if (shareLink) {
      navigator?.clipboard?.writeText?.(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(t('common.copiedToClipboard'))
    }
  }

  const handleDownloadPdf = () => {
    if (!selectedVersion?.id) {
      toast.error(t('prd.noVersionSelected'))
      return
    }
    const url = `/api/projects/${projectId}/prd-print?versionId=${encodeURIComponent(selectedVersion.id)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(t('prd.pdfDialogOpened'))
  }

  const handleDownloadMarkdown = () => {
    if (!selectedVersion?.content) {
      toast.error(t('prd.noContentToExport'))
      return
    }
    const markdown = formatPrdContentForAi(selectedVersion.content)
    const versionLabel = selectedVersion.versionNumber ?? 'draft'
    const safeTitle =
      content?.title?.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'prd'
    const filename = `${safeTitle}-v${versionLabel}.md`
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t('prd.downloadedAsMarkdown'))
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'low': return 'text-red-500 bg-red-50'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle2 className="h-3.5 w-3.5" />
      case 'medium': return <CircleDot className="h-3.5 w-3.5" />
      case 'low': return <AlertCircle className="h-3.5 w-3.5" />
      default: return null
    }
  }

  if ((versions?.length ?? 0) === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-lg font-semibold mb-1">{t('prd.emptyTitle')}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t('prd.emptyDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Version selector + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select
            value={selectedVersion?.id ?? ''}
            onValueChange={(id: string) => {
              const v = versions.find((x) => x.id === id)
              if (v) onSelectVersion(v)
            }}
          >
            <SelectTrigger className="w-full sm:w-48 min-h-11 text-base" aria-label={t('prd.version')}>
              <SelectValue placeholder={t('prd.selectVersion')} />
            </SelectTrigger>
            <SelectContent>
              {(versions ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id} className="min-h-11 text-base">
                  {t('prd.version')} {v.versionNumber}
                  {v.deliverableKind === 'express' ? ` · ${t('prd.expressBadge')}` : ''}
                  {v.status ? ` (${v.status})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {content?.title && (
            <h2 className="font-display text-lg font-semibold hidden sm:block">{content.title}</h2>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMarkdown}
            disabled={!selectedVersion?.content}
            title={t('prd.downloadMarkdownTitle')}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {t('prd.exportMd')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={!selectedVersion?.content}
            title={t('prd.downloadPdfTitle')}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {t('prd.exportPdf')}
          </Button>
          {onOpenRefinement && selectedVersion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenRefinement({ label: 'my PRD', prdVersionId: selectedVersion?.id ?? null })}
              title={t('prd.refineTitle')}
            >
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              {t('prd.refine')}
            </Button>
          )}
          {shareLink ? (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {copied ? t('common.copied') : t('common.copyLink')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisableShare} className="text-destructive">
                <XCircle className="mr-1 h-3.5 w-3.5" />
                {t('common.disable')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <Label htmlFor="share-password" className="text-xs text-muted-foreground">
                  {t('prd.sharePasswordLabel')}
                </Label>
                <Input
                  id="share-password"
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-28">
                <Label htmlFor="share-expiry" className="text-xs text-muted-foreground">
                  {t('prd.expirationDays')}
                </Label>
                <Input
                  id="share-expiry"
                  type="number"
                  min={1}
                  max={365}
                  value={shareExpiresDays}
                  onChange={(e) => setShareExpiresDays(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleShare} loading={sharing}>
                <Share2 className="mr-2 h-3.5 w-3.5" />
                {t('prd.share')}
              </Button>
            </>
          )}
        </div>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <FileText className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium leading-snug flex flex-wrap items-center gap-2">
          <span>
            {t('prd.activeVersion')}: {selectedVersion ? `v${selectedVersion.versionNumber}` : '—'}
            {selectedVersion?.status ? ` · ${selectedVersion.status}` : ''}
          </span>
          {selectedVersion?.deliverableKind === 'express' && (
            <Badge variant="secondary" className="text-xs font-normal">
              {t('prd.expressBadge')}
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground sm:text-sm mt-0.5">
          {versions.length > 1
            ? t('prd.projectHasVersions').replace('{count}', String(versions.length))
            : t('prd.singleVersion')}
        </AlertDescription>
      </Alert>

      {selectedVersion?.deliverableKind === 'express' ? <ExpressPrdDisclaimer /> : null}

      {/* PRD body — masked in PostHog session replay (B-ANALYTICS-002).
          Wraps version summary + sections + raw fallback so no founder PRD
          text reaches the recording even when replay is enabled. */}
      <div className="space-y-3 ph-no-capture" data-ph-mask="prd-body">
        {/* Version summary */}
        {content?.version_summary && (
          <FadeIn>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{content.version_summary}</p>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* PRD Sections */}
        <Stagger staggerDelay={0.05}>
          <div className="space-y-3">
          {sections.map((section, i) => (
            <StaggerItem key={section?.id ?? i}>
              <Card className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-display pr-1 flex-1 min-w-0">
                      {section?.title ?? t('prd.section')}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(() => {
                        const sectionTitle = section?.title ?? ''
                        const canonicalSection = (PRD_SECTIONS as readonly string[]).includes(sectionTitle)
                          ? sectionTitle
                          : null
                        const decisionCount = canonicalSection
                          ? sectionDecisionCounts[canonicalSection] ?? 0
                          : 0
                        if (decisionCount > 0 && onViewDecisionsForSection && canonicalSection) {
                          return (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => onViewDecisionsForSection(canonicalSection)}
                            >
                              <GitBranch className="h-3 w-3" />
                              {t('prd.decisionsBadge').replace('{count}', String(decisionCount))}
                            </Button>
                          )
                        }
                        return null
                      })()}
                      {onOpenRefinement ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
                          aria-label={`${t('prd.refine')} ${section?.title ?? t('prd.section')}`}
                          onClick={() =>
                            onOpenRefinement({
                              label: `${section?.title ?? t('prd.section')} (PRD)`,
                              prdVersionId: selectedVersion?.id ?? null,
                              initialPrompt: refinementSeedPromptForSection(section),
                            })
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {section?.confidence && (
                        <Badge
                          variant="secondary"
                          className={`text-xs gap-1 shrink-0 ${getConfidenceColor(section.confidence)}`}
                        >
                          {getConfidenceIcon(section.confidence)}
                          {section.confidence}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {section?.content ?? t('shareToken.noContent')}
                  </div>
                  {(section?.open_questions?.length ?? 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('prd.openQuestions')}</p>
                      <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
                        {(section.open_questions ?? []).map((q: string, qi: number) => (
                          <li key={qi} className="flex items-start gap-1.5">
                            <span className="mt-0.5">•</span>
                            {onOpenRefinement ? (
                              <button
                                type="button"
                                className="text-left underline-offset-2 hover:underline"
                                onClick={() =>
                                  onOpenRefinement({
                                    label: `${section?.title ?? t('prd.section')} (PRD)`,
                                    prdVersionId: selectedVersion?.id ?? null,
                                    initialPrompt: q,
                                  })
                                }
                              >
                                {q}
                              </button>
                            ) : (
                              <span>{q}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(() => {
                    const sectionTitle = section?.title ?? ''
                    const canonicalSection = (PRD_SECTIONS as readonly string[]).includes(sectionTitle)
                      ? sectionTitle
                      : null
                    if (!canonicalSection) return null
                    return (
                      <SectionCommentsPanel
                        projectId={projectId}
                        prdVersionId={selectedVersion?.id ?? null}
                        sectionId={canonicalSection}
                        sectionTitle={canonicalSection}
                      />
                    )
                  })()}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </Stagger>

        {/* Raw content fallback */}
        {(sections?.length ?? 0) === 0 && content && (
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <ShareOutcomeModal
        open={showOutcomePrompt}
        onClose={() => setShowOutcomePrompt(false)}
        projectId={projectId}
        prdVersionId={selectedVersion?.id}
      />
    </div>
  )
}
