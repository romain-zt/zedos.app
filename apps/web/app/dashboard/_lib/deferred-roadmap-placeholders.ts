/**
 * Single source of truth for deferred (post-PRD) roadmap placeholders —
 * dashboard home + sidebar stay visually aligned.
 *
 * Product decision (2026-05-29):
 * - `test-first-workflows` (Task splitting) is in v0 — project nav, not deferred.
 * - `delivery` remains out of v0 (coming in v1).
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
