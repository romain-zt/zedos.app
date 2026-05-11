# Implementation Plan: Create or capture PRD version (v0)

## Parent User Story

[Create or capture PRD version (v0)](../user-stories/prd-versioning--create-or-capture-prd-version--v0.md)

## Status

`executed`

> **Layout in effect:** `apps/web/` + `packages/**`  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator phase `fa-prd-versioning--create-or-capture-prd-version` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-prd-versioning--create-or-capture-prd-version-1778510852379`.  
> **PR sizing:** This phase bundles app + contracts + governance on the orchestrator tracking PR (#45); exceeds default single-PR layer limits by **orchestrator bundle** (same pattern as prior tracking PRs).

---

## Approach

Add an **idempotent “ensure first PRD version”** path: zod-validated `POST` body on `app/api/projects/[id]/prd` delegates to `EnsureFirstPrdVersionUseCase`, which verifies project ownership then calls `IPrdRepository.ensureFirstVersion` (insert v1 draft with default or supplied JSON content when no row exists). Reuse `Result` / `ApplicationError` mapping in the route with outbound `CapturedPrdVersionResponseSchema` validation. **Project workspace** client calls POST before GET when loading versions so the list is never empty for a new project. Extend domain `PrdStatus` if the DB uses additional status values already persisted.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Per repository operation (no cross-request queue) |
| External dependencies | None for this slice |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `PrdStatus`, `IPrdRepository.ensureFirstVersion`
- [x] `application` — `EnsureFirstPrdVersionUseCase`
- [x] `contracts` — request/response schemas
- [x] `infrastructure` — `DrizzlePrdRepository.ensureFirstVersion`
- [x] `app` — `route.ts` POST
- [x] `ui` — `project-workspace.tsx` client fetch sequence

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/prd/prd-contracts.ts` | modify | `CreateOrCapturePrdVersionRequestSchema`, `CapturedPrdVersionResponseSchema`, `PrdVersionDTOSchema` |
| `packages/contracts/src/prd/prd.contract.test.ts` | add | Contract tests |
| `apps/web/src/domain/prd/prd.ts` | modify | `PrdStatus` union if needed |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port signature |
| `apps/web/src/application/prd/ensure-first-prd-version-usecase.ts` | add | Use case |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | `ensureFirstVersion` |
| `apps/web/app/api/projects/[id]/prd/route.ts` | modify | POST |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Ensure-before-list |
| `docs/product/scope-slices/prd-versioning--create-or-capture-prd-version.md` | modify | Refine + ready |
| `docs/product/feature-areas/prd-versioning.md` | modify | Slice complete row |
| `docs/execution/user-stories/prd-versioning--create-or-capture-prd-version--v0.md` | add | Story |
| `docs/execution/plans/prd-versioning--create-or-capture-prd-version--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | Step complete + `fa_prd_versioning` mirror |
| `docs/state/HANDOFF.md` | modify | Phase handoff |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `CreateOrCapturePrdVersionRequestSchema` | add | `prd.contract.test.ts` |
| `CapturedPrdVersionResponseSchema` | add | `prd.contract.test.ts` |
| `PrdVersionDTOSchema` | modify | (existing consumers; optional test coverage) |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/prd/prd.contract.test.ts` | contract | Valid/invalid ensure request; valid/invalid captured response |
| `pnpm typecheck` | repo | Clean |
| `pnpm build` | repo | Next build succeeds |

---

## Dependencies Added

- None

---

## Rollback

Revert commits on the orchestrator tracking branch; no migration. Deletes of inserted v1 rows are optional data cleanup if rollback happens after deploy.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Duplicate ensure races | low | duplicate version rows | DB uniqueness on `(projectId, versionNumber)` if not already enforced; follow-up if observed |

---

## Out of Scope (deliberate)

- Dedicated “Create version” button UX (auto-ensure only in v0)
- E2E Playwright
- Owner-milestone events

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Stack aligned to hex + contracts |
| scope-critic | PASS | Matches slice boundary (no browse/export) |

---

## Approval

- [x] User / orchestrator reviewed and approved this Plan (tracking phase prompt)
- [x] Verification: typecheck + build
- [x] Contract tests for new schemas

**Approval status:** approved via orchestrator instruction 2026-05-11  
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan + executed | cloud-agent |
