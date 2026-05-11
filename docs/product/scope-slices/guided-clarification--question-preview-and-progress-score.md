<!--
  Scope Slice — approved via /plan guided-clarification question-preview-and-progress-score
  Parent: docs/product/feature-areas/guided-clarification.md
-->

# Scope Slice: Question preview and progress score

## Parent Feature Area

[Guided clarification](../feature-areas/guided-clarification.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder sees at a glance how far they are in the clarification journey — both through a meaningful readiness score (answered sections vs. remaining) and a "Coming up" preview of the next 2–3 PRD areas yet to be explored, so they understand what the process still needs without feeling lost.

---

## Exact Boundary

### Included Behavior

- In the Clarify tab, a "Coming up" row shows 2–3 PRD section names not yet addressed based on existing question history (no AI call; no extra credit cost).
- The readiness score badge in the workspace header changes formula from the existing ADR-based calculation to: `answered_questions / (answered_questions + remaining_sections) × 100`, capped at 95 % until a PRD version has been generated.
- "Answered questions" = rows in `questionHistory` where `founderAnswer IS NOT NULL`.
- "Remaining sections" = 8 canonical PRD sections minus the count of distinct `prdImpact` values present in answered rows.
- The 8 canonical PRD sections are a fixed constant: `Product Vision`, `Target Users`, `Core Features`, `User Journeys`, `Technical Constraints`, `Success Metrics`, `Out of Scope`, `Open Questions`.
- The readiness score endpoint returns the new formula result plus `coveredSections[]` and `remainingSections[]` so clients can render detail if desired.
- The "Coming up" chips in the Clarify tab are computed entirely client-side from the already-loaded question history — zero additional network requests.

### Excluded Behavior

- No AI call to predict specific upcoming questions — the preview shows section names only (not full question text).
- No guarantee of order for upcoming questions (order follows the canonical list; actual AI question sequence may differ).
- No change to how `questionHistory` rows are stored or how credits are consumed.
- No changes to the PRD generation or Architecture tab.
- The existing ADR-based `ReadinessScoreUseCase` (Prisma path) is removed from the readiness-score route; downstream consumers using that route see the new formula. No other call-site for `ReadinessScoreUseCase` exists.
- Score does not update in real time within a session — it reflects state at mount; a page reload refreshes it.

---

## UX States

| State | When | What the user sees |
|-------|------|-------------------|
| **No history yet** | Zero questions answered | Coming up: first 3 sections from canonical list; score = 0 % |
| **Partial coverage** | Some sections answered | Coming up: next uncovered sections; score = answered / (answered + remaining) × 100 |
| **All sections covered, no PRD** | 8+ sections covered but no PRD generated | Score capped at 95 %; coming up: empty or "Ready to generate PRD" hint |
| **PRD generated** | At least one PRD version exists | Score may reach 100 %; coming up: empty or "All areas covered" |
| **Loading** | Readiness score badge fetching | Badge shows "..." or skeleton |
| **Error** | Readiness score fetch fails | Badge shows "—" gracefully; no crash |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Question history | read | `SELECT answered rows, DISTINCT prdImpact` — no writes from this slice |
| PRD version | read | Existence check to decide whether score can reach 100 % |

---

## Credit / Payment Impact

None — all computations are derived from existing stored data; no AI inference triggered by this slice.

---

## Sharing / Privacy Impact

None — readiness score and "coming up" sections are owner-only; not exposed on the anonymous share surface.

---

## Feedback / Instrumentation Impact

None directly. An improved readiness score may surface better milestone timing for the `owner-milestone-feedback` FA, but no direct hook changes in this slice.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Question history (persist entries) | Scope Slice | ready-for-user-stories | `questionHistory` rows must exist for score to be meaningful |
| Guided clarification (clarify route) | Feature Area | validated | Clarify tab is the host component for "Coming up" chips |
| PRD versioning | Feature Area | validated | PRD existence check for the 100 % cap |

---

## Blockers

None.

---

## Acceptance-Level Outcome

A signed-in founder using the Clarify tab sees a "Coming up" row listing the next PRD sections not yet covered by their answers. The readiness badge in the workspace header shows a percentage derived from `answered / (answered + remaining)` — transparent, predictable, and proportional to actual progress — rather than an opaque score. When all 8 sections have been addressed and a PRD version exists, the score reaches 100 %.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Created via `/plan` approval; parent FA promoted to `validated` same session | — |
