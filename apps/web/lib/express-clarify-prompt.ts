/**
 * Minimum IA clarify prompts for express journey mode.
 */

import { EXPRESS_MINIMUM_CLARIFY_SECTIONS } from '@repo/contracts/prd'
import type { AIMessage } from '@/lib/ai-service'
import {
  buildClarifyMessages,
  buildClarifyMessagesFromClientThread,
  type ClarifyHistoryRow,
  type ClientThreadMessage,
  normalizePrdSection,
} from '@/lib/clarify-prompt'

const EXPRESS_SECTION_SET = new Set<string>(EXPRESS_MINIMUM_CLARIFY_SECTIONS)

export function isExpressMinimumClarifyMet(history: readonly ClarifyHistoryRow[]): boolean {
  const answered = new Set<string>()
  for (const row of history) {
    const section = normalizePrdSection(row.prdImpact)
    if (!section || !EXPRESS_SECTION_SET.has(section)) continue
    if (row.founderAnswer != null && row.founderAnswer.trim() !== '') {
      answered.add(section)
    }
  }
  return EXPRESS_MINIMUM_CLARIFY_SECTIONS.every((s) => answered.has(s))
}

function expressClarifySystemPrompt(responseLanguage: 'fr' | 'en'): string {
  const languageRule =
    responseLanguage === 'fr'
      ? '- Respond in French for reasoning, message, progress_hint, and decision_ui labels.'
      : '- Respond in English for reasoning, message, progress_hint, and decision_ui labels.'

  const sections = EXPRESS_MINIMUM_CLARIFY_SECTIONS.join(', ')

  return `You are Zedos in **express (urgent) mode** — minimum IA clarification before an express livrable.

Rules (strict):
- Ask ONE focused question per turn.
- Cover only these sections (in order): ${sections}.
- Maximum **5** founder-facing questions total for the whole express clarify pass.
- Never repeat a section that already has a founder answer in SESSION STATE.
- When all three sections are answered, set progress_hint to suggest generating the express PRD (do not ask more unless the founder requests refinement).
- Prefer decision_ui only when 3–6 clear options help; otherwise decision_ui: null.
- reasoning: max 1 short sentence. message: concise.
${languageRule}

JSON only (no markdown):
{"reasoning":"...","message":"...","decision_ui":null|{...},"prd_section_affected":"...","progress_hint":"...","suggested_credit_type":"clarification"|"decision"|"mini_form"}`
}

function buildExpressSessionStateBlock(history: readonly ClarifyHistoryRow[]): string {
  const answered = new Map<string, string>()
  for (const row of history) {
    const section = normalizePrdSection(row.prdImpact)
    if (!section || !EXPRESS_SECTION_SET.has(section)) continue
    if (row.founderAnswer != null && row.founderAnswer.trim() !== '') {
      answered.set(section, row.founderAnswer.trim().slice(0, 400))
    }
  }

  const remaining = EXPRESS_MINIMUM_CLARIFY_SECTIONS.filter((s) => !answered.has(s))
  const answeredLines =
    answered.size > 0
      ? [...answered.entries()].map(([s, a]) => `- ${s}: ${a}`).join('\n')
      : '(none yet)'

  const ready = remaining.length === 0

  return [
    'EXPRESS SESSION STATE',
    `Minimum sections answered:\n${answeredLines}`,
    `Remaining minimum sections: ${remaining.join(', ') || 'none'}`,
    ready
      ? 'Status: minimum IA met — next step is Generate express PRD unless founder asks to refine.'
      : `Status: ask about ${remaining[0] ?? 'gaps'} next.`,
  ].join('\n\n')
}

export function buildExpressClarifyMessages(
  project: { name: string; description: string | null },
  history: readonly ClarifyHistoryRow[],
  userMessage: string,
  responseLanguage: 'fr' | 'en' = 'en'
): AIMessage[] {
  const sessionState = buildExpressSessionStateBlock(history)
  const standard = buildClarifyMessages(project, history, userMessage, responseLanguage)
  const system = expressClarifySystemPrompt(responseLanguage)
  const userContent = standard[1]?.content ?? userMessage

  return [
    { role: 'system', content: system },
    { role: 'user', content: `${sessionState}\n\n${userContent}` },
  ]
}

export function buildExpressClarifyMessagesFromClientThread(
  project: { name: string; description: string | null },
  thread: readonly ClientThreadMessage[],
  userMessage: string,
  contextLabel?: string,
  responseLanguage: 'fr' | 'en' = 'en'
): AIMessage[] {
  const standard = buildClarifyMessagesFromClientThread(
    project,
    thread,
    userMessage,
    contextLabel,
    responseLanguage
  )
  const system = expressClarifySystemPrompt(responseLanguage)
  const userContent = standard[1]?.content ?? userMessage

  return [
    { role: 'system', content: system },
    { role: 'user', content: userContent },
  ]
}
