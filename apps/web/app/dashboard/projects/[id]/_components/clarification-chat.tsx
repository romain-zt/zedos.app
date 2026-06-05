'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Send, Sparkles, FileText, Loader2,
  HelpCircle, Check, X,
} from 'lucide-react'
import {
  ChatMessageToolbar,
  copyTextToClipboard,
  toastCopied,
  toastCopyFailed,
} from './chat-message-toolbar'
import { messagesToClientThread } from './clarify-thread-utils'
import { DecisionCard } from './decision-card'
import { toast } from 'sonner'
import { MilestoneFeedbackModal } from '@/components/milestone-feedback-modal'
import {
  ClarifyDecisionUiSchema,
  type ClarifyDecisionUi,
  type ClarifyDecisionResponse,
} from '@repo/contracts/ai/decision-ui'
import { comingUpPrdSectionsFromAssistantParsed } from '@repo/contracts/questions/history'
import { useOwnerMilestonePrompt } from './owner-milestone-prompt'
import { useI18n } from '@/src/i18n'
import type { JourneyMode } from '@domain/project/project'
import { EXPRESS_MINIMUM_CLARIFY_SECTIONS } from '@repo/contracts/prd'
import { isExpressMinimumClarifyMet } from '@/lib/express-clarify-prompt'
import { normalizePrdSection, type ClarifyHistoryRow } from '@/lib/clarify-prompt'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import {
  captureClient,
  captureClientException,
} from '@infrastructure/analytics/posthog-client'
import { captureCreditsDepletedSurface } from '@infrastructure/analytics/credits-analytics-client'
import { ReadinessScoreBadge } from './readiness-score-badge'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  parsed?: Record<string, unknown>
  decisionResponse?: ClarifyDecisionResponse
}

function formatDecisionSelection(response: ClarifyDecisionResponse): string {
  switch (response.type) {
    case 'not_sure':
      return response.message
    case 'single_choice':
      return response.label ?? response.selected
    case 'multi_choice':
      return (response.labels ?? response.selected).join(', ')
    case 'ranked':
      return (response.labels ?? response.ranking).join(', ')
    case 'modal_form':
      return Array.isArray(response.selected) ? response.selected.join(', ') : response.selected
  }
}

function newMsgId(): string {
  return crypto.randomUUID()
}

function buildClarifyHistoryFromMessages(messages: readonly Message[]): ClarifyHistoryRow[] {
  const rows: ClarifyHistoryRow[] = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role !== 'assistant') continue
    let founderAnswer: string | null = null
    for (let j = i + 1; j < messages.length; j++) {
      const next = messages[j]
      if (next.role === 'assistant') break
      if (next.role === 'user') {
        founderAnswer = next.decisionResponse
          ? formatDecisionSelection(next.decisionResponse)
          : next.content
        break
      }
    }
    rows.push({
      structuredQuestion: m.content,
      founderAnswer,
      prdImpact: (m.parsed?.prd_section_affected as string | undefined) ?? null,
    })
  }
  return rows
}

interface ClarificationChatProps {
  projectId: string
  prdVersionId: string | null
  journeyMode: JourneyMode
  onPrdGenerated: () => void
}

export function ClarificationChat({
  projectId,
  prdVersionId,
  journeyMode,
  onPrdGenerated,
}: ClarificationChatProps) {
  const { t } = useI18n()
  const { notifyMilestone } = useOwnerMilestonePrompt()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [generatingPrd, setGeneratingPrd] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMilestone, setFeedbackMilestone] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)
  /** Thread used for the in-flight clarify request (avoids stale append after truncate). */
  const activeThreadRef = useRef<Message[]>([])
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const streamingRef = useRef(streaming)
  streamingRef.current = streaming

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const clarifyHistory = useMemo(
    () => buildClarifyHistoryFromMessages(messages ?? []),
    [messages]
  )

  const comingUpSections = useMemo(() => {
    if (journeyMode === 'express') {
      const answered = new Set<string>()
      for (const row of clarifyHistory) {
        const section = normalizePrdSection(row.prdImpact)
        if (section && row.founderAnswer?.trim()) answered.add(section)
      }
      return EXPRESS_MINIMUM_CLARIFY_SECTIONS.filter((s) => !answered.has(s))
    }
    const sections = (messages ?? [])
      .filter((m) => m.role === 'assistant')
      .map((m) => m.parsed?.prd_section_affected as string | undefined)
    return comingUpPrdSectionsFromAssistantParsed(sections, 3)
  }, [messages, journeyMode, clarifyHistory])

  const isExpress = journeyMode === 'express'

  const expressMinimumMet = isExpress && isExpressMinimumClarifyMet(clarifyHistory)

  const showReadyToGenerateHint = isExpress
    ? expressMinimumMet
    : comingUpSections.length === 0 && (messages ?? []).some((m) => m.role === 'assistant')

  const canGeneratePrd = isExpress
    ? expressMinimumMet
    : (messages?.length ?? 0) >= 2
  const idlePromptLabel = t('clarify.idlePrompt')
  const idlePrompt =
    idlePromptLabel === 'clarify.idlePrompt' ? t('clarify.starting') : idlePromptLabel

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = useCallback(
    async (
      userMessage: string | null,
      decisionResponse: ClarifyDecisionResponse | null,
      options?: { threadBase?: Message[]; skipAppendUser?: boolean }
    ) => {
    if (streamingRef.current) return

    let thread = options?.threadBase ?? messagesRef.current

    if (!options?.skipAppendUser && (userMessage || decisionResponse)) {
      const displayContent = decisionResponse
        ? `Selected: ${formatDecisionSelection(decisionResponse)}`
        : userMessage ?? ''
      const userMsg: Message = {
        id: newMsgId(),
        role: 'user',
        content: displayContent,
        ...(decisionResponse ? { decisionResponse } : {}),
      }
      thread = [...thread, userMsg]
    }

    activeThreadRef.current = thread
    setMessages(thread)

    setStreaming(true)
    setInput('')
    setEditingId(null)

    if (userMessage || decisionResponse) {
      captureClient(AnalyticsEvents.CLARIFY_MESSAGE_SENT, {
        project_id: projectId,
        journey_mode: journeyMode,
        has_prd_version: Boolean(prdVersionId),
      })
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          decisionResponse,
          prdVersionId,
          clientThread: messagesToClientThread(thread),
        }),
      })

      if (res?.status === 402) {
        const data = await res.json()
        captureCreditsDepletedSurface('clarification_chat', 'clarification', projectId)
        toast.error(data?.message ?? t('credits.insufficient'))
        setStreaming(false)
        return
      }

      if (!res?.ok) {
        captureClient(AnalyticsEvents.CLARIFY_FAILED, {
          project_id: projectId,
          journey_mode: journeyMode,
          error_code: 'clarify_response_not_ok',
          http_status: typeof res?.status === 'number' ? res.status : null,
        })
        throw new Error(t('clarify.aiResponseFailed'))
      }

      // Stream response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''
      let assistantContent = ''
      let streamCompleted = false

      const appendAssistantFromBuffer = (raw: string) => {
        let parsedResult: Record<string, unknown>
        try {
          parsedResult = JSON.parse(raw) as Record<string, unknown>
        } catch {
          parsedResult = { message: raw }
        }
        const messageText =
          typeof parsedResult.message === 'string' ? parsedResult.message : raw

        const assistantMsg: Message = {
          id: newMsgId(),
          role: 'assistant',
          content: messageText,
          parsed: parsedResult,
        }
        const nextThread = [...activeThreadRef.current, assistantMsg]
        activeThreadRef.current = nextThread
        setMessages(nextThread)
      }

      const handleSseLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data) as {
            status?: string
            partial?: string
            result?: string
            message?: string
          }
          if (parsed?.status === 'processing') {
            assistantContent += parsed?.partial ?? ''
          } else if (parsed?.status === 'completed') {
            streamCompleted = true
            assistantContent = parsed?.result ?? assistantContent
            appendAssistantFromBuffer(assistantContent)
          } else if (parsed?.status === 'error') {
            toast.error(parsed?.message ?? t('clarify.aiError'))
          }
        } catch {
          /* ignore malformed chunk */
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
        appendAssistantFromBuffer(assistantContent)
      }
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error('clarify_stream_failure')
      captureClient(AnalyticsEvents.CLARIFY_FAILED, {
        project_id: projectId,
        journey_mode: journeyMode,
        error_code: 'clarify_stream_failure',
      })
      captureClientException(normalized, {
        project_id: projectId,
        component: 'ClarificationChat',
        error_code: 'clarify_stream_failure',
      })
      toast.error(t('clarify.aiResponseFailed'))
    } finally {
      setStreaming(false)
    }
    },
    [projectId, prdVersionId, journeyMode, t]
  )

  // Load existing history on mount; auto-start only once per project when truly empty.
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/questions`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const historic: Message[] = []
            for (const q of data) {
              const parsed: Record<string, unknown> = { message: q.structuredQuestion }
              if (q.availableOptions) parsed.decision_ui = q.availableOptions
              if (q.aiInterpretation) parsed.reasoning = q.aiInterpretation
              if (q.prdImpact) parsed.prd_section_affected = q.prdImpact
              historic.push({
                id: newMsgId(),
                role: 'assistant',
                content: q.structuredQuestion,
                parsed,
              })
              if (q.founderAnswer) {
                historic.push({ id: newMsgId(), role: 'user', content: q.founderAnswer })
              }
            }
            setMessages(historic)
            return
          }
        }
        if (typeof sessionStorage !== 'undefined') {
          const autoStartKey = `zedos:clarify:auto-start:${projectId}`
          if (!sessionStorage.getItem(autoStartKey)) {
            sessionStorage.setItem(autoStartKey, '1')
            await sendMessage(null, null)
          }
        }
      } catch {
        // Keep empty state on error: avoid implicit paid AI calls on fetch failure.
      }
    }

    void loadHistory()
  }, [projectId, sendMessage])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg) return
    sendMessage(msg, null)
  }

  const handleDecision = (response: ClarifyDecisionResponse) => {
    void sendMessage(null, response)
  }

  const handleCopy = async (text: string) => {
    const ok = await copyTextToClipboard(text)
    if (ok) toastCopied(t('common.copiedToClipboard'))
    else toastCopyFailed(t('common.copyFailed'))
  }

  const startEdit = (msg: Message) => {
    if (streaming || msg.decisionResponse) return
    setEditingId(msg.id)
    setEditDraft(msg.content)
  }

  const submitEdit = async (messageId: string) => {
    const text = editDraft.trim()
    if (!text || streaming) return
    const index = messages.findIndex((m) => m.id === messageId)
    if (index < 0 || messages[index]?.role !== 'user') return
    const thread = [
      ...messages.slice(0, index),
      { ...messages[index], content: text },
    ]
    activeThreadRef.current = thread
    setMessages(thread)
    setEditingId(null)
    setEditDraft('')
    await sendMessage(text, null, { threadBase: thread, skipAppendUser: true })
  }

  const resendFromUserMessage = async (userMessageId: string) => {
    if (streaming) return
    const userIndex = messages.findIndex((m) => m.id === userMessageId && m.role === 'user')
    if (userIndex < 0) return
    const userMsg = messages[userIndex]
    const thread = messages.slice(0, userIndex + 1)
    activeThreadRef.current = thread
    setMessages(thread)
    setEditingId(null)
    setEditDraft('')
    const prompt = userMsg.decisionResponse ? null : userMsg.content
    await sendMessage(prompt, userMsg.decisionResponse ?? null, {
      threadBase: thread,
      skipAppendUser: true,
    })
  }

  const regenerateAssistant = async (assistantId: string) => {
    if (streaming) return
    const aiIndex = messages.findIndex((m) => m.id === assistantId && m.role === 'assistant')
    if (aiIndex < 0) return
    let userIndex = aiIndex - 1
    while (userIndex >= 0 && messages[userIndex]?.role !== 'user') userIndex -= 1
    if (userIndex < 0) return
    const userMsg = messages[userIndex]
    const thread = messages.slice(0, aiIndex)
    activeThreadRef.current = thread
    setMessages(thread)
    setEditingId(null)
    const prompt = userMsg.decisionResponse ? null : userMsg.content
    await sendMessage(prompt, userMsg.decisionResponse ?? null, {
      threadBase: thread,
      skipAppendUser: true,
    })
  }

  const handleGeneratePrd = async () => {
    setGeneratingPrd(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (res?.status === 402) {
        const data = await res.json()
        captureCreditsDepletedSurface('clarification_chat', 'prd_generation', projectId)
        toast.error(data?.message ?? t('credits.insufficient'))
        setGeneratingPrd(false)
        return
      }

      if (!res?.ok) throw new Error(t('clarify.generatePrdFailed'))

      // Stream through but we mainly care about completion
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        partialRead += decoder.decode(value, { stream: true })
        const lines = partialRead.split('\n')
        partialRead = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed?.status === 'completed') {
                toast.success(t('clarify.prdGenerated'))
                onPrdGenerated()
                const newPrdVersionId =
                  typeof parsed.prdVersionId === 'string' ? parsed.prdVersionId : prdVersionId
                const isUpdate = prdVersionId !== null
                const milestoneType = isUpdate ? 'prd_updated' : 'prd_created'
                setFeedbackMilestone(milestoneType)
                setShowFeedback(true)
                notifyMilestone({
                  projectId,
                  milestoneType,
                  ...(newPrdVersionId ? { prdVersionId: newPrdVersionId } : {}),
                })
              }
            } catch { }
          }
        }
      }
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error('prd_generation_failure')
      console.error('PRD generation error:', error)
      captureClient(AnalyticsEvents.PRD_GENERATION_FAILED, {
        project_id: projectId,
        journey_mode: journeyMode,
        error_code: 'prd_generation_client_failure',
      })
      captureClientException(normalized, {
        project_id: projectId,
        component: 'ClarificationChat',
        error_code: 'prd_generation_client_failure',
      })
      toast.error(t('clarify.generatePrdFailed'))
    } finally {
      setGeneratingPrd(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
      <div className="flex justify-end mb-3">
        <ReadinessScoreBadge projectId={projectId} />
      </div>
      {isExpress && (
        <p className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-2 mb-3">
          {t('clarify.expressModeBanner')}
        </p>
      )}
      {/* Messages — masked in PostHog session replay (B-ANALYTICS-002) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 ph-no-capture"
        data-ph-mask="clarification-thread"
      >
        {(messages ?? []).length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-10 w-10 text-primary/30 mb-3" />
            <p className="text-muted-foreground">{idlePrompt}</p>
          </div>
        )}

        {(messages ?? []).map((msg: Message, i: number) => (
          <div key={msg.id} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[85%] min-w-0 w-full flex justify-end flex-col">
                <div className="flex items-start gap-1 min-w-0 w-full max-w-full">

                  <div className="flex-1 min-w-0">
                    {editingId === msg.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="resize-none text-sm w-full h-[200px] ph-no-capture"
                          data-ph-mask="clarification-edit"
                          disabled={streaming}
                          aria-label={t('clarify.editMessage')}
                        />
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            {t('common.cancel')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void submitEdit(msg.id)}
                            disabled={!editDraft.trim() || streaming}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {t('common.resend')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 w-full">
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    )}
                  </div>
                </div>
                {editingId !== msg.id && (
                  <ChatMessageToolbar
                    role="user"
                    disabled={streaming || !!msg.decisionResponse}
                    onCopy={() => void handleCopy(msg.content)}
                    onEdit={msg.decisionResponse ? undefined : () => startEdit(msg)}
                    onRegenerate={
                      msg.decisionResponse ? undefined : () => void resendFromUserMessage(msg.id)
                    }
                  />
                )}
              </div>
            ) : (
              <div className="max-w-[85%] space-y-3">
                {/* Reasoning chip */}
                {typeof msg.parsed?.reasoning === 'string' && msg.parsed.reasoning ? (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{msg.parsed.reasoning}</span>
                  </div>
                ) : null}

                {/* Main message */}
                <div className="flex items-start gap-1 flex-col">
                  <Card className="flex-1 min-w-0">
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {typeof msg.parsed?.progress_hint === 'string' && msg.parsed.progress_hint ? (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={streaming}
                            onClick={() => void sendMessage(msg.parsed?.progress_hint as string, null)}
                            className="disabled:opacity-50"
                          >
                            <Badge variant="secondary" className="text-xs cursor-pointer">
                              {msg.parsed.progress_hint as string}
                            </Badge>
                          </button>

                          {typeof msg.parsed?.prd_section_affected === 'string' && msg.parsed.prd_section_affected ? (
                            <Badge variant="outline" className="text-xs">
                              → {msg.parsed.prd_section_affected as string}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                  <div className="flex items-start gap-1 self-end">
                    <ChatMessageToolbar
                      role="assistant"
                      disabled={streaming}
                      onCopy={() =>
                        void handleCopy(
                          typeof msg.parsed?.reasoning === 'string'
                            ? `${msg.content}\n\n${msg.parsed.reasoning}`
                            : msg.content
                        )
                      }
                      onRegenerate={() => void regenerateAssistant(msg.id)}
                    />
                  </div>
                </div>

                {/* Decision UI */}
                {(() => {
                  const parsedDecision = ClarifyDecisionUiSchema.safeParse(
                    msg.parsed?.decision_ui
                  )
                  if (!parsedDecision.success) return null
                  const decisionUi: ClarifyDecisionUi = parsedDecision.data
                  return (
                    <DecisionCard
                      decision={decisionUi}
                      onSubmit={handleDecision}
                      disabled={streaming || i !== (messages?.length ?? 0) - 1}
                    />
                  )
                })()}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-muted-foreground bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('common.thinking')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t pt-4 space-y-3">
        {comingUpSections.length > 0 && (
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
            aria-label={t('clarify.upcomingPrdSections')}
          >
            <span className="text-xs font-medium text-muted-foreground shrink-0">{t('clarify.comingUp')}</span>
            <div className="flex flex-wrap gap-2">
              {comingUpSections.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs font-normal max-w-full truncate">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {showReadyToGenerateHint && (
          <p className="text-xs text-muted-foreground">
            {isExpress ? t('clarify.readyToGenerateExpressPrd') : t('clarify.readyToGeneratePrd')}
          </p>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder={t('clarify.inputPlaceholder')}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none flex-1 ph-no-capture"
            data-ph-mask="clarification-input"
            disabled={streaming}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || streaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePrd}
            loading={generatingPrd}
            disabled={streaming || !canGeneratePrd}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExpress ? t('clarify.generateExpressPrd') : t('clarify.generatePrd')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('clarify.generatePrdCost')}
          </span>
        </div>
      </div>

      {/* Milestone feedback */}
      <MilestoneFeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        projectId={projectId}
        prdVersionId={prdVersionId}
        milestoneType={feedbackMilestone}
        title={feedbackMilestone === 'prd_created' ? t('clarify.prdGeneratedTitle') : t('common.feedbackPromptTitle')}
        description={t('clarify.feedbackDescription')}
      />
    </div>
  )
}
