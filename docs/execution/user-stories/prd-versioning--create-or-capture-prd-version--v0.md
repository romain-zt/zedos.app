# User Story: Create or capture PRD version (v0)

## Parent Scope Slice

[Create or capture PRD version](../../product/scope-slices/prd-versioning--create-or-capture-prd-version.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  

---

## Story

As a signed-in founder in a project workspace, I want the app to establish and persist a first in-app PRD version when none exists so my PRD work has a canonical record without exporting files.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and own the project | I open the project workspace (or it loads PRD versions) | The app ensures at least one PRD version exists for that project |
| AC-2 | No PRD version row exists yet for the project | The ensure action completes | Version **1** is created with in-app (JSON) content and draft status |
| AC-3 | At least one PRD version already exists | The ensure action runs again | No extra version **1** is created; the existing version is returned |
| AC-4 | Ensure and list succeed | The workspace finishes loading versions | I can see at least one version identity (metadata) for my project |
| AC-5 | The ensure or list request fails with a non-auth error | I am still in the workspace | I see an error signal (e.g. toast) that PRD versions could not be loaded |
| AC-6 | I am not signed in | The client calls the API | The client receives 401 and does not mislabel it as a generic “init” failure |

---

## Test Plan

- [x] `packages/contracts` — contract tests for ensure request/response schemas
- [x] `pnpm typecheck` and `pnpm build` on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/prd/prd-contracts.ts` | modify | Request/response zod for POST ensure |
| `apps/web/src/application/prd/ensure-first-prd-version-usecase.ts` | add | Ownership + ensure orchestration |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port: `ensureFirstVersion` |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | Drizzle implementation |
| `apps/web/app/api/projects/[id]/prd/route.ts` | modify | POST ensure + existing GET |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Call ensure before list |
| Product / execution / state docs | modify | Governance + orchestration bookkeeping |

---

## Out of Scope

- Browse/switch version UI slice
- Markdown/PDF export as completion gate
- Owner-milestone instrumentation
- Multi-user collaboration on versions

---

## Open Questions

None.

---

## Decision References

None.
