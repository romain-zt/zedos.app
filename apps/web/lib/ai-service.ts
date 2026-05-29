// Thin AI gateway/service boundary for future provider swapping

import { createE2eAiStreamResponse, isE2eMode } from '@/lib/e2e-mode'

// const API_URL = 'https://apps.abacus.ai/v1/chat/completions' // Abacus AI
const API_URL = 'https://api.openai.com/v1/chat/completions'
// const API_KEY = process.env.ABACUSAI_API_KEY
const API_KEY = process.env.OPENAI_API_KEY

const DEFAULT_AI_TIMEOUT_MS = 120_000
const AI_MAX_RETRIES = 1

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function resolveAiTimeoutMs(overrideMs?: number): number {
  if (overrideMs !== undefined && overrideMs > 0) return overrideMs
  return parsePositiveIntEnv('AI_REQUEST_TIMEOUT_MS', DEFAULT_AI_TIMEOUT_MS)
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  model?: string
  messages: AIMessage[]
  stream?: boolean
  maxTokens?: number
  temperature?: number
  responseFormat?: { type: 'json_object' }
  /** Per-call timeout; falls back to AI_REQUEST_TIMEOUT_MS (default 120s). */
  timeoutMs?: number
}

export class AiServiceError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiServiceError'
    this.status = status
  }
}

function resolveApiKey(): string {
  const key = API_KEY?.trim()
  if (!key) {
    throw new AiServiceError(503, 'AI API key is not configured (OPENAI_API_KEY)')
  }
  return key
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

export async function callAI(options: AIRequestOptions): Promise<Response> {
  const {
    model = 'gpt-4o-mini',
    messages,
    stream = false,
    maxTokens = 4000,
    temperature = 0.7,
    responseFormat,
    timeoutMs,
  } = options

  const requestTimeoutMs = resolveAiTimeoutMs(timeoutMs)

  if (isE2eMode() && stream) {
    return createE2eAiStreamResponse()
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    max_tokens: maxTokens,
    temperature,
  }

  if (responseFormat) {
    body.response_format = responseFormat
  }

  const apiKey = resolveApiKey()
  let lastError: AiServiceError | null = null

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(requestTimeoutMs),
      })

      if (response.ok) {
        return response
      }

      const errorText = await response.text().catch(() => 'Unknown AI error')
      lastError = new AiServiceError(response.status, `AI API error: ${response.status} - ${errorText}`)

      if (attempt < AI_MAX_RETRIES && isRetryableStatus(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      throw lastError
    } catch (error) {
      if (error instanceof AiServiceError) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Unknown AI error'
      if (message.includes('TimeoutError') || message.includes('timed out') || message.includes('aborted')) {
        throw new AiServiceError(504, 'AI request timed out')
      }

      throw new AiServiceError(502, message)
    }
  }

  throw lastError ?? new AiServiceError(502, 'AI request failed')
}

export function createStreamingResponse(aiResponse: Response): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const reader = aiResponse?.body?.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      try {
        while (true) {
          const { done, value } = await (reader as any).read()
          if (done) break
          const chunk = decoder.decode(value)
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (error: any) {
        console.error('Stream error:', error)
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })
}

/** Best-effort: OpenAI-compatible chat completion SSE chunk (`choices[0].delta.content`). */
function extractUpstreamDeltaContent(ssePayload: string): string | null {
  if (ssePayload === '[DONE]') return null
  try {
    const j = JSON.parse(ssePayload) as Record<string, unknown>
    const choices = j?.choices as unknown
    if (!Array.isArray(choices) || choices.length === 0) return null
    const delta = (choices[0] as { delta?: { content?: unknown } })?.delta
    const c = delta?.content
    return typeof c === 'string' && c.length > 0 ? c : null
  } catch {
    return null
  }
}

export function createBufferedStreamingResponse(
  aiResponse: Response,
  onComplete: (result: string) => Promise<void> | void
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }
      const safeClose = () => {
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      let buffer = ''
      try {
        const reader = aiResponse.body?.getReader()
        if (!reader) {
          send({ status: 'error', message: 'No response body from AI' })
          safeClose()
          return
        }

        const decoder = new TextDecoder()
        let partialRead = ''
        let sawDone = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          partialRead += decoder.decode(value, { stream: true })
          const lines = partialRead.split('\n')
          partialRead = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') {
              sawDone = true
              break
            }
            const piece = extractUpstreamDeltaContent(raw)
            if (piece) {
              buffer += piece
              send({ status: 'processing', partial: piece })
            }
          }
          if (sawDone) break
        }

        if (partialRead.startsWith('data: ')) {
          const raw = partialRead.slice(6).trim()
          if (raw === '[DONE]') {
            sawDone = true
          } else if (raw) {
            const piece = extractUpstreamDeltaContent(raw)
            if (piece) {
              buffer += piece
              send({ status: 'processing', partial: piece })
            }
          }
        }

        const trimmed = buffer.trim()
        if (trimmed.length === 0) {
          send({ status: 'error', message: 'Empty AI response' })
        } else {
          try {
            await Promise.resolve(onComplete(buffer))
          } catch (e: unknown) {
            console.error('onComplete error:', e)
          }
          send({ status: 'completed', result: buffer })
        }
      } catch (error: unknown) {
        console.error('Buffered stream error:', error)
        const message = error instanceof Error ? error.message : 'Stream failed'
        send({ status: 'error', message })
      } finally {
        safeClose()
      }
    },
  })
}
