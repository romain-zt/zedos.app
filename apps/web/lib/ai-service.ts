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

export function createBufferedStreamingResponse(
  aiResponse: Response,
  onComplete: (
    result: string
  ) =>
    | Promise<Record<string, unknown> | void>
    | Record<string, unknown>
    | void
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const reader = aiResponse?.body?.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      let buffer = ''
      let partialRead = ''

      try {
        while (true) {
          const { done, value } = await (
            reader as ReadableStreamDefaultReader<Uint8Array>
          ).read()
          if (done) break
          partialRead += decoder.decode(value, { stream: true })
          const lines = partialRead.split('\n')
          partialRead = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') {
              let extras: Record<string, unknown> = {}
              try {
                const maybe = await Promise.resolve(onComplete(buffer))
                if (maybe && typeof maybe === 'object' && !Array.isArray(maybe)) {
                  extras = maybe as Record<string, unknown>
                }
              } catch (e: unknown) {
                console.error('onComplete error:', e)
              }
              const finalData = JSON.stringify({
                status: 'completed',
                result: buffer,
                ...extras,
              })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              return
            }
            try {
              const parsed = JSON.parse(data)
              const content = parsed?.choices?.[0]?.delta?.content ?? ''
              buffer += content
              const progressData = JSON.stringify({
                status: 'processing',
                partial: content,
              })
              controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
            } catch {
              /* skip invalid JSON chunks */
            }
          }
        }
        if (buffer) {
          let extras: Record<string, unknown> = {}
          try {
            const maybe = await Promise.resolve(onComplete(buffer))
            if (maybe && typeof maybe === 'object' && !Array.isArray(maybe)) {
              extras = maybe as Record<string, unknown>
            }
          } catch {
            /* best-effort */
          }
          const finalData = JSON.stringify({
            status: 'completed',
            result: buffer,
            ...extras,
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
        }
      } catch (error: unknown) {
        console.error('Buffered stream error:', error)
        const message = error instanceof Error ? error.message : 'Stream failed'
        const errData = JSON.stringify({ status: 'error', message })
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`))
      } finally {
        controller.close()
      }
    },
  })
}
