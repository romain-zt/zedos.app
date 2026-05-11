<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/question-history.md
-->

# Scope Slice: Owner views question history

## Parent Feature Area

[Question history](../feature-areas/question-history.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Signed-in founder can browse the full decision log in their private workspace — seeing what was asked, what options existed, what they chose, and how it impacted the PRD.

---

## Exact Boundary

### Included Behavior

- Signed-in owner can access the structured decision log within their private workspace.
- The log displays entries with all six PRD-defined fields visible: structured question, available options, founder's answer, optional comment, AI interpretation, PRD impact.
- Entries are contextually associated with the relevant project and PRD version.
- The view is accessible only to the signed-in owner — not on the anonymous share surface.

### Excluded Behavior

- Exposing any part of the history log on the anonymous share surface (owner-private per PRD).
- Editing or deleting decision entries from the view (entries are produced by the clarification flow; this slice is read-only browsing).
- Collaboration features: comments from others, shared history with invited editors (Hard v0 exclusion).
- Exporting the history log as a standalone file (not a v0 requirement).
- Search or advanced filter on entries (not in v0 scope).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Loading | History tab opened; first fetch in flight | Skeleton placeholders |
| Empty | No decision rows for this project | Explainer that decisions from clarification appear here |
| Success | At least one row returned | Scrollable list; each entry shows all six structured fields + PRD version association when present |
| Error | Network failure or non-OK response | Short message + retry affordance |
| Stale refresh | User returns to History tab after clarification | List refetches so new decisions appear without full page reload |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Question history (structured decision entries) | Read | Existing GET `/api/projects/:id/questions`; owner-only via session + project ownership |
| PRD version metadata | Read (client) | Workspace already loads PRD versions; used only to label `prdVersionId` in the history list |

---

## Credit / Payment Impact

None — browsing the history log does not consume credits.

---

## Sharing / Privacy Impact

The history view is strictly owner-private. The anonymous share surface must never expose entries from this log — boundary enforcement coordination with `read-only-sharing` FA is required.

---

## Feedback / Instrumentation Impact

None — viewing question history is not a defined milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| `persist-structured-decision-entries` | Scope Slice | complete | Entries must be stored before they can be browsed |
| Project workspace | Feature Area | validated | History is scoped per project and PRD context |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can open their question history in the private workspace and see the structured log of all product decisions made in the clarification flow; each entry shows the question, options, their answer, and the PRD impact; the log is not visible to anyone outside the signed-in owner session.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice question-history` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX/Data/dependencies; marked ready-for-user-stories for History tab execution | — |
| 2026-05-11 | Implementation complete (v0 History tab UI); orchestration step complete | — |
