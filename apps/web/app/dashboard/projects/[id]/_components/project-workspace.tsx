'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'
import { ClarificationChat } from './clarification-chat'
import { PrdViewer } from './prd-viewer'
import { QuestionHistoryPanel } from './question-history'
import { ArchitecturePanel } from './architecture-panel'
import { WorkspaceScorePanel } from './workspace-score-panel'
import { ProjectMembersPanel } from './project-members-panel'
import { ContextualRefinementPanel } from './contextual-refinement-panel'
import { MessageSquare, FileText, History, Settings, Layers } from 'lucide-react'
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
import { useI18n } from '@/src/i18n'
import { JourneyModeControls } from './journey-mode-controls'

interface ProjectWorkspaceProps {
  projectId: string
  projectName: string
  projectDescription: string | null
  initialJourneyMode: JourneyMode
}

export function ProjectWorkspace({
  projectId,
  projectName,
  projectDescription,
  initialJourneyMode,
}: ProjectWorkspaceProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('clarify')
  const [prdVersions, setPrdVersions] = useState<PrdVersionDTO[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PrdVersionDTO | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState(projectName ?? '')
  const [editDesc, setEditDesc] = useState(projectDescription ?? '')
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState('intake')
  const [journeyMode, setJourneyMode] = useState<JourneyMode>(initialJourneyMode)
  const [loadingPhase, setLoadingPhase] = useState(true)
  const [refinement, setRefinement] = useState<{
    isOpen: boolean
    label: string
    prdVersionId: string | null
    initialPrompt?: string
  }>({ isOpen: false, label: '', prdVersionId: null, initialPrompt: '' })

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
          const data = await res.json()
          setPhase(data.phase || 'intake')
          if (data.journeyMode === 'express' || data.journeyMode === 'standard') {
            setJourneyMode(data.journeyMode)
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          </TabsList>
          {!loadingPhase && <WorkspaceScorePanel projectId={projectId} />}
        </div>

        <TabsContent value="clarify" className="mt-4">
          <ClarificationChat
            projectId={projectId}
            prdVersionId={selectedVersion?.id ?? null}
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
