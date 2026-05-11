<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/prd-versioning.md
-->

# Scope Slice: Browse and switch PRD versions

## Parent Feature Area

[PRD versioning](../feature-areas/prd-versioning.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder can see all PRD versions within a project and move to any version to review or continue working on it.

---

## Exact Boundary

### Included Behavior

- Founder can view a list of all PRD versions that exist within the current project.
- Each version entry shows enough context to identify it (at minimum: version identifier).
- Founder can switch the active view to a selected version.
- The product clearly communicates which version is currently active.

### Excluded Behavior

- Co-editing versions with collaborators (Hard v0 exclusion).
- Merging or combining versions.
- Diffing or comparing versions side by side.
- Deleting or archiving versions in v0.
- Creating a new version (that is `create-or-capture-prd-version`).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Loading / pending | Workspace is fetching PRD versions | PRD area may be empty or stale until the list arrives; user remains in the project |
| Empty (transitional) | Ensure-first-version has not completed yet | No versions to show until the sibling slice creates version 1 |
| Single version | Exactly one PRD version row | Selector still shows the identity of that version; copy explains there is only one |
| Multiple versions | Two or more rows | List / picker shows each version (at least version number + status where available); user can switch |
| Active version | After user picks or default selection | Prominent “active version” indication in the PRD panel and consistent tab affordance |
| Error (load) | List fetch fails or payload invalid | User sees an error signal (e.g. toast) that versions could not be loaded; stays signed in and in the project |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | read | List and display metadata and content for versions in the current project |
| Project | read | Versions scoped to the open project; no project switch in this slice |

---

## Credit / Payment Impact

None — browsing and switching versions does not consume credits.

---

## Sharing / Privacy Impact

Version navigation is owner-only. However, the version a founder is viewing when they mint a share link determines what is shown on the anonymous read surface — the `read-only-sharing` FA must coordinate on version semantics.

---

## Feedback / Instrumentation Impact

None — version browsing is not a defined milestone trigger in PRD v1. The "PRD reopened / viewed by owner after generation" milestone is scoped to the PRD generation moment, not routine version navigation.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Project workspace | Feature Area | validated | Versions are scoped to a project |
| `create-or-capture-prd-version` | Scope Slice | complete | At least one version must exist to browse; ensure-first runs before list in the workspace |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder inside a project can see all PRD versions for that project and switch to any of them; the active version is clearly indicated; switching does not lose the founder's signed-in or project context.

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
| 2026-05-11 | Refined UX states, data touched, dependency on create-or-capture → complete; promoted to ready-for-user-stories | cloud-agent |
