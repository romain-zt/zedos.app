# Implementation Plan: Mint read-only link (v0)

## Parent User Story

[Mint read-only link (v0)](../user-stories/read-only-sharing--mint-read-only-link--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add Zod contracts for mint request/response. Extend the PRD repository port and Drizzle adapter to enforce ownership, reuse an existing enabled share row per PRD version, or insert a new one with a random token — all behind `Result<T, ApplicationError>`. Add `MintReadOnlyShareLinkUseCase` and refactor `POST /api/share/create` to parse input with Zod, call the single use case, and validate outbound JSON with `ShareLinkMintResponseSchema`. Update the PRD viewer to `safeParse` the response for client-side contract alignment. Follow rules 72–74, 77 (thin route).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Single use-case / single insert path |
| External dependencies | None for mint |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `MintedShareLink`, `IPrdRepository.mintReadOnlyShareLink`
- [x] `application` — `MintReadOnlyShareLinkUseCase`
- [x] `contracts` — `packages/contracts/src/share/mint.ts`
- [x] `infrastructure` — `DrizzlePrdRepository.mintReadOnlyShareLink`
- [x] `app` (routes) — `apps/web/app/api/share/create/route.ts`
- [x] `ui` — `prd-viewer.tsx` (client validation only)

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/share/mint.ts` | modify | Request/response zod |
| `packages/contracts/src/share/mint.test.ts` | modify | Contract tests |
| `packages/contracts/src/share/index.ts` | modify | Re-exports |
| `packages/contracts/src/index.ts` | modify | Barrel |
| `packages/contracts/src/prd/prd-contracts.ts` | modify | `ShareLinkSummarySchema` |
| `apps/web/src/domain/prd/prd.ts` | modify | `MintedShareLink` |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port method |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | Implementation |
| `apps/web/src/application/prd/mint-read-only-share-link-usecase.ts` | modify | Use case |
| `apps/web/src/application/prd/mint-read-only-share-link-usecase.test.ts` | modify | Unit test |
| `apps/web/src/application/prd/index.ts` | modify | Export |
| `apps/web/app/api/share/create/route.ts` | modify | Thin route |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Response validation |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `ShareLinkSummarySchema`, `CreateShareLinkRequestSchema`, `ShareLinkMintResponseSchema` | add | `mint.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/share/mint.test.ts` | contract | Schemas parse valid/invalid |
| `apps/web/src/application/prd/mint-read-only-share-link-usecase.test.ts` | unit | Use case delegates |

---

## Dependencies Added

- None

---

## Rollback

Revert the PR; no forward-only schema changes.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Idempotent POST changes status code vs legacy | Low | Low | Client uses `res.ok`; success paths unchanged for UX |

---

## Out of Scope (deliberate)

- Share read route and SEO (`anonymous-read-surface`)
- Disable/revoke API beyond existing `/api/share/disable` behavior

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Ports + contracts only at boundaries |
| scope-critic | PASS | Matches slice exclusions |

---

## Approval

- [x] User reviewed and approved this Plan (orchestrator / tracking PR)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan for mint read-only link slice | — |
