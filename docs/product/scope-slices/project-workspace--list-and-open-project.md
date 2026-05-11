<!--
  Scope Slice — scaffolded from approved /feature-area slice proposal
  Parent: docs/product/feature-areas/project-workspace.md
-->

# Scope Slice: List and open project

## Parent Feature Area

[Project workspace](../feature-areas/project-workspace.md)

## Status

`ready-for-user-stories`

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
| Loading | Dashboard or Projects page is fetching the list | Skeleton or placeholder rows until data resolves |
| Empty | Owner has no projects | Prompt to create a first project (existing create flow) |
| Success | List returned | Named entries with optional description snippet; tap/click opens workspace |
| List error | GET /api/projects fails (network, 401, 5xx) | Inline message + retry; not a silent empty list |
| Open denied | Project id missing or not owned | Redirect back to projects list (no partial workspace) |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| Project | Read (list by owner), Read (single by id + owner) | Scopes to signed-in user; same sources as create-project slice |

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
| Account & session | Feature Area | complete | Owner identity via better-auth |
| `create-project` | Scope Slice | complete | At least one project may exist; empty state remains valid |

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
| 2026-05-11 | Refined UX states, data touched, dependencies; promoted for user stories (orchestrator slice execution) | — |
