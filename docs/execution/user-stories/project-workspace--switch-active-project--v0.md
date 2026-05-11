# User Story: Switch active project (v0)

## Parent Scope Slice

[Switch active project](../../product/scope-slices/project-workspace--switch-active-project.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  

---

## Story

As a signed-in founder inside a project workspace, I want to switch to another owned project without going back to the dashboard so I can keep working across multiple ideas.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and my route is a project workspace (`/dashboard/projects/[id]`) | The shell loads | I see an in-header control to change the active project |
| AC-2 | The project list request succeeds | I open the control | I see my owned projects and the current one is indicated |
| AC-3 | I choose a different owned project | I confirm the selection | I navigate to that project's workspace; I remain signed in |
| AC-4 | The list request is in flight | I view the control | I see a loading-capable state (no fake empty list) |
| AC-5 | The list request fails | I view the workspace | I see an error message with retry, not a silent empty control |
| AC-6 | I have no projects (edge) | I open the control | I see an empty explanatory state |

---

## Test Plan

- [x] `pnpm typecheck` and `pnpm build` pass on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/_components/project-switcher.tsx` | add | Client list + navigate (same `/api/projects` pattern as Projects page) |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Render switcher when pathname is under `/dashboard/projects/[id]` |
| Slice / FA / execution docs / state | modify | Governance closure |

---

## Out of Scope

- Dashboard-first project open (owned by list-and-open slice)
- Multi-owner / shared projects
- Persisting drafts across switches
- Coordinating multiple browser tabs

---

## Open Questions

None.

---

## Decision References

None.
