'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send, Sparkles, FileText, AlertTriangle, Loader2, RefreshCw,
  HelpCircle, ChevronRight,
} from 'lucide-react'
import { DecisionCard } from './decision-card'
import { toast } from 'sonner'
import { MilestoneFeedbackModal } from '@/components/milestone-feedback-modal'
import { comingUpPrdSectionsFromAssistantParsed } from '@repo/contracts/questions/history'
import { useOwnerMilestonePrompt } from './owner-milestone-prompt'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  parsed?: any
  decisionResponse?: any
}

interface ClarificationChatProps {
  projectId: string
  prdVersionId: string | null
  onPrdGenerated: () => void
}

export function ClarificationChat({ projectId, prdVersionId, onPrdGenerated }: ClarificationChatProps) {
  const { signalMilestone } = useOwnerMilestonePrompt()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [generatingPrd, setGeneratingPrd] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMilestone, setFeedbackMilestone] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const comingUpSections = useMemo(() => {
    const sections = (messages ?? [])
      .filter((m) => m.role === 'assistant')
      .map((m) => m.parsed?.prd_section_affected as string | undefined)
    return comingUpPrdSectionsFromAssistantParsed(sections, 3)
  }, [messages])

  const showReadyToGenerateHint =
    comingUpSections.length === 0 && (messages ?? []).some((m) => m.role === 'assistant')

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Load existing history on mount; auto-start only when there are no prior messages.
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
              const parsed: any = { message: q.structuredQuestion }
              if (q.availableOptions) parsed.decision_ui = q.availableOptions
              if (q.aiInterpretation) parsed.reasoning = q.aiInterpretation
              if (q.prdImpact) parsed.prd_section_affected = q.prdImpact
              historic.push({ role: 'assistant', content: q.structuredQuestion, parsed })
              if (q.founderAnswer) {
                historic.push({ role: 'user', content: q.founderAnswer })
              }
            }
            setMessages(historic)
            return
          }
        }
      } catch {
        // Fall through to auto-start on error
      }
      // No history (or fetch failed) — start a fresh clarification session
      sendMessage(null, null)
    }

    loadHistory()
  }, [projectId])

  const sendMessage = async (userMessage: string | null, decisionResponse: any | null) => {
    if (streaming) return

    // Add user message to chat
    if (userMessage || decisionResponse) {
      const displayContent = decisionResponse
        ? `Selected: ${JSON.stringify(decisionResponse?.selected ?? decisionResponse)}`
        : userMessage ?? ''
      setMessages((prev: Message[]) => [
        ...(prev ?? []),
        { role: 'user', content: displayContent, decisionResponse },
      ])
    }

    setStreaming(true)
    setInput('')

    try {
      const res = await fetch(`/api/projects/${projectId}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          decisionResponse,
          prdVersionId,
        }),
      })

      if (res?.status === 402) {
        const data = await res.json()
        toast.error(data?.message ?? 'Insufficient credits')
        setStreaming(false)
        return
      }

      if (!res?.ok) {
        throw new Error('Failed to get AI response')
      }

      // Stream response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''
      let assistantContent = ''

      // Add placeholder assistant message
      setMessages((prev: Message[]) => [...(prev ?? []), { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        const lines = partialRead.split('\n')
        partialRead = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (parsed?.status === 'processing') {
                assistantContent += parsed?.partial ?? ''
              } else if (parsed?.status === 'completed') {
                assistantContent = parsed?.result ?? assistantContent
                let parsedResult: any = null
                try {
                  parsedResult = JSON.parse(assistantContent)
                } catch {
                  parsedResult = { message: assistantContent }
                }

                setMessages((prev: Message[]) => {
                  const updated = [...(prev ?? [])]
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: parsedResult?.message ?? assistantContent,
                      parsed: parsedResult,
                    }
                  }
                  return updated
                })
              } else if (parsed?.status === 'error') {
                toast.error(parsed?.message ?? 'AI error')
              }
            } catch {}
          }
        }

        // Update streaming content
        setMessages((prev: Message[]) => {
          const updated = [...(prev ?? [])]
          if (updated.length > 0 && updated[updated.length - 1]?.role === 'assistant') {
            try {
              const partial = JSON.parse(assistantContent)
              updated[updated.length - 1] = {
                role: 'assistant',
                content: partial?.message ?? assistantContent.slice(0, 200),
                parsed: partial,
              }
            } catch {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: assistantContent.slice(0, 200) + '...',
              }
            }
          }
          return updated
        })
      }
    } catch (error: any) {
      console.error('Clarification error:', error)
      toast.error('Failed to get AI response')
    } finally {
      setStreaming(false)
    }
  }

  const handleSend = () => {
    const msg = input.trim()
    if (!msg) return
    sendMessage(msg, null)
  }

  const handleDecision = (response: any) => {
    sendMessage(null, response)
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
        toast.error(data?.message ?? 'Insufficient credits')
        setGeneratingPrd(false)
        return
      }

      if (!res?.ok) throw new Error('Failed to generate PRD')

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
                toast.success('PRD generated!')
                onPrdGenerated()
                signalMilestone({
                  projectId,
                  milestoneType: 'prd_created',
                  ...(prdVersionId ? { prdVersionId } : {}),
                })
                // Trigger milestone feedback
                setFeedbackMilestone('prd_created')
                setShowFeedback(true)
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      console.error('PRD generation error:', error)
      toast.error('Failed to generate PRD')
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
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {(messages ?? []).length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-10 w-10 text-primary/30 mb-3" />
            <p className="text-muted-foreground">Starting clarification...</p>
          </div>
        )}

        {(messages ?? []).map((msg: Message, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div className="max-w-[85%] space-y-3">
                {/* Reasoning chip */}
                {msg.parsed?.reasoning && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{msg.parsed.reasoning}</span>
                  </div>
                )}

                {/* Main message */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.parsed?.progress_hint && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {msg.parsed.progress_hint}
                        </Badge>
                        {msg.parsed?.prd_section_affected && (
                          <Badge variant="outline" className="text-xs">
                            → {msg.parsed.prd_section_affected}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Decision UI */}
                {msg.parsed?.decision_ui && (
                  <DecisionCard
                    decision={msg.parsed.decision_ui}
                    onSubmit={handleDecision}
                    disabled={streaming || i !== (messages?.length ?? 0) - 1}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-muted-foreground bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t pt-4 space-y-3">
        {comingUpSections.length > 0 && (
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
            aria-label="Upcoming PRD sections"
          >
            <span className="text-xs font-medium text-muted-foreground shrink-0">Coming up</span>
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
            Ready to generate PRD — every canonical section has had a question in this workspace.
          </p>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your response or add context..."
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none flex-1"
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
            disabled={streaming || (messages?.length ?? 0) < 2}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate PRD
          </Button>
          <span className="text-xs text-muted-foreground">
            10 credits · Generates a versioned PRD from your clarifications
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
        title={feedbackMilestone === 'prd_created' ? 'PRD Generated!' : 'How was that?'}
        description="Your feedback helps improve the product clarification experience."
      />
    </div>
  )
}
