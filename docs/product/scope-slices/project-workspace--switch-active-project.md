<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: Switch active project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

While working inside a project, founder can navigate to a different project without returning to the dashboard first.

---

## Exact Boundary

### Included Behavior

- While the founder is inside a project context (e.g. working on a PRD or reviewing clarification history), they can switch to a different owned project.
- The in-product navigation path (not the dashboard) is the entry point for this slice.
- Switching to another project places the founder inside that project's workspace context.
- Account context is preserved — the founder remains signed in throughout.

### Excluded Behavior

- Navigating between projects via the dashboard entry point (that is `list-and-open-project`).
- Opening projects owned by other accounts (solo v0: single-owner only).
- Preserving unsaved in-progress work across a project switch (behavior depends on PRD versioning auto-save semantics — out of scope for this slice).
- Multi-tab / multi-window project management.

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

None — switching projects does not consume credits or trigger any payment interaction.

---

## Sharing / Privacy Impact

None — project switching is an owner-only in-product navigation action; no share surface is affected.

---

## Feedback / Instrumentation Impact

None — project switching is not a defined milestone trigger in PRD v1.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Account & session | Feature Area | pending | Owner identity required; session must persist across project context switch |
| `list-and-open-project` | Scope Slice | exploratory | The set of projects to switch to is the same as the owner's project list |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| — | — | — |

---

## Acceptance-Level Outcome

A signed-in founder working inside one project can select a different owned project from within the product and be placed inside that project's workspace, without losing their signed-in state and without being required to go back to the dashboard to do so.

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
