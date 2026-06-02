/**
 * Token-efficient clarify prompt assembly for /api/projects/:id/clarify.
 */

import { PRD_SECTIONS } from '@repo/contracts/questions/history'
import type { AIMessage } from '@/lib/ai-service'

const PRD_SECTION_SET = new Set<string>(PRD_SECTIONS as unknown as string[])

/** Map loose model labels to canonical PRD section names. */
export function normalizePrdSection(label: string | null | undefined): string | null {
  if (label == null) return null
  const s = label.trim()
  if (PRD_SECTION_SET.has(s)) return s
  const lower = s.toLowerCase()
  if (lower.includes('vision') || lower.includes('problem')) return 'Product Vision'
  if (lower.includes('target') || lower.includes('persona') || lower.includes('user')) return 'Target Users'
  if (lower.includes('feature') || lower.includes('mvp') || lower.includes('scope')) return 'Core Features'
  if (lower.includes('journey') || lower.includes('flow')) return 'User Journeys'
  if (lower.includes('technical') || lower.includes('stack') || lower.includes('constraint')) return 'Technical Constraints'
  if (lower.includes('metric') || lower.includes('success') || lower.includes('kpi')) return 'Success Metrics'
  if (lower.includes('out of scope') || lower.includes('future')) return 'Out of Scope'
  if (lower.includes('risk') || lower.includes('open question')) return 'Open Questions'
  return null
}

export type ClarifyHistoryRow = {
  structuredQuestion: string
  founderAnswer: string | null
  prdImpact: string | null
}

function clarifySystemPrompt(responseLanguage: 'fr' | 'en'): string {
  const languageRule =
    responseLanguage === 'fr'
      ? '- Respond in French for reasoning, message, progress_hint, and decision_ui labels.'
      : '- Respond in English for reasoning, message, progress_hint, and decision_ui labels.'

  return `You are Zedos, a product strategist helping founders build a PRD.

Rules (strict):
- Ask ONE focused question per turn.
- Use prd_section_affected from this exact list only: ${PRD_SECTIONS.join(', ')}.
- Never repeat a section that already has a founder answer in SESSION STATE.
- If the founder gave concrete product info, acknowledge it briefly and advance to the next uncovered section.
- Prefer decision_ui only when 3–6 clear mutually exclusive options help; otherwise decision_ui: null.
- reasoning: max 1 short sentence. message: concise.
- Do not rephrase the same question on Product Vision / problem statement if already answered.
${languageRule}

JSON only (no markdown):
{"reasoning":"...","message":"...","decision_ui":null|{...},"prd_section_affected":"...","progress_hint":"...","suggested_credit_type":"clarification"|"decision"|"mini_form"}`
}

const MAX_DETAILED_TURNS = 8
const MAX_ANSWER_CHARS = 400
const MAX_QUESTION_CHARS = 220

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function buildSessionStateBlock(history: readonly ClarifyHistoryRow[]): string {
  const answered = new Map<string, string>()
  const askedUnanswered = new Set<string>()

  for (const row of history) {
    const section = normalizePrdSection(row.prdImpact)
    if (!section) continue
    if (row.founderAnswer != null && row.founderAnswer.trim() !== '') {
      answered.set(section, truncate(row.founderAnswer, MAX_ANSWER_CHARS))
      askedUnanswered.delete(section)
    } else {
      if (!answered.has(section)) askedUnanswered.add(section)
    }
  }

  const coveredSections = PRD_SECTIONS.filter((s) => answered.has(s))
  const remainingSections = PRD_SECTIONS.filter((s) => !answered.has(s))
  const nextSection = remainingSections[0] ?? null

  const answeredLines =
    coveredSections.length > 0
      ? coveredSections.map((s) => `- ${s}: ${answered.get(s)}`).join('\n')
      : '(none yet)'

  const pendingLines =
    askedUnanswered.size > 0
      ? [...askedUnanswered].map((s) => `- ${s}`).join('\n')
      : '(none)'

  return [
    'SESSION STATE',
    `Answered sections:\n${answeredLines}`,
    `Asked but not answered (do not repeat unless founder asks):\n${pendingLines}`,
    `Next section to explore: ${nextSection ?? 'all covered — suggest Generate PRD or refine gaps'}`,
    `Remaining: ${remainingSections.join(', ') || 'none'}`,
  ].join('\n\n')
}

function formatHistoryTurn(row: ClarifyHistoryRow, index: number): string {
  const section = normalizePrdSection(row.prdImpact) ?? 'General'
  const q = truncate(row.structuredQuestion, MAX_QUESTION_CHARS)
  const a =
    row.founderAnswer != null && row.founderAnswer.trim() !== ''
      ? truncate(row.founderAnswer, MAX_ANSWER_CHARS)
      : '(no answer yet)'
  return `[${index + 1}|${section}] Q: ${q}\nA: ${a}`
}

export function buildCompactHistoryBlock(history: readonly ClarifyHistoryRow[]): string {
  if (history.length === 0) return 'HISTORY: (new session)'

  const recent = history.slice(-MAX_DETAILED_TURNS)
  const older = history.slice(0, -MAX_DETAILED_TURNS)

  const parts: string[] = ['HISTORY (compact):']

  if (older.length > 0) {
    const olderSections = older
      .map((r) => normalizePrdSection(r.prdImpact))
      .filter((s): s is string => s != null)
    const unique = [...new Set(olderSections)]
    parts.push(`Earlier turns (${older.length}): touched ${unique.join(', ') || 'general topics'}.`)
  }

  for (let i = 0; i < recent.length; i++) {
    parts.push(formatHistoryTurn(recent[i], older.length + i))
  }

  return parts.join('\n')
}

export type ClientThreadMessage = {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

const MAX_THREAD_CHARS = 3500

function buildClientThreadBlock(
  thread: readonly ClientThreadMessage[],
  contextLabel?: string
): string {
  const lines: string[] = []
  if (contextLabel) {
    lines.push(`Refine focus: ${contextLabel}`)
  }
  lines.push('THREAD (authoritative for this request):')
  for (const m of thread) {
    const label = m.role === 'user' ? 'Founder' : 'Assistant'
    const body = m.content.trim()
    if (!body) continue
    lines.push(`${label}: ${body}`)
    if (m.role === 'assistant' && m.reasoning?.trim()) {
      lines.push(`  (reasoning: ${m.reasoning.trim()})`)
    }
  }
  let block = lines.join('\n')
  if (block.length > MAX_THREAD_CHARS) {
    block = `${block.slice(0, MAX_THREAD_CHARS)}…`
  }
  return block
}

/** Prompt when the UI sends the full visible thread (edit / regenerate / refine panel). */
export function buildClarifyMessagesFromClientThread(
  project: { name: string; description: string | null },
  thread: readonly ClientThreadMessage[],
  userMessage: string,
  contextLabel?: string,
  responseLanguage: 'fr' | 'en' = 'en'
): AIMessage[] {
  const threadBlock = buildClientThreadBlock(thread, contextLabel)

  return [
    { role: 'system', content: clarifySystemPrompt(responseLanguage) },
    {
      role: 'user',
      content: [
        `Project: ${project.name}`,
        project.description ? `Description: ${truncate(project.description, 500)}` : '',
        threadBlock,
        `Founder message (respond to this): ${userMessage}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ]
}

export function buildClarifyMessages(
  project: { name: string; description: string | null },
  history: readonly ClarifyHistoryRow[],
  userMessage: string,
  responseLanguage: 'fr' | 'en' = 'en'
): AIMessage[] {
  const sessionState = buildSessionStateBlock(history)
  const historyBlock = buildCompactHistoryBlock(history)

  return [
    { role: 'system', content: clarifySystemPrompt(responseLanguage) },
    {
      role: 'user',
      content: [
        `Project: ${project.name}`,
        project.description ? `Description: ${truncate(project.description, 500)}` : '',
        sessionState,
        historyBlock,
        `Founder message (respond to this): ${userMessage}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ]
}
