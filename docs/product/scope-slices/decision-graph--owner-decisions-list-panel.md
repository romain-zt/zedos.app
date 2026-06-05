# Scope Slice: Owner decisions list panel

## Parent Feature Area

[Decision graph](../feature-areas/decision-graph.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

I browse all product decisions chronologically and filter by PRD section so I can audit rationale before sharing or exporting.

---

## Exact Boundary

### Included Behavior

- Owner-only **Decisions** tab in project workspace.
- List columns at product level: question text, chosen option, timestamp, linked section labels.
- Sort **newest first** (`createdAt` desc).
- Filter by **section** identifier.
- Selecting a row highlights or scrolls to linked PRD sections in viewer (coordination with badges slice optional v1).

### Excluded Behavior

- Graph visualization.
- Anonymous share surface.
- `decisions.json` export.
- Editing decision text in place (read-only log v1).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty | No decisions yet | Empty state pointing to Clarify |
| Populated | ≥1 decision | Filterable list |
| Filtered | Section filter active | Subset of decisions |
| Loading | Fetch in flight | Skeleton list |
| Error | Load failed | Retry message |
| Gated — not owner | Non-owner session | Tab hidden or forbidden |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Decision | Read | List + filter |
| DecisionLink | Read | Section associations |
| PRD version / sections | Read | Labels for filter |

---

## Credit / Payment Impact

None.

---

## Sharing / Privacy Impact

None — owner-only; share viewers cannot access tab.

---

## Feedback / Instrumentation Impact

Optional analytics: `decisions_tab_opened` — not required for story readiness.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `decision-graph--persist-from-question-history` | Scope Slice | ready-for-user-stories | Data must exist |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A signed-in **owner** opens **Decisions**, sees a chronological list with working **section filter**, and can navigate from a decision to its linked PRD context.

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
