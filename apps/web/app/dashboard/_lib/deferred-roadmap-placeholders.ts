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
    id: 'cursor-packaging',
    title: 'Cursor packaging',
    summary: 'Exporting work to your editor',
    tooltip: 'Not available in v0 — planned after the PRD slice.',
  },
  {
    id: 'user-stories-delivery',
    title: 'User stories & delivery',
    summary: 'Beyond the PRD document',
    tooltip: 'Not available in v0 — planned after the PRD slice.',
  },
  {
    id: 'test-first-workflows',
    title: 'Test-first workflows',
    summary: 'Automated quality gates',
    tooltip: 'Not available in v0 — planned after the PRD slice.',
  },
  {
    id: 'architecture-analysis',
    title: 'Architecture analysis',
    summary: 'Deeper structure after PRD stability',
    tooltip: 'Not available in v0 — planned after the PRD slice.',
  },
] as const
