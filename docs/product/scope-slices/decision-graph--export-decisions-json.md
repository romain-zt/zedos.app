# Scope Slice: Export decisions JSON

## Parent Feature Area

[Decision graph](../feature-areas/decision-graph.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

My Cursor export package includes **decisions.json** so my coding agent inherits structured decision context.

---

## Exact Boundary

### Included Behavior

- When owner runs **Cursor package export** and project has ≥1 **Decision**, zip includes **`decisions.json`** validated by product schema (contract at implement time).
- When **zero** decisions, file **omitted** from zip (not empty stub).
- JSON contains product-level fields needed for agent context (question, chosen option, rejected options, section ids, timestamps) per `decision-graph-v1-slices-and-acceptance.md`.

### Excluded Behavior

- Standalone download of decisions without full Cursor package.
- Share link exposure of JSON.
- PDF or Markdown export of decisions only.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Included | Export with decisions | Zip listing shows `decisions.json` |
| Omitted | No decisions | Zip unchanged from prior delivery slice |
| Export error | Package build fails | Existing delivery error UX |
| Builder/free gate | Export gated | Follows `delivery--export-cursor-conversion-gate` |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Decision | Read | Serialize to JSON |
| Cursor delivery package | Update | Add file member |

---

## Credit / Payment Impact

None — export file generation rides existing delivery export rules.

---

## Sharing / Privacy Impact

None — JSON only inside owner-initiated export zip, not on public share page.

---

## Feedback / Instrumentation Impact

Optional: attribute export package includes_decisions flag — not blocking.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `decision-graph--persist-from-question-history` | Scope Slice | ready-for-user-stories | Source rows |
| `delivery--cursor-package-export` | Scope Slice | complete | Zip pipeline |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| _(none)_ | — | — |

---

## Acceptance-Level Outcome

A **builder-eligible** owner exporting a Cursor package for a project with decisions receives a zip containing a valid **`decisions.json`**; projects without decisions receive the same zip as today without that file.

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
