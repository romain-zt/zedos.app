/**
 * Single source of truth for deferred (post-PRD) roadmap placeholders —
 * dashboard home + sidebar stay visually aligned.
 *
 * Live per-project surfaces (feature split, user stories, delivery) are linked
 * from the project sidebar — only items still without a shipped UI stay here.
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

/** Post-PRD surfaces without a shipped UI — empty when all pipeline steps are live. */
export const DEFERRED_ROADMAP_PLACEHOLDERS: readonly DeferredRoadmapPlaceholder[] = [] as const
