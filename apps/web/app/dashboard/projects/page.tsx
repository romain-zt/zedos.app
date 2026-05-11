'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Plus, FileText, ArrowRight, FolderOpen, MoreVertical, Trash2, Pencil,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res?.ok) {
        const data = await res.json()
        setProjects(data ?? [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Project name is required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      })
      if (res?.ok) {
        const project = await res.json()
        toast.success('Project created')
        setShowCreate(false)
        setNewName('')
        setNewDesc('')
        router.push(`/dashboard/projects/${project?.id}`)
      } else {
        const data = await res.json()
        toast.error(data?.error ?? 'Failed to create project')
      }
    } catch {
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project and all its PRDs? This cannot be undone.')) return
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success('Project deleted')
      fetchProjects()
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-0 space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Each project contains your product idea, clarification history, and PRD versions.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="w-full min-h-11 shrink-0 sm:w-auto sm:min-h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (projects?.length ?? 0) === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project to start the product clarification flow.
            </p>
            <Button onClick={() => setShowCreate(true)} className="min-h-11 w-full max-w-xs sm:min-h-10 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stagger staggerDelay={0.05}>
          <div className="grid gap-3">
            {(projects ?? []).map((project: any) => (
              <StaggerItem key={project?.id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/projects/${project?.id}`)}
                      className="flex-1 flex items-center gap-3 text-left min-h-11 py-1 sm:min-h-0"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project?.name ?? 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project?.description ?? 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project?.prdVersionCount ?? 0} version{(project?.prdVersionCount ?? 0) !== 1 ? 's' : ''}
                          {' · '}
                          {project?.questionHistoryCount ?? 0} decisions
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project?.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(project?.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            <DialogTitle className="font-display">New Project</DialogTitle>
            <DialogDescription>Describe the product idea you want to explore.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. TaskFlow, FitnessBuddy..."
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description (optional)</Label>
              <Textarea
                id="project-desc"
                placeholder="Briefly describe your product idea..."
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
                className="min-h-11 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={creating} className="min-h-11 w-full sm:w-auto">
                Create Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
