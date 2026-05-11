# User Story: Create project (v0)

## Parent Scope Slice

[Create project](../../product/scope-slices/project-workspace--create-project.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  

---

## Story

As a signed-in founder, I want to create a named project from my dashboard so that I can start PRD and clarification work in that project context immediately.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in | I open the projects area from the dashboard | I can start creating a new project (empty state or header action) |
| AC-2 | Create dialog is open | I submit without a name | I see that a name is required and no project is created |
| AC-3 | Create dialog is open | I enter a valid name (and optional description) and confirm | A project is created scoped to my account and I am taken into that project workspace |
| AC-4 | Create request fails (e.g. server error) | I confirm create | I see an error message and remain able to retry |
| AC-5 | Projects list is loading | I open the page | I see a loading state before results or empty state |

---

## Test Plan

- [x] CreateProjectUseCase rejects empty name and persists valid project (unit — existing `create-project-usecase.test.ts`)
- [x] `pnpm typecheck` and `pnpm build` pass on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/projects/page.tsx` | modify | Create flow UX, mobile layout, correct list field mapping |
| `apps/web/app/api/projects/route.ts` | modify | Auth + use cases; inbound/outbound zod validation; remove redundant prisma import |
| `docs/product/scope-slices/project-workspace--create-project.md` | modify | Slice refinement + ready-for-user-stories |
| `docs/execution/plans/project-workspace--create-project--v0.plan.md` | add | Approved implementation plan |
| `docs/state/status.json` | modify | Orchestration step completion |
| `docs/state/HANDOFF.md` | modify | Current phase handoff |

---

## Out of Scope

- List/open/switch project slices (separate scope slices)
- Project templates, cloning, import/export, collaborators

---

## Open Questions

None.

---

## Decision References

None.
