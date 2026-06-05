'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'
import { ClarificationChat } from './clarification-chat'
import { PrdViewer } from './prd-viewer'
import { QuestionHistoryPanel } from './question-history'
import { DecisionsPanel } from './decisions-panel'
import { ArchitecturePanel } from './architecture-panel'
import { WorkspaceScorePanel } from './workspace-score-panel'
import { ContextualRefinementPanel } from './contextual-refinement-panel'
import { NextActionBanner } from './next-action-banner'
import { MessageSquare, FileText, History, Settings, Layers, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { FadeIn } from '@/components/ui/animate'
import {
  PrdVersionListResponseSchema,
  type PrdVersionDTO,
} from '@repo/contracts/prd/prd-contracts'
import { z } from 'zod'
import { useI18n } from '@/src/i18n'
import { JourneyModeControls } from './journey-mode-controls'
import { ProjectMembersPanel } from './project-members-panel'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import { captureClient } from '@infrastructure/analytics/posthog-client'

type WorkspaceTab = 'clarify' | 'prd' | 'architecture' | 'history' | 'decisions'

const ProjectMetadataResponseSchema = z.object({
  phase: z.string().optional(),
  journeyMode: z.enum(['standard', 'express']).optional(),
  _count: z
    .object({
      questionHistory: z.coerce.number().int().nonnegative().optional(),
    })
    .optional(),
})

interface ProjectWorkspaceProps {
  projectId: string
  projectName: string
  projectDescription: string | null
  initialJourneyMode: JourneyMode
  initialActiveTab?: WorkspaceTab
}

export function ProjectWorkspace({
  projectId,
  projectName,
  projectDescription,
  initialJourneyMode,
  initialActiveTab = 'clarify',
}: ProjectWorkspaceProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialActiveTab)
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PrdVersionDTO | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState(projectName ?? '')
  const [editDesc, setEditDesc] = useState(projectDescription ?? '')
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState('intake')
  const [journeyMode, setJourneyMode] = useState<JourneyMode>(initialJourneyMode)
  const [loadingPhase, setLoadingPhase] = useState(true)
  const [questionHistoryCount, setQuestionHistoryCount] = useState(0)
  const [refinement, setRefinement] = useState<{
    isOpen: boolean
    label: string
    prdVersionId: string | null
    initialPrompt?: string
  }>({ isOpen: false, label: '', prdVersionId: null, initialPrompt: '' })
  const [decisionsSectionFilter, setDecisionsSectionFilter] = useState<string | null>(null)

  const openRefinement = useCallback((payload: {
    label: string
    prdVersionId: string | null
    initialPrompt?: string
  }) => {
    setRefinement({ isOpen: true, ...payload })
  }, [])

  const closeRefinement = useCallback(() => {
    setRefinement((r) => ({ ...r, isOpen: false }))
  }, [])

  const fetchVersions = useCallback(
    async (opts?: { selectLatest?: boolean }) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/prd`)
        if (!res.ok) {
          if (res.status !== 401) toast.error(t('workspace.loadPrdVersionsFailed'))
          return
        }

        const raw = await res.json()
        const parsed = PrdVersionListResponseSchema.safeParse(raw)
        if (!parsed.success) {
          toast.error(t('workspace.loadPrdVersionsFailed'))
          return
        }
        const data = parsed.data
        setPrdVersions(data)
        if (opts?.selectLatest && data.length > 0) {
          const latest = data.reduce((best, v) =>
            v.versionNumber > best.versionNumber ? v : best
          )
          setSelectedVersion(latest)
        } else {
          setSelectedVersion((prev) => {
            if (prev && data.some((v) => v.id === prev.id)) return prev
            return data[0] ?? null
          })
        }
      } catch {
        toast.error(t('workspace.loadPrdVersionsFailed'))
      }
    },
    [projectId, t]
  )

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res?.ok) {
          const raw = await res.json()
          const parsed = ProjectMetadataResponseSchema.safeParse(raw)
          if (parsed.success) {
            setPhase(parsed.data.phase ?? 'intake')
            if (parsed.data.journeyMode) {
              setJourneyMode(parsed.data.journeyMode)
            }
            setQuestionHistoryCount(parsed.data._count?.questionHistory ?? 0)
          }
        }
      } catch {
      } finally {
        setLoadingPhase(false)
      }
    }
    fetchPhase()
  }, [projectId])

  const handlePrdGenerated = useCallback(() => {
    fetchVersions()
    setActiveTab('prd')
  }, [fetchVersions])

  const openLatestPrd = useCallback(async () => {
    closeRefinement()
    await fetchVersions({ selectLatest: true })
    setActiveTab('prd')
  }, [fetchVersions, closeRefinement])

  const openDecisionsForSection = useCallback((sectionTitle: string) => {
    setDecisionsSectionFilter(sectionTitle)
    setActiveTab('decisions')
  }, [])

  const latestPrdVersion = prdVersions.length === 0
    ? null
    : prdVersions.reduce((best, v) => (v.versionNumber > best.versionNumber ? v : best))
  const hasActiveShareLinkOnLatestPrd = (latestPrdVersion?.shareLinks ?? []).some(
    (s) => s.enabled
  )

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      })
      if (res?.ok) {
        toast.success(t('workspace.projectUpdated'))
        setShowSettings(false)
      }
    } catch {
      toast.error(t('workspace.updateProjectFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{projectName}</h1>
            {projectDescription && (
              <p className="text-sm text-muted-foreground mt-0.5">{projectDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <JourneyModeControls
              projectId={projectId}
              journeyMode={journeyMode}
              onJourneyModeChange={setJourneyMode}
              onExpressActivated={() => setActiveTab('clarify')}
            />
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FadeIn>

      <NextActionBanner
        projectId={projectId}
        journeyMode={journeyMode}
        prdVersionCount={prdVersions.length}
        questionHistoryCount={questionHistoryCount}
        hasActiveShareLinkOnLatestPrd={hasActiveShareLinkOnLatestPrd}
        loading={loadingPhase}
        onSwitchTab={setActiveTab}
        onJourneyModeChange={setJourneyMode}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const tab = value as WorkspaceTab
          setActiveTab(tab)
          captureClient(AnalyticsEvents.WORKSPACE_TAB_SELECTED, {
            project_id: projectId,
            tab,
            journey_mode: journeyMode,
          })
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="clarify" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('workspace.tabClarify')}
            </TabsTrigger>
            <TabsTrigger value="prd" className="gap-2 min-h-11 sm:min-h-0">
              <FileText className="h-4 w-4" />
              {t('workspace.tabPrd')}
              {selectedVersion && (
                <span
                  className="ml-1 text-xs bg-muted rounded-full px-1.5 py-0.5 font-mono"
                  title={t('workspace.activePrdVersionTitle')}
                >
                  v{selectedVersion.versionNumber}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="architecture" className="gap-2">
              <Layers className="h-4 w-4" />
              {t('workspace.tabArchitecture')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              {t('workspace.tabHistory')}
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <GitBranch className="h-4 w-4" />
              {t('workspace.tabDecisions')}
            </TabsTrigger>
          </TabsList>
          {!loadingPhase && <WorkspaceScorePanel projectId={projectId} />}
        </div>

        <TabsContent value="clarify" className="mt-4">
          <ClarificationChat
            projectId={projectId}
            prdVersionId={selectedVersion?.id ?? null}
            journeyMode={journeyMode}
            onPrdGenerated={handlePrdGenerated}
          />
        </TabsContent>

        <TabsContent value="prd" className="mt-4">
          <PrdViewer
            projectId={projectId}
            versions={prdVersions}
            selectedVersion={selectedVersion}
            onSelectVersion={setSelectedVersion}
            onRefresh={fetchVersions}
            onOpenRefinement={openRefinement}
            onViewDecisionsForSection={openDecisionsForSection}
          />
        </TabsContent>

        <TabsContent value="architecture" className="mt-4">
          <ArchitecturePanel
            projectId={projectId}
            phase={phase}
            activePrdVersionId={selectedVersion?.id ?? null}
            onOpenRefinement={openRefinement}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <QuestionHistoryPanel
            projectId={projectId}
            prdVersions={prdVersions}
            isTabActive={activeTab === 'history'}
            onOpenRefinement={openRefinement}
          />
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <DecisionsPanel
            projectId={projectId}
            prdVersions={prdVersions}
            isTabActive={activeTab === 'decisions'}
            initialSectionFilter={decisionsSectionFilter}
            onSectionFilterApplied={() => setDecisionsSectionFilter(null)}
          />
        </TabsContent>
      </Tabs>

      <ContextualRefinementPanel
        projectId={projectId}
        prdVersionId={refinement.prdVersionId}
        contextLabel={refinement.label}
        initialPrompt={refinement.initialPrompt ?? ''}
        isOpen={refinement.isOpen}
        onClose={closeRefinement}
        onPrdUpdated={fetchVersions}
        onViewLatestPrd={openLatestPrd}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('workspace.projectSettings')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.name')}</label>
                <Input value={editName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.description')}</label>
                <Textarea
                  value={editDesc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDesc(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowSettings(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleSaveSettings} loading={saving}>{t('common.save')}</Button>
              </div>
            </div>
            <ProjectMembersPanel projectId={projectId} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
