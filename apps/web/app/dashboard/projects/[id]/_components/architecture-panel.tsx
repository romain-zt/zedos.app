'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, ArrowRight, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import type { AdrDTO } from '@repo/contracts/adr/adr-contracts'
import { WorkspaceScoreResponseSchema } from '@repo/contracts/project/workspace-score'

interface ArchitecturePanelProps {
  projectId: string
  phase: string
  activePrdVersionId: string | null
  onOpenRefinement?: (payload: { label: string; prdVersionId: string | null }) => void
}

const ADR_SLOTS = [
  { number: 0, title: 'Architecture Style', description: 'Monolith vs modular vs microservices' },
  { number: 1, title: 'Monorepo Boundaries', description: 'Apps vs packages organization' },
  { number: 2, title: 'API Contracts', description: 'REST, tRPC, GraphQL choice' },
  { number: 3, title: 'Authentication', description: 'Auth provider and session model' },
  { number: 4, title: 'Database', description: 'ORM, migrations, schema ownership' },
  { number: 5, title: 'Testing Strategy', description: 'Test pyramid and CI gates' },
  { number: 6, title: 'Deployment', description: 'Hosting, envs, preview apps' },
  { number: 7, title: 'Observability', description: 'Logs, metrics, traces, errors' },
  { number: 8, title: 'Analytics', description: 'Event taxonomy and provider' },
  { number: 9, title: 'Logging/Monitoring', description: 'Structure, alerts, telemetry' },
  { number: 10, title: 'Wrapping Policy', description: 'No direct SDK calls; vendor-client packages' },
  { number: 11, title: 'Feature Flags', description: 'Config location and runtime eval' },
  { number: 12, title: 'Lifecycle/Marketing', description: 'Signup, activation, churn emails' },
  { number: 13, title: 'Legal/GDPR', description: 'Cookies, privacy, data export, retention' },
]

export function ArchitecturePanel({
  projectId,
  phase,
  activePrdVersionId,
  onOpenRefinement,
}: ArchitecturePanelProps) {
  const [adrs, setAdrs] = useState<AdrDTO[]>([])
  const [isLocked, setIsLocked] = useState(phase === 'intake')
  const [unlocking, setUnlocking] = useState(false)
  const [checking, setChecking] = useState(false)
  const [architectureScore, setArchitectureScore] = useState<number | null>(null)

  useEffect(() => {
    setIsLocked(phase === 'intake')
  }, [phase])

  useEffect(() => {
    const fetchAdrs = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/adrs`)
        if (res.ok) setAdrs(await res.json())
      } catch {}
    }
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/workspace-score`)
        if (!res.ok) return
        const raw: unknown = await res.json()
        const parsed = WorkspaceScoreResponseSchema.safeParse(raw)
        if (parsed.success) {
          setArchitectureScore(parsed.data.architecture.total.percentage)
        }
      } catch {}
    }
    fetchAdrs()
    fetchScore()
  }, [projectId])

  const handleCheckStability = async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/phase/check`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.message || 'PRD is not yet stable')
      }
    } catch (err) {
      toast.error('Failed to check stability')
    } finally {
      setChecking(false)
    }
  }

  const handleUnlock = async () => {
    setUnlocking(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/phase/unlock`, { method: 'POST' })
      if (res.ok) {
        await res.json()
        toast.success('Architecture phase unlocked!')
        setIsLocked(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to unlock')
      }
    } catch (err) {
      toast.error('Failed to unlock architecture phase')
    } finally {
      setUnlocking(false)
    }
  }

  if (isLocked) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-600" />
              <div>
                <CardTitle>Architecture Phase Locked</CardTitle>
                <CardDescription>Complete your PRD clarification first</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              The Architecture phase becomes available after you&apos;ve clarified and stabilized your product definition. This ensures all decisions are made with full context.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCheckStability} disabled={checking} variant="outline" size="sm">
                Check PRD Stability
              </Button>
              {!checking && (
                <Button onClick={handleUnlock} disabled={unlocking} size="sm">
                  Unlock Architecture <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalAdrs = ADR_SLOTS.length
  const completeAdrs = adrs.filter((a) => a.status === 'complete').length

  return (
    <div className="space-y-6">
      {architectureScore != null && (
        <Card>
          <CardHeader>
            <CardTitle>Score architecture</CardTitle>
            <CardDescription>PRD stable + ADR cœur complétés (formule workspace)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-purple-50 p-4">
              <div className="text-sm font-medium text-purple-900">Préparation architecture</div>
              <div className="text-2xl font-bold text-purple-600">{architectureScore}%</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Architectural Decisions</CardTitle>
              <CardDescription>
                {completeAdrs} of {totalAdrs} ADRs complete
              </CardDescription>
            </div>
            <Badge variant="default">
              {Math.round((completeAdrs / totalAdrs) * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ADR_SLOTS.map((slot) => {
              const adr = adrs.find((a) => a.adrNumber === slot.number)
              const isComplete = adr?.status === 'complete'
              const adrLabel = `ADR-${slot.number.toString().padStart(2, '0')}`
              return (
                <div
                  key={slot.number}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{`${adrLabel}: ${slot.title}`}</div>
                        <div className="text-xs text-gray-600">{slot.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenRefinement ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 sm:h-8 sm:w-8 text-muted-foreground"
                        aria-label={`Refine ${slot.title}`}
                        onClick={() =>
                          onOpenRefinement({
                            label: `ADR-${slot.number.toString().padStart(2, '0')}: ${slot.title}`,
                            prdVersionId: activePrdVersionId,
                          })
                        }
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Badge variant={isComplete ? 'default' : 'outline'}>
                      {isComplete ? 'Complete' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-medium text-blue-900">Coming Soon</div>
        <div className="text-xs text-blue-800">
          ADR authoring UI, AI-guided generation, feature areas, scope slicing, contracts, and repo export are coming in L3+
        </div>
      </div>
    </div>
  )
}
