/**
 * Single source of truth for deferred (post-PRD) roadmap placeholders —
 * dashboard home + sidebar stay visually aligned.
 *
 * Product decision (2026-05-29):
 * - `test-first-workflows` (Task splitting) is in v0 — project nav, not deferred.
 * - `delivery` (Cursor package export) is in v0 — project nav, not deferred.
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

export const DEFERRED_ROADMAP_PLACEHOLDERS: readonly DeferredRoadmapPlaceholder[] = [] as const
