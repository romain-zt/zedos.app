'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@repo/auth'
import type { ProjectWithCounts } from '@domain/project/project-repository'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFERRED_ROADMAP_PLACEHOLDERS } from './_lib/deferred-roadmap-placeholders'
import { FolderOpen, Plus, FileText, ArrowRight, Sparkles, Construction, Info } from 'lucide-react'
import { FadeIn, SlideIn, Stagger, StaggerItem } from '@/components/ui/animate'

export default function DashboardPage() {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await fetch('/api/projects')
        if (projRes?.ok) {
          const projData: unknown = await projRes.json()
          setProjects(Array.isArray(projData) ? (projData as ProjectWithCounts[]) : [])
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const userName = session?.user?.name?.split(' ')?.[0] ?? 'there'
  const totalPrdVersions = projects.reduce((acc, p) => acc + (p.prdVersionCount ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <FadeIn>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Hey {userName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your home base for turning ideas into a structured PRD. Everything else on the roadmap is labeled honestly below.
          </p>
        </div>
      </FadeIn>

      <FadeIn>
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-base">Zedos v0 is the PRD slice</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Projects, clarification, and PRD versions are in scope today. The long-term founder pipeline is visible, but only
            as &quot;under construction&quot; until those slices ship.
          </AlertDescription>
        </Alert>
      </FadeIn>

      {/* Quick stats — PRD path only (no credit hero; credits live under Credit FA surfaces) */}
      <Stagger staggerDelay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StaggerItem>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow min-h-[44px]"
              onClick={() => router.push('/dashboard/projects')}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 min-h-11 min-w-11 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">{loading ? '...' : projects.length}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow min-h-[44px]"
              onClick={() => router.push('/dashboard/projects')}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 min-h-11 min-w-11 shrink-0 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">{loading ? '...' : totalPrdVersions}</p>
                    <p className="text-sm text-muted-foreground">PRD versions (all projects)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </Stagger>

      <SlideIn from="bottom">
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-display">Beyond the PRD — under construction</CardTitle>
            </div>
            <CardDescription>
              These directions are on the roadmap, not in v0. They are shown so you know what we are not shipping yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {DEFERRED_ROADMAP_PLACEHOLDERS.map((item) => (
                <li key={item.id} className="list-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        role="note"
                        className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-4 py-3 text-sm min-h-[44px] cursor-help outline-none touch-manipulation hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`${item.title} — under construction, not available in v0`}
                      >
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-muted-foreground mt-0.5">{item.summary}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Construction className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Under construction
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[min(280px,calc(100vw-2rem))] text-xs sm:text-sm">
                      {item.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Recent projects or CTA */}
      <SlideIn from="bottom">
        {projects.length === 0 && !loading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-center">Start your first project</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6 text-sm sm:text-base">
                Open Projects to capture your idea and run guided clarification through to a PRD.
              </p>
              <Button
                className="min-h-11 min-w-[44px]"
                onClick={() => router.push('/dashboard/projects')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Go to Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl font-semibold">Recent projects</h2>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 w-full sm:w-auto justify-center sm:justify-start"
                onClick={() => router.push('/dashboard/projects')}
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3">
              {projects.slice(0, 5).map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.name ?? 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.prdVersionCount ?? 0} version
                          {(project.prdVersionCount ?? 0) !== 1 ? 's' : ''}
                          {' · '}
                          {project.questionHistoryCount ?? 0} decisions
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </SlideIn>
    </div>
  )
}
