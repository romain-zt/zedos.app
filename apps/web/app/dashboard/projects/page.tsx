'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ProjectWithCounts } from '@domain/project/project-repository'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'
import {
  TemplateSlugSchema,
  type TemplateDetailDTO,
  type TemplateSlug,
} from '@repo/contracts/templates'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { validateImportPasteClient } from '@/app/api/projects/parse-create-project-request'
import { IMPORTED_PRD_MAX_BYTES } from '@repo/contracts/project/prd-import-at-create'
import {
  Plus, FileText, ArrowRight, FolderOpen, MoreVertical, Trash2, Pencil,
  AlertTriangle, RefreshCw, LayoutGrid, X,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { useI18n } from '@/src/i18n'

function journeyModeFromHint(hint: TemplateDetailDTO['journeyHint']): JourneyMode {
  return hint === 'express' ? 'express' : 'standard'
}

export default function ProjectsPage() {
  const { t, tp } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newJourneyMode, setNewJourneyMode] = useState<JourneyMode>('standard')
  const [importOpen, setImportOpen] = useState(false)
  const [importPaste, setImportPaste] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetailDTO | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  const importActive =
    importOpen && (importPaste.trim().length > 0 || importFile != null)
  const templateActive = selectedTemplate !== null

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res?.ok) {
        setProjects([])
        setListError(
          res
            ? t('errors.loadProjectsHttp').replace('{status}', String(res.status))
            : t('errors.loadProjects')
        )
        return
      }
      const data: unknown = await res.json()
      setProjects(Array.isArray(data) ? (data as ProjectWithCounts[]) : [])
    } catch (e) {
      setProjects([])
      const detail = e instanceof Error ? e.message : t('common.networkError')
      setListError(t('errors.loadProjectsWithDetail').replace('{detail}', detail))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { void fetchProjects() }, [fetchProjects])

  const resetCreateForm = () => {
    setNewName('')
    setNewDesc('')
    setNewJourneyMode('standard')
    setImportOpen(false)
    setImportPaste('')
    setImportFile(null)
    setSelectedTemplate(null)
  }

  const clearTemplate = useCallback(() => {
    setSelectedTemplate(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('template')
    const next = params.toString()
    router.replace(`/dashboard/projects${next ? `?${next}` : ''}`)
  }, [router, searchParams])

  const loadTemplate = useCallback(async (slug: TemplateSlug) => {
    setTemplateLoading(true)
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(slug)}`)
      if (!res.ok) {
        toast.error(tp('templatePicker.loadFailed', 'Could not load template'))
        return
      }
      const json: unknown = await res.json()
      const detail = json as TemplateDetailDTO
      setSelectedTemplate(detail)
      setNewJourneyMode(journeyModeFromHint(detail.journeyHint))
      if (!newName.trim()) setNewName(detail.title)
      setShowCreate(true)
      setImportOpen(false)
      setImportPaste('')
      setImportFile(null)
    } catch {
      toast.error(tp('templatePicker.networkError', 'Network error loading template'))
    } finally {
      setTemplateLoading(false)
    }
  }, [newName, tp])

  useEffect(() => {
    const raw = searchParams.get('template')
    if (!raw) return
    const parsed = TemplateSlugSchema.safeParse(raw)
    if (!parsed.success) {
      clearTemplate()
      return
    }
    if (selectedTemplate?.slug === parsed.data) return
    void loadTemplate(parsed.data)
  }, [searchParams, selectedTemplate, loadTemplate, clearTemplate])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t('projects.nameRequired'))
      return
    }
    if (templateActive && importOpen) {
      toast.error(
        tp(
          'templatePicker.mutualExclusion',
          'Cannot combine import with a template — clear one before creating.'
        )
      )
      return
    }
    if (!templateActive && importOpen && importPaste.trim()) {
      const pasteError = validateImportPasteClient(importPaste)
      if (pasteError) {
        toast.error(pasteError)
        return
      }
    }
    setCreating(true)
    try {
      let res: Response
      if (templateActive && selectedTemplate) {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            description: newDesc.trim() || null,
            journeyMode: newJourneyMode,
            templateSlug: selectedTemplate.slug,
          }),
        })
      } else if (importOpen && importFile) {
        const formData = new FormData()
        formData.set('name', newName.trim())
        formData.set('description', newDesc.trim())
        formData.set('journeyMode', newJourneyMode)
        formData.set('importKind', 'file')
        formData.set('importFile', importFile)
        res = await fetch('/api/projects', { method: 'POST', body: formData })
      } else if (importOpen && importPaste.trim()) {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            description: newDesc.trim() || null,
            journeyMode: newJourneyMode,
            importPaste: importPaste.trim(),
          }),
        })
      } else {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            description: newDesc.trim() || null,
            journeyMode: newJourneyMode,
          }),
        })
      }
      if (res?.ok) {
        const project = await res.json()
        toast.success(
          templateActive
            ? tp('templatePicker.createdFromTemplate', 'Project created from template')
            : importActive
              ? t('projects.createdWithImport')
              : t('projects.created')
        )
        setShowCreate(false)
        resetCreateForm()
        if (templateActive) clearTemplate()
        const tab = templateActive || importActive ? '?tab=prd' : ''
        router.push(`/dashboard/projects/${project?.id}${tab}`)
      } else {
        const data = await res.json()
        toast.error(data?.error ?? t('projects.createFailed'))
      }
    } catch {
      toast.error(t('projects.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('projects.deleteConfirm'))) return
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success(t('projects.deleted'))
      void fetchProjects()
    } catch {
      toast.error(t('projects.deleteFailed'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-0 space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{t('projects.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('projects.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="w-full min-h-11 shrink-0 sm:w-auto sm:min-h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('projects.new')}
          </Button>
        </div>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : listError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle className="text-base">{t('projects.loadFailedTitle')}</AlertTitle>
          <AlertDescription className="text-destructive-foreground/90 space-y-3">
            <p>{listError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 w-full sm:w-auto border-destructive-foreground/40"
              onClick={() => void fetchProjects()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (projects?.length ?? 0) === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-1">{t('projects.emptyTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('projects.emptyDescription')}
            </p>
            <Button onClick={() => setShowCreate(true)} className="min-h-11 w-full max-w-xs sm:min-h-10 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t('projects.new')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stagger staggerDelay={0.05}>
          <div className="grid gap-3">
            {(projects ?? []).map((project) => (
              <StaggerItem key={project.id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      className="flex-1 flex items-center gap-3 text-left min-h-11 py-1 sm:min-h-0"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.name ?? 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project.description ?? 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project.prdVersionCount ?? 0} version{(project.prdVersionCount ?? 0) !== 1 ? 's' : ''}
                          {' · '}
                          {project.questionHistoryCount ?? 0} decisions
                        </p>
                      </div>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t('common.open')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(next: boolean) => {
          setShowCreate(next)
          if (!next && templateActive) {
            clearTemplate()
            resetCreateForm()
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t('projects.dialogNewTitle')}</DialogTitle>
            <DialogDescription>{t('projects.dialogNewDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templateLoading ? (
              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {tp('templatePicker.loading', 'Loading template…')}
              </div>
            ) : null}
            {selectedTemplate ? (
              <div className="flex items-start gap-2 rounded-md border bg-primary/5 px-3 py-2">
                <LayoutGrid className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {tp('templatePicker.label', 'Using template')}: {selectedTemplate.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tp(
                      'templatePicker.journeyLocked',
                      'Journey mode is locked to the template’s recommendation. PRD seed is pre-filled — review and refine inside the workspace.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearTemplate}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={tp('templatePicker.clear', 'Clear template')}
                  title={tp('templatePicker.clear', 'Clear template')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="project-name">{t('projects.projectName')}</Label>
              <Input
                id="project-name"
                placeholder={t('projects.projectNamePlaceholder')}
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">{t('projects.projectDescriptionOptional')}</Label>
              <Textarea
                id="project-desc"
                placeholder={t('projects.projectDescriptionPlaceholder')}
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-3">
              <Label>{t('projects.journeyModeLabel')}</Label>
              {templateActive ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {newJourneyMode}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {tp('templatePicker.journeyLockedShort', 'Set by template')}
                  </span>
                </div>
              ) : (
                <RadioGroup
                  value={newJourneyMode}
                  onValueChange={(value) => setNewJourneyMode(value as JourneyMode)}
                  className="gap-3"
                >
                  <label
                    htmlFor="journey-standard"
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="standard" id="journey-standard" className="mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">{t('projects.journeyModeStandard')}</span>
                      <p className="text-xs text-muted-foreground">{t('projects.journeyModeStandardHint')}</p>
                    </div>
                  </label>
                  <label
                    htmlFor="journey-express"
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="express" id="journey-express" className="mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">{t('projects.journeyModeExpress')}</span>
                      <p className="text-xs text-muted-foreground">{t('projects.journeyModeExpressHint')}</p>
                    </div>
                  </label>
                </RadioGroup>
              )}
            </div>
            {templateActive ? null : (
            <Collapsible open={importOpen} onOpenChange={setImportOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between min-h-11">
                  {t('projects.importPrdToggle')}
                  <span className="text-xs text-muted-foreground">
                    {importOpen ? t('common.close') : t('projects.importPrdOptional')}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <p className="text-xs text-muted-foreground">{t('projects.importPrdHint')}</p>
                <div className="space-y-2">
                  <Label htmlFor="import-paste">{t('projects.importPasteLabel')}</Label>
                  <Textarea
                    id="import-paste"
                    value={importPaste}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setImportPaste(e.target.value)
                      if (e.target.value.trim()) setImportFile(null)
                    }}
                    rows={6}
                    className="resize-y font-mono text-sm"
                    placeholder={t('projects.importPastePlaceholder')}
                    disabled={importFile != null}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-file">{t('projects.importFileLabel')}</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".md,.txt,text/plain,text/markdown"
                    disabled={importPaste.trim().length > 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0] ?? null
                      setImportFile(file)
                      if (file) setImportPaste('')
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('projects.importFileHint').replace(
                      '{maxMb}',
                      String(Math.floor(IMPORTED_PRD_MAX_BYTES / (1024 * 1024)))
                    )}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{t('projects.importNoCredits')}</p>
              </CollapsibleContent>
            </Collapsible>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false)
                  resetCreateForm()
                  if (templateActive) clearTemplate()
                }}
                className="min-h-11 w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate} loading={creating} className="min-h-11 w-full sm:w-auto">
                {t('projects.createProject')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
