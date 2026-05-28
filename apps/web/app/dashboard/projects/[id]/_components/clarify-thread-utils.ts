import type { ClarifyClientThreadMessage } from '@repo/contracts/questions/history'

export type ThreadMessageLike = {
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  parsed?: Record<string, unknown>
}

export function messagesToClientThread(
  messages: readonly ThreadMessageLike[]
): ClarifyClientThreadMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      ...(m.role === 'assistant'
        ? {
            reasoning:
              m.reasoning ??
              (typeof m.parsed?.reasoning === 'string' ? m.parsed.reasoning : undefined),
          }
        : {}),
    }))
}
