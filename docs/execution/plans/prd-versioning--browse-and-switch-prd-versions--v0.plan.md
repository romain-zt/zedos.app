# Implementation Plan: Browse and switch PRD versions (v0)

## Parent User Story

[Browse and switch PRD versions (v0)](../user-stories/prd-versioning--browse-and-switch-prd-versions--v0.md)

## Status

`executed`

> **Layout in effect:** `apps/web/` + `packages/**`  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator phase `fa-prd-versioning--browse-and-switch-prd-versions` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-prd-versioning--browse-and-switch-prd-versions-1778511720220`.  
> **PR sizing:** This phase bundles app + contracts + governance on the orchestrator tracking PR (#46); exceeds default single-PR layer limits by **orchestrator bundle** (same pattern as prior tracking PRs).

---

## Approach

Reuse the existing **list PRD versions** use case and `GET /api/projects/[id]/prd` path. Add **`PrdVersionListResponseSchema`** in `packages/contracts` and validate **outbound** payloads in the route before `Response.json`, per `74-contracts-zod.mdc`. On the client, parse the list with the same schema after fetch; hold **`PrdVersionDTO`**-typed state for the selected version; surface **active version** in the PRD viewer and tab affordance. Remove UX that treats **every version id change** as a “PRD reopened” milestone (that behavior is excluded by the parent slice’s feedback impact). No new repository methods — browse/switch is read + client selection only.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Per use case / repository call |
| External dependencies | None for this slice |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [ ] `domain` — _None_
- [ ] `application` — _None_ (existing list use case unchanged)
- [x] `contracts` — list response schema, DTO tightening
- [ ] `infrastructure` — _None_
- [x] `app` — `route.ts` outbound validation
- [x] `ui` — `project-workspace.tsx`, `prd-viewer.tsx`

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/prd/prd-contracts.ts` | modify | `PrdVersionDTOSchema`, `PrdVersionListResponseSchema` |
| `packages/contracts/src/prd/prd.contract.test.ts` | modify | Contract tests for list schema |
| `apps/web/src/contracts/prd/prd-contracts.ts` | modify | Mirror DTO/list schemas for app imports |
| `apps/web/app/api/projects/[id]/prd/route.ts` | modify | GET outbound `safeParse` |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Parse list; selected-version badge |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Selector + active context; drop wrong milestone hook |
| `docs/product/scope-slices/prd-versioning--browse-and-switch-prd-versions.md` | modify | Ready-for-user-stories |
| `docs/product/feature-areas/prd-versioning.md` | modify | Slice row **complete** |
| `docs/execution/user-stories/prd-versioning--browse-and-switch-prd-versions--v0.md` | add | Story |
| `docs/execution/plans/prd-versioning--browse-and-switch-prd-versions--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | Step complete + mirrors |
| `docs/state/HANDOFF.md` | modify | Phase handoff |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `PrdVersionDTOSchema` | modify | `prd.contract.test.ts` (coerce dates / int version) |
| `PrdVersionListResponseSchema` | add | `prd.contract.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/prd/prd.contract.test.ts` | contract | Valid list JSON; reject invalid rows |
| `pnpm typecheck` | repo | Clean |
| `pnpm build` | repo | Next build succeeds |

---

## Dependencies Added

- None

---

## Rollback

Revert commits on the orchestrator tracking branch; no migration.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API shape drift | low | client parse fails | Outbound + inbound zod at boundaries |
