'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText, Share2, Copy, Check, XCircle,
  AlertCircle, CheckCircle2, CircleDot,
} from 'lucide-react'
import { toast } from 'sonner'
import { MilestoneFeedbackModal } from '@/components/milestone-feedback-modal'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { PrdVersionDTO } from '@repo/contracts/prd/prd-contracts'

interface PrdViewerProps {
  projectId: string
  versions: PrdVersionDTO[]
  selectedVersion: PrdVersionDTO | null
  onSelectVersion: (v: PrdVersionDTO) => void
  onRefresh: () => void
}

export function PrdViewer({ projectId, versions, selectedVersion, onSelectVersion, onRefresh }: PrdViewerProps) {
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareLinkObj, setShareLinkObj] = useState<any>(null)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState('')

  // Check for existing share link
  useEffect(() => {
    const existing = selectedVersion?.shareLinks?.[0]
    if (existing?.token) {
      setShareLink(`${window?.location?.origin ?? ''}/share/${existing.token}`)
      setShareLinkObj(existing)
    } else {
      setShareLink(null)
      setShareLinkObj(null)
    }
  }, [selectedVersion])

  const content = selectedVersion?.content as Record<string, unknown> & {
    title?: string
    sections?: unknown[]
    version_summary?: string
 }
  const sections = content?.sections ?? []

  const handleShare = async () => {
    if (!selectedVersion?.id) return
    setSharing(true)
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdVersionId: selectedVersion.id }),
      })
      if (res?.ok) {
        const data = await res.json()
        const link = `${window?.location?.origin ?? ''}/share/${data?.token}`
        setShareLink(link)
        setShareLinkObj(data)
        toast.success('Share link created!')
        // Milestone feedback for sharing
        setFeedbackType('prd_shared')
        setShowFeedback(true)
      }
    } catch {
      toast.error('Failed to create share link')
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
      toast.success('Share link disabled')
      onRefresh()
    } catch {
      toast.error('Failed to disable share link')
    }
  }

  const handleCopy = () => {
    if (shareLink) {
      navigator?.clipboard?.writeText?.(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    }
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
          <h3 className="font-display text-lg font-semibold mb-1">No PRD yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Go through the clarification flow and generate your first PRD version.
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
            <SelectTrigger className="w-full sm:w-48 min-h-11 text-base" aria-label="PRD version">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {(versions ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id} className="min-h-11 text-base">
                  Version {v.versionNumber}
                  {v.status ? ` (${v.status})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {content?.title && (
            <h2 className="font-display text-lg font-semibold hidden sm:block">{content.title}</h2>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shareLink ? (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisableShare} className="text-destructive">
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Disable
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleShare} loading={sharing}>
              <Share2 className="mr-2 h-3.5 w-3.5" />
              Share
            </Button>
          )}
        </div>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <FileText className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium leading-snug">
          Active version: {selectedVersion ? `v${selectedVersion.versionNumber}` : '—'}
          {selectedVersion?.status ? ` · ${selectedVersion.status}` : ''}
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground sm:text-sm mt-0.5">
          {versions.length > 1
            ? `This project has ${versions.length} versions. Pick one above — Clarify and sharing use the version shown here.`
            : 'You are viewing the only PRD version for this project.'}
        </AlertDescription>
      </Alert>

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
          {(sections ?? []).map((section: any, i: number) => (
            <StaggerItem key={section?.id ?? i}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">{section?.title ?? 'Section'}</CardTitle>
                    {section?.confidence && (
                      <Badge
                        variant="secondary"
                        className={`text-xs gap-1 ${getConfidenceColor(section.confidence)}`}
                      >
                        {getConfidenceIcon(section.confidence)}
                        {section.confidence}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {section?.content ?? 'No content'}
                  </div>
                  {(section?.open_questions?.length ?? 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Open Questions</p>
                      <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1">
                        {(section.open_questions ?? []).map((q: string, qi: number) => (
                          <li key={qi} className="flex items-start gap-1.5">
                            <span className="mt-0.5">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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

      {/* Milestone Feedback */}
      <MilestoneFeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        projectId={projectId}
        prdVersionId={selectedVersion?.id}
        milestoneType={feedbackType}
        title={
          feedbackType === 'prd_shared'
            ? 'PRD Shared!'
            : feedbackType === 'prd_reopened'
            ? 'Welcome back to your PRD'
            : 'How was that?'
        }
        description="Quick feedback helps improve the experience."
      />
    </div>
  )
}
