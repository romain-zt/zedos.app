# Scope Slice: Section badges and links

## Parent Feature Area

[Decision graph](../feature-areas/decision-graph.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I see which PRD sections are backed by recorded decisions and can jump to the decision list for that section.

---

## Exact Boundary

### Included Behavior

- On **PRD viewer** (owner workspace), each section with ≥1 **DecisionLink** shows a **badge** with count of distinct linked decisions.
- Sections with **no** links show **no badge**.
- Badge click navigates to **Decisions** tab with section filter pre-applied (coordination with list panel slice).

### Excluded Behavior

- Badges on **anonymous share** read surface.
- Graph visualization.
- Editing decisions from badge.
- Export JSON.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| No badge | Section without links | Section renders as today |
| Badge — count | One or more links | Numeric badge on section header |
| Badge — navigate | Owner clicks badge | Decisions list filtered to section |
| Loading | PRD + links loading | Badges appear after load |
| Share viewer | Anonymous read | No badges (owner-only feature) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| DecisionLink | Read | Per section counts |
| PRD version sections | Read | Viewer structure |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

**Yes** — explicitly **no change** to anonymous share content; badges are **owner-only** on private viewer.

---

## Feedback / Instrumentation Impact

None.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `decision-graph--persist-from-question-history` | Scope Slice | ready-for-user-stories | Links exist |
| `decision-graph--owner-decisions-list-panel` | Scope Slice | ready-for-user-stories | Navigation target |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

On the owner PRD viewer, sections with decisions show an accurate **count badge**, and clicking the badge opens the filtered **Decisions** list for that section.

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
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-04 | `/feature-area refine-slice` | — |
| 2026-06-04 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
