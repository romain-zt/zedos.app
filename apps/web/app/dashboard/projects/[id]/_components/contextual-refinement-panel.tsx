'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, HelpCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

/** Exported for unit tests — matches POST /clarify body shape (no decisionResponse). */
export function buildContextualClarifyBody(
  contextLabel: string,
  userText: string,
  prdVersionId: string | null
) {
  return {
    message: `Refine [${contextLabel}]: ${userText}`,
    prdVersionId,
  }
}

export type StreamMessage = {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

/** Parse one SSE `data: {...}` line; returns updated assistant buffer text + optional final parsed fields. */
export function reduceClarifySseDataLine(
  line: string,
  assistantContent: string
): {
  nextAssistantContent: string
  finalMessage?: string
  finalReasoning?: string
  streamError?: string
} {
  if (!line.startsWith('data: ')) {
    return { nextAssistantContent: assistantContent }
  }
  const data = line.slice(6)
  try {
    const parsed = JSON.parse(data) as {
      status?: string
      partial?: string
      result?: string
      message?: string
    }
    if (parsed?.status === 'processing') {
      return {
        nextAssistantContent: assistantContent + (parsed.partial ?? ''),
      }
    }
    if (parsed?.status === 'completed') {
      const raw = parsed.result ?? assistantContent
      let json: { message?: string; reasoning?: string } | null = null
      try {
        json = JSON.parse(raw) as { message?: string; reasoning?: string }
      } catch {
        json = { message: raw }
      }
      return {
        nextAssistantContent: raw,
        finalMessage: json?.message ?? raw,
        finalReasoning: json?.reasoning,
      }
    }
    if (parsed?.status === 'error') {
      return {
        nextAssistantContent: assistantContent,
        streamError: parsed?.message ?? 'AI error',
      }
    }
  } catch {
    /* ignore malformed chunk */
  }
  return { nextAssistantContent: assistantContent }
}

export interface ContextualRefinementPanelProps {
  projectId: string
  prdVersionId: string | null
  contextLabel: string
  isOpen: boolean
  onClose: () => void
  onPrdUpdated?: () => void
}

export function ContextualRefinementPanel({
  projectId,
  prdVersionId,
  contextLabel,
  isOpen,
  onClose,
  onPrdUpdated,
}: ContextualRefinementPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [creditsBlocked, setCreditsBlocked] = useState(false)
  const [hasAiResponse, setHasAiResponse] = useState(false)
  const [updatingPrd, setUpdatingPrd] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setInput('')
      setMessages([])
      setStreaming(false)
      setCreditsBlocked(false)
      setHasAiResponse(false)
      setUpdatingPrd(false)
    }
  }, [isOpen, contextLabel, prdVersionId])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming || creditsBlocked) return

    const body = buildContextualClarifyBody(contextLabel, text, prdVersionId)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: body.message,
          prdVersionId: body.prdVersionId,
          decisionResponse: null,
        }),
      })

      if (res.status === 402) {
        const data = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(data?.message ?? 'Insufficient credits')
        setCreditsBlocked(true)
        setStreaming(false)
        return
      }

      if (res.status === 401) {
        toast.error('You need to be signed in to refine')
        setStreaming(false)
        return
      }

      if (!res.ok) {
        toast.error('Failed to get AI response')
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        const lines = partialRead.split('\n')
        partialRead = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          try {
            const parsed = JSON.parse(raw) as {
              status?: string
              partial?: string
              result?: string
              message?: string
            }
            if (parsed?.status === 'processing') {
              assistantContent += parsed?.partial ?? ''
            } else if (parsed?.status === 'completed') {
              assistantContent = parsed?.result ?? assistantContent
              let parsedResult: { message?: string; reasoning?: string } | null = null
              try {
                parsedResult = JSON.parse(assistantContent) as { message?: string; reasoning?: string }
              } catch {
                parsedResult = { message: assistantContent }
              }
              setMessages((prev) => {
                const updated = [...prev]
                if (updated.length > 0 && updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: parsedResult?.message ?? assistantContent,
                    reasoning: parsedResult?.reasoning,
                  }
                }
                return updated
              })
              setHasAiResponse(true)
            } else if (parsed?.status === 'error') {
              toast.error(parsed?.message ?? 'AI error')
            }
          } catch {
            /* ignore */
          }
        }

        setMessages((prev) => {
          const updated = [...prev]
          if (updated.length > 0 && updated[updated.length - 1]?.role === 'assistant') {
            try {
              const partial = JSON.parse(assistantContent) as {
                message?: string
                reasoning?: string
              }
              updated[updated.length - 1] = {
                role: 'assistant',
                content: partial?.message ?? assistantContent.slice(0, 200),
                reasoning: partial?.reasoning,
              }
            } catch {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: assistantContent.slice(0, 200) + (assistantContent.length > 200 ? '...' : ''),
              }
            }
          }
          return updated
        })
      }
    } catch {
      toast.error('Failed to get AI response')
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const handleUpdatePrd = async () => {
    setUpdatingPrd(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (res.status === 402) {
        const data = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(data?.message ?? 'Insufficient credits to update PRD')
        return
      }

      if (!res.ok) {
        toast.error('Failed to update PRD')
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partial = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        partial += decoder.decode(value, { stream: true })
        const lines = partial.split('\n')
        partial = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6)) as { status?: string }
            if (parsed?.status === 'completed') {
              toast.success('PRD updated')
              onPrdUpdated?.()
              onClose()
              return
            }
            if (parsed?.status === 'error') {
              toast.error('PRD update failed')
              return
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      toast.error('Failed to update PRD')
    } finally {
      setUpdatingPrd(false)
    }
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-4 pb-2 pr-12 text-left border-b space-y-1">
          <SheetTitle className="font-display text-base leading-tight line-clamp-2">
            Refine: {contextLabel}
          </SheetTitle>
          <SheetDescription className="text-xs">
            One clarification turn. Credits use the same rules as the Clarify tab.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-[200px] max-h-[45vh] px-4 py-3">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="space-y-2">
                {m.role === 'user' ? (
                  <div className="rounded-lg bg-primary text-primary-foreground text-sm px-3 py-2 whitespace-pre-wrap">
                    {m.content}
                  </div>
                ) : (
                  <>
                    {m.reasoning ? (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>{m.reasoning}</span>
                      </div>
                    ) : null}
                    <div className="rounded-lg border bg-card text-sm px-3 py-2 whitespace-pre-wrap">
                      {m.content || (streaming ? '…' : '')}
                    </div>
                  </>
                )}
              </div>
            ))}
            {streaming && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-2 mt-auto">
          {hasAiResponse ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 flex-1"
                onClick={handleClose}
                disabled={updatingPrd}
              >
                Close
              </Button>
              <Button
                type="button"
                className="min-h-11 flex-1"
                onClick={() => void handleUpdatePrd()}
                disabled={updatingPrd}
              >
                {updatingPrd ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{updatingPrd ? 'Updating…' : 'Update PRD'}</span>
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                placeholder="What would you like to change or clarify?"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="resize-none text-base min-h-[88px]"
                disabled={streaming || creditsBlocked}
                aria-label="Refinement message"
              />
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="min-h-11 min-w-[44px]"
                  onClick={() => void send()}
                  disabled={!input.trim() || streaming || creditsBlocked}
                  aria-label="Send refinement"
                >
                  <Send className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
