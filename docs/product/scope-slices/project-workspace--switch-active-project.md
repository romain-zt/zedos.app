<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: Switch active project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`ready-for-user-stories`

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
| Loading | Project list for the switcher is fetching | Trigger shows loading / disabled until first successful response or error |
| Success | List returned | Header control shows current project name; menu lists other owned projects |
| List error | GET /api/projects fails | Inline message + retry (same behavior family as list-and-open slice) |
| Empty list | Owner has no projects (edge) | Menu explains no projects; primary recovery remains dashboard / create flow |
| Selection | User picks another project | Client navigates to that project's workspace URL; session unchanged |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read (list by owner) | Same source as list-and-open: signed-in owner's project list via existing API |

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
| Account & session | Feature Area | complete | Session must persist across navigation |
| `list-and-open-project` | Scope Slice | complete | Project list semantics and `/api/projects` behavior |

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
| 2026-05-11 | Scaffolded from approved `/feature-area slice project-workspace` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Refined UX/data/deps for story-ready + orchestrated execution | Cloud agent |
