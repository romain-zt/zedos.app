'use client'

import { useState } from 'react'
import { useSession, signOut } from '@repo/auth'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CreditBadge } from '@/components/credit-badge'
import {
  LayoutDashboard,
  FolderOpen,
  Coins,
  Settings,
  LogOut,
  PanelLeft,
  Zap,
  Construction,
  FileText,
  GitBranch,
  Users,
  BarChart3,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/dashboard/credits', label: 'Credits', icon: Coins },
]

const UNDER_CONSTRUCTION = [
  { label: 'User Stories', icon: Users },
  { label: 'Services Split', icon: GitBranch },
  { label: 'Cursor Artifacts', icon: Zap },
  { label: 'Analytics', icon: BarChart3 },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userName = session?.user?.name ?? 'Founder'
  const userInitial = userName?.charAt(0)?.toUpperCase() ?? 'F'

  return (
    <div className="min-h-screen bg-background">
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
            {NAV_ITEMS.map((item: any) => {
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

            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Coming Soon</p>
            </div>
            {UNDER_CONSTRUCTION.map((item: any) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <Construction className="h-3 w-3 ml-auto" />
              </div>
            ))}
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
                onClick={() => signOut({ callbackUrl: '/login' })}
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
          <div className="flex-1" />
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
