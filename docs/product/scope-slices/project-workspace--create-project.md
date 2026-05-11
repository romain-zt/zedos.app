<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: Create project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder creates a named project container and can immediately start PRD work inside it.

---

## Exact Boundary

### Included Behavior

- Founder can initiate creation of a new project from the dashboard.
- Founder provides a name for the project (required).
- A new project is created and scoped to the signed-in owner's account.
- Founder is placed inside the new project context, ready to begin PRD or clarification work.

### Excluded Behavior

- Project templates or pre-filled content (not in v0).
- Duplicating or cloning existing projects.
- Import/export of project data as a creation path.
- Inviting collaborators at creation time (Hard v0 exclusion: multi-user).
- Setting project visibility or sharing settings at creation (that is the read-only-sharing FA).

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

None — project creation does not consume credits or trigger any payment interaction.

---

## Sharing / Privacy Impact

None — newly created projects are owner-private by default; no share surface is created or modified in this slice.

---

## Feedback / Instrumentation Impact

None — project creation is not a defined milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Account & session | Feature Area | pending | Owner identity required to scope the project to an account |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder can create a new project by providing a name; the project is immediately accessible in their workspace and scoped exclusively to their account; they can begin PRD work inside it without any additional steps.

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice project-workspace` proposal via `/feature-area scaffold-slices` | — |
