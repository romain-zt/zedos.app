'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectWithCounts } from '@domain/project/project-repository'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, FolderOpen, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/src/i18n'

type ProjectSwitcherProps = {
  activeProjectId: string
}

export function ProjectSwitcher({ activeProjectId }: ProjectSwitcherProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

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

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects, activeProjectId])

  const current = projects.find((p) => p.id === activeProjectId)
  const label = current?.name ?? (loading ? t('common.loading') : t('projectSwitcher.project'))

  if (listError) {
    return (
      <div className="flex min-h-11 max-w-[min(100vw-8rem,20rem)] flex-wrap items-center gap-2 sm:max-w-xs">
        <p className="text-xs text-destructive sm:text-sm leading-snug">{listError}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 min-h-11 shrink-0 gap-1.5 px-3 touch-manipulation"
          onClick={() => void fetchProjects()}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-11 min-h-11 max-w-[min(100vw-8rem,18rem)] touch-manipulation justify-between gap-2 px-3 font-normal',
            'sm:max-w-xs'
          )}
          disabled={loading && projects.length === 0}
          aria-label={t('projectSwitcher.switchProject')}
        >
          <span className="flex min-w-0 items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate text-left text-sm">{label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(calc(100vw-2rem),18rem)] sm:w-72">
        {loading && projects.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">{t('projectSwitcher.loadingProjects')}</div>
        ) : projects.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">{t('projectSwitcher.noProjectsYet')}</div>
        ) : (
          projects.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className={cn(
                'min-h-11 cursor-pointer touch-manipulation',
                p.id === activeProjectId && 'bg-primary/10 text-primary'
              )}
              onClick={() => {
                if (p.id !== activeProjectId) {
                  router.push(`/dashboard/projects/${p.id}`)
                }
              }}
            >
              <span className="truncate">{p.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
