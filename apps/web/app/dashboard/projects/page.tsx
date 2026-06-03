'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectWithCounts } from '@domain/project/project-repository'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { JourneyMode } from '@repo/contracts/project/project-contracts'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Plus, FileText, ArrowRight, FolderOpen, MoreVertical, Trash2, Pencil,
  AlertTriangle, RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { useI18n } from '@/src/i18n'

export default function ProjectsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newJourneyMode, setNewJourneyMode] = useState<JourneyMode>('standard')
  const [creating, setCreating] = useState(false)

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

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t('projects.nameRequired'))
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          journeyMode: newJourneyMode,
        }),
      })
      if (res?.ok) {
        const project = await res.json()
        toast.success(t('projects.created'))
        setShowCreate(false)
        setNewName('')
        setNewDesc('')
        setNewJourneyMode('standard')
        router.push(`/dashboard/projects/${project?.id}`)
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t('projects.dialogNewTitle')}</DialogTitle>
            <DialogDescription>{t('projects.dialogNewDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
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
