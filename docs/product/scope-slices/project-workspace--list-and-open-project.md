<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: List and open project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

Founder sees all owned projects at a glance and opens any one to resume work where they left off.

---

## Exact Boundary

### Included Behavior

- Founder is presented with a list of all projects owned by their account.
- Each project entry shows enough context to identify it (at minimum: name).
- Founder can select a project to open and be placed inside its workspace context.
- Entry point is the dashboard (before the founder is inside any specific project).

### Excluded Behavior

- Searching, filtering, or sorting projects by tags or custom criteria (not in v0).
- Archiving or deleting projects.
- Viewing projects owned by other accounts (solo v0: single-owner only).
- In-product navigation to another project while already inside one (that is `switch-active-project`).

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

None — listing and opening projects does not consume credits or trigger any payment interaction.

---

## Sharing / Privacy Impact

None — this slice shows only owner-private project data; no share surface is affected.

---

## Feedback / Instrumentation Impact

None — opening a project from the dashboard is not a defined milestone trigger in PRD v1. Note: the "PRD reopened / viewed by owner after generation" milestone is triggered inside the project at the PRD view level, not at project-open level.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Account & session | Feature Area | pending | Owner identity required to scope the project list |
| `create-project` | Scope Slice | exploratory | At least one project must exist to open; list is empty state until a project is created |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder arriving at the dashboard sees a list of their projects; selecting any project opens it and places them inside that project's workspace so they can continue PRD or clarification work.

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
