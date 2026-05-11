<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/prd-versioning.md
-->

# Scope Slice: Browse and switch PRD versions

## Parent Feature Area

[PRD versioning](../feature-areas/prd-versioning.md)

## Status

`exploratory`

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
|       |      |                                  |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
|        |           |       |

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
| `create-or-capture-prd-version` | Scope Slice | exploratory | At least one version must exist to browse; list is empty until a version is created |

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

- [ ] User value stated without implementation language
- [ ] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (including error and empty states)
- [ ] Business objects named
- [ ] Credit / payment impact assessed
- [ ] Sharing / privacy surface assessed
- [ ] Feedback / instrumentation impact assessed
- [ ] All dependencies named and their status known
- [ ] All blockers resolved or NEED_HUMAN=true explicitly set
- [ ] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** NOT READY

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice prd-versioning` proposal via `/feature-area scaffold-slices` | — |
