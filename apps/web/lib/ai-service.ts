// Thin AI gateway/service boundary for future provider swapping

const API_URL = 'https://apps.abacus.ai/v1/chat/completions'
const API_KEY = process.env.ABACUSAI_API_KEY

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
  responseFormat?: any
}

export async function callAI(options: AIRequestOptions): Promise<Response> {
  const {
    model = 'gpt-5.4-mini',
    messages,
    stream = false,
    maxTokens = 4000,
    temperature = 0.7,
    responseFormat,
  } = options

  const body: any = {
    model,
    messages,
    stream,
    max_tokens: maxTokens,
    temperature,
  }

  if (responseFormat) {
    body.response_format = responseFormat
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response?.ok) {
    const errorText = await response?.text?.() ?? 'Unknown AI error'
    throw new Error(`AI API error: ${response?.status} - ${errorText}`)
  }

  return response
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
