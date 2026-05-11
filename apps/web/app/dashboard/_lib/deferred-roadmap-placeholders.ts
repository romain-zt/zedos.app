/**
 * Single source of truth for deferred (post-PRD) roadmap placeholders —
 * dashboard home + sidebar stay visually aligned.
 */

export type DeferredRoadmapPlaceholder = {
  id: string
  title: string
  /** Short supporting line on the home grid */
  summary: string
  /** Confirms unavailable-in-v0 on hover / focus (sidebar + home) */
  tooltip: string
}

export const DEFERRED_ROADMAP_PLACEHOLDERS: readonly DeferredRoadmapPlaceholder[] = [
  {
    id: 'services-feature-split',
    title: 'Services / feature split',
    summary: 'Post-PRD pipeline structure',
    tooltip: 'Not available in v0 — planned after the PRD slice.',
  },
  {
    id: 'user-stories',
    title: 'User stories',
    summary: 'From PRD to executable stories',
    tooltip: 'Not available in v0 — planned after features are scoped.',
  },
  {
    id: 'test-first-workflows',
    title: 'Test-first workflows',
    summary: 'Stories with tasks and prompts per task',
    tooltip: 'Not available in v0 — task splitting with a prompt for each task.',
  },
  {
    id: 'delivery',
    title: 'Delivery',
    summary: 'Cursor packaging for v0',
    tooltip: 'Not available in v0 — export your work directly to Cursor.',
  },
] as const
