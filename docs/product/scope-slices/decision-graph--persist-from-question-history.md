# Scope Slice: Persist decisions from question history

## Parent Feature Area

[Decision graph](../feature-areas/decision-graph.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

My past clarification turns appear as durable **decisions** linked to my PRD, without re-entering data.

---

## Exact Boundary

### Included Behavior

- Map each **question history** entry to a **Decision** row plus optional **DecisionLink** when PRD section impact is known.
- **Idempotent backfill** for existing projects (no duplicate decisions on re-run).
- New **clarify** turns create Decision rows synchronously with the history entry.
- Fields at product level: chosen option, rejected alternatives (may be empty), section linkage, timestamps.

### Excluded Behavior

- Owner **Decisions** list UI (`decision-graph--owner-decisions-list-panel`).
- PRD section **badges** (`decision-graph--section-badges-and-links`).
- `decisions.json` in Cursor zip (`decision-graph--export-decisions-json`).
- Force-directed graph visualization.
- Anonymous share viewers reading decisions.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Silent success | Clarify turn completes | No new UI; decisions exist for downstream slices |
| Backfill — in progress | Owner opens project first time after ship | Optional background progress; no blocking modal v1 |
| Backfill — complete | Migration done | Clarify continues; history visible in later slices |
| Error — mapping failed | Persist error | Clarify still usable; decision row skipped with owner-safe log (no PII leak) |
| Empty history | New project | No decisions until first clarify turn |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Decision | Create | From question history |
| DecisionLink | Create | Optional section association |
| Question history | Read | Source records |

---

## Credit / Payment Impact

None — persistence is not an AI billable operation; clarify steps that create history retain existing burn tiers.

---

## Sharing / Privacy Impact

None — decisions are owner-private until future export slice; share viewers do not see decision log.

---

## Feedback / Instrumentation Impact

None — no new milestone prompt in this slice.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| FA-question-history | Feature Area | complete | Source data |
| FA-prd-versioning | Feature Area | complete | Version scoping |
| `docs/product/decision-graph-v1-spec.md` | Spec | complete | Object model |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

After clarify or backfill, every eligible **question history** entry has at most one corresponding **Decision**, new turns create decisions automatically, and re-running backfill does not duplicate rows.

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
