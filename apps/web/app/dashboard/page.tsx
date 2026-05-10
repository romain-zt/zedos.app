'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Plus, FileText, Coins, ArrowRight, Sparkles } from 'lucide-react'
import { FadeIn, SlideIn, Stagger, StaggerItem } from '@/components/ui/animate'

export default function DashboardPage() {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, credRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/credits'),
        ])
        if (projRes?.ok) {
          const projData = await projRes.json()
          setProjects(projData ?? [])
        }
        if (credRes?.ok) {
          const credData = await credRes.json()
          setCredits(credData?.creditBalance ?? 0)
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <FadeIn>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Hey {userName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Clarify your product ideas and generate structured PRDs.
          </p>
        </div>
      </FadeIn>

      {/* Quick stats */}
      <Stagger staggerDelay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StaggerItem>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/projects')}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">{loading ? '...' : (projects?.length ?? 0)}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/projects')}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">
                      {loading ? '...' : (projects ?? []).reduce((acc: number, p: any) => acc + (p?._count?.prdVersions ?? 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">PRD Versions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/credits')}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">{credits !== null ? credits : '...'}</p>
                    <p className="text-sm text-muted-foreground">Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </Stagger>

      {/* Recent projects or CTA */}
      <SlideIn from="bottom">
        {(projects?.length ?? 0) === 0 && !loading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Start your first project</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Describe your product idea and let AI guide you through structured clarification to a complete PRD.
              </p>
              <Button onClick={() => router.push('/dashboard/projects')}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Recent Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projects')}>
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3">
              {(projects ?? []).slice(0, 5).map((project: any) => (
                <Card
                  key={project?.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/projects/${project?.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{project?.name ?? 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {project?._count?.prdVersions ?? 0} version{(project?._count?.prdVersions ?? 0) !== 1 ? 's' : ''}
                          {' · '}
                          {project?._count?.questionHistory ?? 0} decisions
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
