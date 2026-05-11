# User Story: List and open project (v0)

## Parent Scope Slice

[List and open project](../../product/scope-slices/project-workspace--list-and-open-project.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  

---

## Story

As a signed-in founder, I want to see my projects on the dashboard and open one so I can continue PRD and clarification work inside that project.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in | I land on the dashboard | I see my projects (or empty state) after loading |
| AC-2 | I have at least one project | I select a project from the dashboard or Projects page | I navigate to that project workspace |
| AC-3 | I have no projects | I view the dashboard / Projects | I see an empty state with a path to create a project |
| AC-4 | Loading the project list | The request is in flight | I see a loading state |
| AC-5 | The list request errors | Fetch fails or returns non-OK | I see an error state with retry, not a fake empty list |
| AC-6 | I open a URL for a project I do not own or that does not exist | I hit `/dashboard/projects/[id]` | I am sent back to the projects list |

---

## Test Plan

- [x] `GetProjectUseCase` unit test (delegates to repository; not-found path)
- [x] `pnpm typecheck` and `pnpm build` pass on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/projects/[id]/page.tsx` | modify | Open project via `GetProjectUseCase` + repository (no app-layer Prisma) |
| `apps/web/app/dashboard/projects/page.tsx` | modify | Typed list, list fetch error UX |
| `apps/web/app/dashboard/page.tsx` | modify | List fetch error UX |
| `apps/web/src/application/project/get-project-usecase.ts` | modify | Precise `Result<Project, …>` return type |
| Slice / FA / execution docs / status | modify | Governance closure |

---

## Out of Scope

- Switch-active-project while inside a workspace
- Search, filter, sort, archive, delete (except existing delete on Projects page)

---

## Open Questions

None.

---

## Decision References

None.
