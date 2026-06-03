'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, FileText, AlertCircle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import type { GeneratePrdSection } from '@repo/contracts/ai/generate-prd-stream'
import type { PrdVersionContent } from '@repo/contracts/prd'
import {
  AnonymousSharedPrdResponseSchema,
  type AnonymousSharedPrdResponse,
} from '@repo/contracts/share/anonymous-read'
import { SharePasswordRequiredResponseSchema } from '@repo/contracts/share/access'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/src/i18n'
import { ExpressPrdDisclaimer } from '@/components/express-prd-disclaimer'

function isGeneratedPrdContent(
  content: PrdVersionContent,
): content is PrdVersionContent & { title: string; version_summary: string; sections: GeneratePrdSection[] } {
  return 'title' in content && 'sections' in content && Array.isArray(content.sections)
}

function readSections(content: PrdVersionContent | null): GeneratePrdSection[] {
  if (!content || !isGeneratedPrdContent(content)) return []
  return content.sections
}

function docTitleFromContent(content: PrdVersionContent | null): string {
  if (!content) return 'Shared product brief'
  if (isGeneratedPrdContent(content)) return content.title
  if ('summary' in content && content.summary.trim()) return content.summary
  if ('source' in content && content.source.trim()) return content.source
  return 'Shared product brief'
}

function versionSummaryFromContent(content: PrdVersionContent | null): string | undefined {
  if (!content || !isGeneratedPrdContent(content)) return undefined
  const summary = content.version_summary.trim()
  return summary.length > 0 ? summary : undefined
}

export function SharedPrdView({ token }: { token: string }) {
  const { tp } = useI18n()
  const [data, setData] = useState<AnonymousSharedPrdResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  const fetchSharedPrd = async () => {
    setLoading(true)
    setError(null)
    try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`)
        if (res.status === 403) {
          const errJson = await res.json().catch(() => ({}))
          const gate = SharePasswordRequiredResponseSchema.safeParse(errJson)
          if (gate.success) {
            setNeedsPassword(true)
            return
          }
        }
        if (!res.ok) {
          let bodyError: unknown
          try {
            const errJson = await res.json()
            bodyError = errJson.error
          } catch {
            bodyError = undefined
          }
          if (res.status === 400) {
            setError(tp('invalidLink', 'That link is not valid.'))
          } else if (res.status === 404) {
            setError(tp('notAvailableDescription', 'This shared document is not available.'))
          } else if (typeof bodyError === 'string' && bodyError.length > 0 && bodyError.length < 200) {
            setError(bodyError)
          } else {
            setError(tp('somethingWentWrongTryAgain', 'Something went wrong. Try again in a moment.'))
          }
          return
        }
        const raw: unknown = await res.json()
        const parsed = AnonymousSharedPrdResponseSchema.safeParse(raw)
        if (!parsed.success) {
          setError(tp('displayError', 'This shared document could not be displayed.'))
          return
        }
        setData(parsed.data)
      } catch {
        setError(tp('somethingWentWrongTryAgain', 'Something went wrong. Try again in a moment.'))
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    void fetchSharedPrd()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when token changes
  }, [token])

  const handleUnlock = async () => {
    setUnlocking(true)
    setError(null)
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(token)}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(res.status === 401 ? tp('wrongPassword', 'Incorrect password.') : tp('accessDenied', 'Access denied.'))
        return
      }
      setNeedsPassword(false)
      await fetchSharedPrd()
    } catch {
      setError(tp('somethingWentWrongTryAgain', 'Something went wrong. Try again in a moment.'))
    } finally {
      setUnlocking(false)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-3 w-3" />
      case 'medium':
        return <CircleDot className="h-3 w-3" />
      case 'low':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground text-center">{tp('loadingSharedDocument', 'Loading shared document…')}</p>
        <span className="sr-only">{tp('loading', 'Loading')}</span>
      </div>
    )
  }

  if (needsPassword && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 space-y-4">
            <h2 className="font-display text-lg font-semibold">{tp('protectedTitle', 'Protected document')}</h2>
            <p className="text-sm text-muted-foreground">{tp('protectedDescription', 'Enter the password provided by the owner.')}</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tp('passwordPlaceholder', 'Password')}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => void handleUnlock()} disabled={unlocking || !password}>
              {unlocking ? tp('verifying', 'Verifying…') : tp('access', 'Access')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" aria-hidden />
            <h2 className="font-display text-lg font-semibold mb-1">{tp('notAvailable', 'Not available')}</h2>
            <p className="text-sm text-muted-foreground">{error ?? tp('notAvailableDescription', 'This shared document is not available.')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const content = data.content
  const sections = readSections(content)
  const docTitle = docTitleFromContent(content)
  const versionSummary = versionSummaryFromContent(content)
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
            {tp('readOnly', 'Read-only')}
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <FadeIn>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{docTitle}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <Badge variant="outline">{tp('version', 'Version')} {data.versionNumber}</Badge>
              <Badge variant="outline">{statusLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                {tp('saved', 'Saved')} {data.createdAt.toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
            {versionSummary ? <p className="mt-3 text-sm text-muted-foreground">{versionSummary}</p> : null}
          </div>
        </FadeIn>

        {data.deliverableKind === 'express' ? <ExpressPrdDisclaimer /> : null}

        <Stagger staggerDelay={0.05}>
          <div className="space-y-3">
            {sections.map((section, i) => {
              const conf = section.confidence
              return (
                <StaggerItem key={section.id ?? i}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base font-display">{section.title}</CardTitle>
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
                        {section.content.trim() ? section.content : tp('noContent', 'No content')}
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
          <p className="text-xs text-muted-foreground">{tp('footer', 'Generated with Zedos · AI-guided product clarification')}</p>
        </div>
      </div>
    </div>
  )
}
