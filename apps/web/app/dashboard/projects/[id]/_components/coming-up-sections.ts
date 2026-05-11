import { PRD_SECTIONS } from '@repo/contracts/questions'

/** Minimal message shape for “Coming up” preview (assistant `prd_section_affected`). */
export type ClarifyMessageForComingUp = {
  role: 'user' | 'assistant' | 'system'
  parsed?: { prd_section_affected?: unknown } | null
}

const canonical = new Set<string>(PRD_SECTIONS as unknown as string[])

/** Next canonical PRD sections not yet touched by assistant messages, in pipeline order (max `limit`). */
export function selectComingUpSections(messages: ClarifyMessageForComingUp[], limit = 3): string[] {
  const covered = new Set<string>()
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    const raw = m.parsed?.prd_section_affected
    if (typeof raw !== 'string') continue
    const s = raw.trim()
    if (canonical.has(s)) covered.add(s)
  }
  return PRD_SECTIONS.filter((section) => !covered.has(section)).slice(0, limit)
}
