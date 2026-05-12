'use client'

import { useState } from 'react'
import { useSession, signOut } from '@repo/auth'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CreditBadge } from '@/components/credit-badge'
import { DEFERRED_ROADMAP_PLACEHOLDERS } from '../_lib/deferred-roadmap-placeholders'
import type { DeferredRoadmapPlaceholder } from '../_lib/deferred-roadmap-placeholders'
import { RoadmapItemModal } from './roadmap-item-modal'
import { ProjectSwitcher } from './project-switcher'
import {
  LayoutDashboard,
  FolderOpen,
  Coins,
  LogOut,
  PanelLeft,
  Zap,
  Construction,
  GitBranch,
  BarChart3,
  X,
  Layers,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/dashboard/credits', label: 'Credits', icon: Coins },
]

const PLACEHOLDER_ICONS: Record<string, LucideIcon> = {
  'services-feature-split': GitBranch,
  'test-first-workflows': BarChart3,
  'delivery': Zap,
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roadmapModal, setRoadmapModal] = useState<DeferredRoadmapPlaceholder | null>(null)

  const userName = session?.user?.name ?? 'Founder'
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? 'F'
  const workspaceProjectId = pathname?.match(/^\/dashboard\/projects\/([^/]+)/)?.[1] ?? null

  return (
    <div className="min-h-screen bg-background">
      <RoadmapItemModal item={roadmapModal} onClose={() => setRoadmapModal(null)} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">Zedos</span>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              return (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}

            {workspaceProjectId && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    This project
                  </p>
                </div>
                {([
                  { href: `/dashboard/projects/${workspaceProjectId}`, label: 'Workspace', icon: FileText },
                  { href: `/dashboard/projects/${workspaceProjectId}/feature-split`, label: 'Feature split', icon: Layers },
                  { href: `/dashboard/projects/${workspaceProjectId}/user-stories`, label: 'User stories', icon: GitBranch },
                ] as const).map((sub) => {
                  const isSubActive = pathname === sub.href || pathname?.startsWith(`${sub.href}/`)
                  return (
                    <button
                      key={sub.href}
                      type="button"
                      onClick={() => { router.push(sub.href); setSidebarOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isSubActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <sub.icon className="h-4 w-4 shrink-0" />
                      {sub.label}
                    </button>
                  )
                })}
              </>
            )}

            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Coming in v1
              </p>
            </div>
            {DEFERRED_ROADMAP_PLACEHOLDERS.map((item) => {
              const Icon = PLACEHOLDER_ICONS[item.id] ?? Construction
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoadmapModal(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground',
                    'border border-dashed border-muted-foreground/25 bg-muted/20',
                    'cursor-pointer text-left min-h-11 touch-manipulation',
                    'hover:bg-muted/35 hover:text-foreground hover:border-muted-foreground/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'transition-colors'
                  )}
                  aria-label={`${item.title} — coming in v1, tap to learn more`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="flex-1 min-w-0 leading-snug">{item.title}</span>
                  <Construction className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </button>
              )
            })}
          </nav>

          {/* User */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email ?? ''}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          {workspaceProjectId ? (
            <div className="min-w-0 flex-1 flex justify-start">
              <ProjectSwitcher activeProjectId={workspaceProjectId} />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <CreditBadge />
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
