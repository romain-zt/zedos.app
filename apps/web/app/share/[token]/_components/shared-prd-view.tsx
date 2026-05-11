'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, FileText, AlertCircle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import {
  AnonymousSharedPrdResponseSchema,
  type AnonymousSharedPrdResponse,
} from '@repo/contracts/share/anonymous-read'

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function readSections(content: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!content) return []
  const raw = content.sections
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is Record<string, unknown> => isRecord(x))
}

function readString(rec: Record<string, unknown>, key: string): string | undefined {
  const v = rec[key]
  return typeof v === 'string' ? v : undefined
}

function shareFetchErrorMessage(status: number, bodyError: unknown): string {
  if (status === 400) return 'That link is not valid.'
  if (status === 404) return 'This shared document is not available.'
  if (typeof bodyError === 'string' && bodyError.length > 0 && bodyError.length < 200) {
    return bodyError
  }
  return 'Something went wrong. Try again in a moment.'
}

export function SharedPrdView({ token }: { token: string }) {
  const [data, setData] = useState<AnonymousSharedPrdResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedPrd = async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`)
        if (!res.ok) {
          let bodyError: unknown
          try {
            const errJson = await res.json()
            bodyError = errJson && typeof errJson === 'object' && errJson !== null && 'error' in errJson
              ? (errJson as { error?: unknown }).error
              : undefined
          } catch {
            bodyError = undefined
          }
          setError(shareFetchErrorMessage(res.status, bodyError))
          return
        }
        const raw = await res.json()
        const parsed = AnonymousSharedPrdResponseSchema.safeParse(raw)
        if (!parsed.success) {
          setError('Something went wrong. Try again in a moment.')
          return
        }
        setData(parsed.data)
      } catch {
        setError('Something went wrong. Try again in a moment.')
      } finally {
        setLoading(false)
      }
    }
    fetchSharedPrd()
  }, [token])

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-amber-600 bg-amber-50'
      case 'low':
        return 'text-red-500 bg-red-50'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-3.5 w-3.5" />
      case 'medium':
        return <CircleDot className="h-3.5 w-3.5" />
      case 'low':
        return <AlertCircle className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">Loading shared document…</p>
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" aria-hidden />
            <h2 className="font-display text-lg font-semibold mb-1">Not available</h2>
            <p className="text-sm text-muted-foreground">{error ?? 'This shared document is not available.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const content = data.content
  const sections = readSections(content)

  const titleFallback = 'Shared product brief'
  const docTitle =
    (content && readString(content, 'title')) ||
    titleFallback

  const versionSummary = content ? readString(content, 'version_summary') : undefined
  const statusLabel = data.status.slice(0, 1).toUpperCase() + data.status.slice(1)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-h-11">
            <div className="h-7 w-7 shrink-0 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" aria-hidden />
            </div>
            <span className="font-display text-sm font-bold">Zedos</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Read-only
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <FadeIn>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{docTitle}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <Badge variant="outline">Version {data.versionNumber}</Badge>
              <Badge variant="outline">{statusLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                Saved {data.createdAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
            {versionSummary ? <p className="mt-3 text-sm text-muted-foreground">{versionSummary}</p> : null}
          </div>
        </FadeIn>

        <Stagger staggerDelay={0.05}>
          <div className="space-y-3">
            {sections.map((section, i) => {
              const conf = readString(section, 'confidence') ?? ''
              return (
                <StaggerItem key={readString(section, 'id') ?? i}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base font-display">
                          {readString(section, 'title') ?? 'Section'}
                        </CardTitle>
                        {conf ? (
                          <Badge
                            variant="secondary"
                            className={`text-xs gap-1 ${getConfidenceColor(conf)}`}
                          >
                            {getConfidenceIcon(conf)}
                            {conf}
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {readString(section, 'content') ?? 'No content'}
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )
            })}
          </div>
        </Stagger>

        {sections.length === 0 && content ? (
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-center pt-6 sm:pt-8 pb-4">
          <p className="text-xs text-muted-foreground">Generated with Zedos · AI-guided product clarification</p>
        </div>
      </div>
    </div>
  )
}
