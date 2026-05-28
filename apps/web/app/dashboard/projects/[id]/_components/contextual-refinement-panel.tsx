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
import { Send, HelpCircle, Loader2, RefreshCw, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useOwnerMilestonePrompt } from './owner-milestone-prompt'
import {
  ChatMessageToolbar,
  copyTextToClipboard,
  toastCopied,
  toastCopyFailed,
} from './chat-message-toolbar'
import { messagesToClientThread } from './clarify-thread-utils'

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
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

function newMessageId(): string {
  return crypto.randomUUID()
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
  const { notifyMilestone } = useOwnerMilestonePrompt()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [creditsBlocked, setCreditsBlocked] = useState(false)
  const [hasAiResponse, setHasAiResponse] = useState(false)
  const [updatingPrd, setUpdatingPrd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const busy = streaming || creditsBlocked || updatingPrd

  useEffect(() => {
    if (isOpen) {
      setInput('')
      setMessages([])
      setStreaming(false)
      setCreditsBlocked(false)
      setHasAiResponse(false)
      setUpdatingPrd(false)
      setEditingId(null)
      setEditDraft('')
    }
  }, [isOpen, contextLabel, prdVersionId])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const requestAssistantReply = useCallback(
    async (thread: StreamMessage[], latestUserText: string) => {
      const prefixed = buildContextualClarifyBody(contextLabel, latestUserText, prdVersionId).message

      setStreaming(true)

      try {
        const res = await fetch(`/api/projects/${projectId}/clarify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prefixed,
            prdVersionId,
            decisionResponse: null,
            clientThread: messagesToClientThread(thread),
            refinementContextLabel: contextLabel,
          }),
        })

        if (res.status === 402) {
          const data = (await res.json().catch(() => ({}))) as { message?: string }
          toast.error(data?.message ?? 'Insufficient credits')
          setCreditsBlocked(true)
          return
        }

        if (res.status === 401) {
          toast.error('You need to be signed in to refine')
          return
        }

        if (!res.ok) {
          toast.error('Failed to get AI response')
          return
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let partialRead = ''
        let assistantContent = ''
        let streamCompleted = false

        const appendAssistant = (content: string, reasoning?: string) => {
          setMessages((prev) => [
            ...prev,
            { id: newMessageId(), role: 'assistant', content, reasoning },
          ])
          setHasAiResponse(true)
        }

        const handleSseLine = (line: string) => {
          const reduced = reduceClarifySseDataLine(line, assistantContent)
          assistantContent = reduced.nextAssistantContent
          if (reduced.streamError) {
            toast.error(reduced.streamError)
            return
          }
          if (reduced.finalMessage != null) {
            streamCompleted = true
            appendAssistant(reduced.finalMessage, reduced.finalReasoning)
          }
        }

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          partialRead += decoder.decode(value, { stream: true })
          const lines = partialRead.split('\n')
          partialRead = lines.pop() ?? ''

          for (const line of lines) {
            handleSseLine(line)
          }
        }

        if (partialRead.trim()) {
          handleSseLine(partialRead.trim())
        }

        if (!streamCompleted && assistantContent.trim()) {
          let parsed: { message?: string; reasoning?: string }
          try {
            parsed = JSON.parse(assistantContent) as { message?: string; reasoning?: string }
          } catch {
            parsed = { message: assistantContent }
          }
          appendAssistant(parsed.message ?? assistantContent, parsed.reasoning)
        }
      } catch {
        toast.error('Failed to get AI response')
      } finally {
        setStreaming(false)
      }
    },
    [contextLabel, prdVersionId, projectId]
  )

  const sendNewMessage = async () => {
    const text = input.trim()
    if (!text || busy) return

    const userMsg: StreamMessage = { id: newMessageId(), role: 'user', content: text }
    const thread = [...messages, userMsg]
    setMessages(thread)
    setInput('')
    setEditingId(null)

    await requestAssistantReply(thread, text)
  }

  const startEdit = (msg: StreamMessage) => {
    if (busy) return
    setEditingId(msg.id)
    setEditDraft(msg.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const submitEdit = async (messageId: string) => {
    const text = editDraft.trim()
    if (!text || busy) return

    const index = messages.findIndex((m) => m.id === messageId)
    if (index < 0 || messages[index]?.role !== 'user') return

    const truncated = messages.slice(0, index)
    const updatedUser: StreamMessage = { ...messages[index], content: text }
    const thread = [...truncated, updatedUser]

    setMessages(thread)
    setEditingId(null)
    setEditDraft('')
    setHasAiResponse(thread.some((m) => m.role === 'assistant'))

    await requestAssistantReply(thread, text)
  }

  const regenerateAssistant = async (assistantId: string) => {
    if (busy) return

    const assistantIndex = messages.findIndex((m) => m.id === assistantId)
    if (assistantIndex < 0 || messages[assistantIndex]?.role !== 'assistant') return

    let userIndex = assistantIndex - 1
    while (userIndex >= 0 && messages[userIndex]?.role !== 'user') {
      userIndex -= 1
    }
    if (userIndex < 0) return

    const userText = messages[userIndex].content
    const thread = messages.slice(0, assistantIndex)

    setMessages(thread)
    setHasAiResponse(thread.some((m) => m.role === 'assistant'))

    await requestAssistantReply(thread, userText)
  }

  const handleCopy = async (text: string) => {
    const ok = await copyTextToClipboard(text)
    if (ok) toastCopied()
    else toastCopyFailed()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendNewMessage()
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
              notifyMilestone({
                projectId,
                milestoneType: 'prd_updated',
                ...(prdVersionId ? { prdVersionId } : {}),
              })
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
            Copier, modifier ou régénérer comme dans ChatGPT. Puis mettez à jour le PRD.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 py-3">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="group space-y-1">
                {m.role === 'user' ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-start gap-1 max-w-full">
                      <ChatMessageToolbar
                        role="user"
                        disabled={busy}
                        onCopy={() => void handleCopy(m.content)}
                        onEdit={() => startEdit(m)}
                      />
                      {editingId === m.id ? (
                        <div className="flex-1 space-y-2 min-w-0">
                          <Textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={3}
                            className="resize-none text-sm min-h-[72px]"
                            disabled={busy}
                            aria-label="Modifier le message"
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              disabled={busy}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Annuler
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void submitEdit(m.id)}
                              disabled={!editDraft.trim() || busy}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Renvoyer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-primary text-primary-foreground text-sm px-3 py-2 whitespace-pre-wrap max-w-[85%]">
                          {m.content}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {m.reasoning ? (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>{m.reasoning}</span>
                      </div>
                    ) : null}
                    <div className="flex items-start gap-1">
                      <div className="flex-1 rounded-lg border bg-card text-sm px-3 py-2 whitespace-pre-wrap min-w-0">
                        {m.content}
                      </div>
                      <ChatMessageToolbar
                        role="assistant"
                        disabled={busy}
                        onCopy={() =>
                          void handleCopy(
                            m.reasoning ? `${m.content}\n\n${m.reasoning}` : m.content
                          )
                        }
                        onRegenerate={() => void regenerateAssistant(m.id)}
                      />
                    </div>
                  </div>
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

        <div className="shrink-0 p-4 border-t space-y-2 bg-background">
          {hasAiResponse ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full"
              onClick={() => void handleUpdatePrd()}
              disabled={busy}
            >
              {updatingPrd ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {updatingPrd ? 'Updating PRD…' : 'Update PRD with this thread'}
            </Button>
          ) : null}
          <Textarea
            placeholder={
              hasAiResponse ? 'Répondre à l’assistant…' : 'Que souhaitez-vous clarifier ?'
            }
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none text-base min-h-[88px]"
            disabled={busy}
            aria-label="Refinement message"
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" className="min-h-11" onClick={handleClose} disabled={updatingPrd}>
              Close
            </Button>
            <Button
              type="button"
              className="min-h-11 min-w-[44px]"
              onClick={() => void sendNewMessage()}
              disabled={!input.trim() || busy}
              aria-label="Send refinement"
            >
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
