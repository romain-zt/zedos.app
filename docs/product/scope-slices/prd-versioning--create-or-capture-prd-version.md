<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/prd-versioning.md
-->

# Scope Slice: Create or capture PRD version

## Parent Feature Area

[PRD versioning](../feature-areas/prd-versioning.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder establishes a new PRD version line and the document state for that version is persisted in-app as the canonical record — not contingent on any export.

---

## Exact Boundary

### Included Behavior

- A new PRD version is established within a project (either explicitly by the founder, or captured automatically when the first PRD output is produced).
- The PRD content for that version is persisted in-app as the authoritative record.
- "Done" for a version is not gated on Markdown or PDF export — in-app persistence is sufficient.
- The version is identified and distinguishable from other versions in the same project.

### Excluded Behavior

- Markdown export or PDF export as a mandatory completion step (Hard v0 exclusion per PRD).
- Co-editing or version branching with collaborators (Hard v0 exclusion).
- Browsing or switching between existing versions (that is `browse-and-switch-prd-versions`).
- Diffing versions or showing a change history view.

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| First visit / no version yet | A signed-in owner opens the project workspace and the app ensures a first version exists | The app creates version **1** in the background with placeholder in-app content; the workspace can load version metadata without blocking on exports |
| Idempotent ensure | The ensure action runs again (reload, duplicate request) | No duplicate version **1**; the existing row is returned |
| Success (list) | Ensure succeeded and list fetch succeeds | The founder sees at least one PRD version for the project in the workspace UI |
| Unauthorized | Session missing or invalid | API returns 401; the client does not treat this as an initialization failure worth retrying as “PRD init” |
| Server / validation error | Non-401 failure on ensure or list | User-visible error (toast) that PRD versions could not be loaded or initialized |
| Wrong project / not owner | Authenticated user does not own the project | Access error from the API (mapped to existing application error semantics) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | Create (conditional), read | First version per project when none exists — version number 1, draft status, JSON content in-app |
| Project | Read | Ownership check before any write |
| (Future) Owner milestones | — | Instrumentation hooks deferred — see Feedback section |

---

## Credit / Payment Impact

None — creating or capturing a PRD version does not itself consume credits (AI credit consumption happens in the clarification/generation flow, not in version persistence).

---

## Sharing / Privacy Impact

This slice defines the stable "what is shown" semantics for a PRD version — the `read-only-sharing` FA's share surface must reference a version established here. No public content is exposed by this slice itself; it is the upstream prerequisite for sharing.

---

## Feedback / Instrumentation Impact

This slice maps to two owner milestone triggers defined in PRD v1:
- "First PRD version created" — triggers the first owner feedback prompt.
- "PRD version updated after clarification" — triggers a feedback prompt on subsequent updates.

Coordination with `owner-milestone-feedback` FA is required.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Project workspace | Feature Area | complete (orchestrated) | Versions attach to a project container |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder working in a project can establish a PRD version and have its content persisted in-app; the version is accessible and identifiable within the project; "done" is declared when the content is saved in-app, regardless of whether any file export has occurred.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice prd-versioning` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX states, data touched, readiness; promoted to `ready-for-user-stories` — orchestrator `fa-prd-versioning--create-or-capture-prd-version` | cloud-agent |
