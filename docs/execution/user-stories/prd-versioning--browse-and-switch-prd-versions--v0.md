# User Story: Browse and switch PRD versions (v0)

## Parent Scope Slice

[Browse and switch PRD versions](../../product/scope-slices/prd-versioning--browse-and-switch-prd-versions.md)

## Status

`done`

> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  

---

## Story

As a signed-in founder in a project workspace, I want to see every PRD version for my project and switch which one I am viewing so I can review past iterations without losing my place in the app.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and own the project | The workspace loads PRD versions (after the ensure path) | I see metadata for every version that exists for that project |
| AC-2 | Multiple versions exist | I use the version picker | I can select any version; the PRD area shows that version’s content |
| AC-3 | Only one version exists | I open the PRD area | The active version is obvious and I am not prompted as if I had “reopened” the PRD just by viewing it |
| AC-4 | I change the selected version | I stay on the PRD tab or related workspace | The UI indicates which version is active (including on the PRD tab affordance) |
| AC-5 | The list response does not match the expected shape | The client receives the payload | I see a clear error that PRD versions could not be loaded |

---

## Test Plan

- [x] `packages/contracts` — contract tests for list response schema
- [x] `pnpm typecheck` and `pnpm build` on tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/prd/prd-contracts.ts` | modify | List response + DTO boundary schemas |
| `apps/web/app/api/projects/[id]/prd/route.ts` | modify | Outbound validation for GET list |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Typed list fetch + active-version affordance |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Version selector + active version context |
| `apps/web/src/contracts/prd/prd-contracts.ts` | modify | Sync app-local contract mirror |
| Product / execution / state docs | modify | Governance + orchestration bookkeeping |

---

## Out of Scope

- Co-editing, merging, diffing, or deleting versions
- Creating a new version (other slice)
- Share-link semantics beyond “active viewed version drives minted snapshot” (coordination with read-only sharing FA)

---

## Open Questions

None.

---

## Decision References

None.
