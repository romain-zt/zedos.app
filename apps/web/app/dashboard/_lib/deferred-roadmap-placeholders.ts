/**
 * Single source of truth for deferred (post-PRD) roadmap placeholders —
 * dashboard home + sidebar stay visually aligned.
 */

/** Contact shown in the "need it fast?" CTA inside roadmap modals. */
export const ROADMAP_CONTACT_EMAIL = 'romain@zedtech.fr'

export type DeferredRoadmapPlaceholder = {
  id: string
  title: string
  /** Short supporting line on the home grid */
  summary: string
  /** Confirms unavailable-in-v0 on hover / focus (sidebar + home) */
  tooltip: string
  /** 2–3 sentence description of what the feature does */
  description: string
  /** Why this step matters for the founder's workflow */
  why: string
}

export const DEFERRED_ROADMAP_PLACEHOLDERS: readonly DeferredRoadmapPlaceholder[] = [
  {
    id: 'user-stories',
    title: 'User stories',
    summary: 'From PRD to executable stories',
    tooltip: 'Coming in v1 — tap to learn more.',
    description:
      'Translate each feature cluster into structured, testable user stories. Each story comes with a title, actor, outcome, and acceptance criteria — ready for development or AI-assisted implementation.',
    why:
      'Vague specs produce vague code. Proper user stories force clarity on who does what and what "done" looks like — saving you from the costly "that\'s not what I meant" conversation with your developers or AI tools.',
  },
  {
    id: 'test-first-workflows',
    title: 'Test-first workflows',
    summary: 'Stories with tasks and prompts per task',
    tooltip: 'Coming in v1 — tap to learn more.',
    description:
      'For each user story, generate a task list with one focused implementation prompt per task. Everything your AI coding agent needs to start building — in the right order, with the right context.',
    why:
      'AI coding agents work best with small, precise prompts. This step pre-chews your stories into bite-sized tasks so Cursor or any AI tool can ship them reliably, without you hand-holding every instruction.',
  },
  {
    id: 'delivery',
    title: 'Delivery',
    summary: 'Cursor packaging for v0',
    tooltip: 'Coming in v1 — tap to learn more.',
    description:
      'Package your user stories, tasks, and prompts into a Cursor-ready export — a `.cursor/` folder structure and WORK_QUEUE you can drop directly into your repo and open in your editor.',
    why:
      'The last mile from planning to coding is usually manual and error-prone. This closes that gap: one export and everything lands in Cursor, formatted exactly how an AI coding agent expects it.',
  },
] as const
