# Implementation Plan: Revoke read-only share link (v0)

## Parent User Story

[Revoke read-only share link (v0)](../user-stories/read-only-sharing--revoke-link-and-noindex--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extend the PRD repository port with `revokeReadOnlyShareLink`, implemented in `DrizzlePrdRepository` using the same ownership join as minting (`share_links` → `prd_versions` → `projects`). On success, set `enabled = false` and `disabled_at`; if already disabled, return the current row without changing `disabled_at`. Add a thin application use case that delegates to the port. Refactor `POST /api/share/disable` to validate `DisableShareLinkRequestSchema`, authenticate via `requireUser`, call the use case, and validate the outbound payload with `ShareLinkMintResponseSchema` (same row shape as mint). Errors map to HTTP via existing `ApplicationError` status codes. Uses `@repo/result` Result discipline per `73-result-rop.mdc`. Noindex for `/share/[token]` is already satisfied by page metadata; no code change required there.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle |
| Auth source-of-truth | better-auth (`requireUser` guard) |
| Async/sync boundary | Synchronous per request |
| Transaction boundary | Single update statement in repository method |
| External dependencies | None |
| Payment shape (if money) | n/a |
| ↳ Webhook idempotency mechanism (if Payment shape ≠ n/a) | n/a |
| ↳ Webhook signature secret source (if Payment shape ≠ n/a) | n/a |
| ↳ Reservation vs deduct-after-success (if Payment shape ≠ n/a) | n/a |

### Surface Blockers

- none

---

## Layers Affected

- [x] `domain` — extend `IPrdRepository` with `revokeReadOnlyShareLink`
- [x] `application` — `RevokeReadOnlyShareLinkUseCase`
- [x] `contracts` — `DisableShareLinkRequestSchema` in `packages/contracts/src/share/revoke.ts`
- [x] `infrastructure` — `DrizzlePrdRepository.revokeReadOnlyShareLink`
- [x] `app` (routes, server actions, server components) — `app/api/share/disable/route.ts`
- [ ] `ui` — none
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/share/revoke.ts` | modify | Request schema for disable body |
| `packages/contracts/src/share/revoke.test.ts` | modify | Contract tests |
| `packages/contracts/src/share/index.ts` | modify | Re-export revoke |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port method |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | Drizzle revoke implementation |
| `apps/web/src/application/prd/revoke-read-only-share-link-usecase.ts` | add | Use case |
| `apps/web/src/application/prd/revoke-read-only-share-link-usecase.test.ts` | add | Unit test |
| `apps/web/src/application/prd/index.ts` | modify | Export use case |
| `apps/web/app/api/share/disable/route.ts` | modify | Thin adapter |
| `docs/product/scope-slices/read-only-sharing--revoke-link-and-noindex.md` | modify | Slice refinement + promotion |
| `docs/execution/user-stories/read-only-sharing--revoke-link-and-noindex--v0.md` | add | User story |
| `docs/execution/plans/read-only-sharing--revoke-link-and-noindex--v0.plan.md` | add | This plan |
| `docs/state/orchestration.pipeline.json` | modify | Link story + plan |
| `docs/state/status.json` | modify | Orchestration + FA mirror |
| `docs/state/HANDOFF.md` | modify | Next action |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `DisableShareLinkRequestSchema` | add | `revoke.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| — | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/share/revoke.test.ts` | contract | Invalid / valid disable body |
| `apps/web/src/application/prd/revoke-read-only-share-link-usecase.test.ts` | unit | Delegation + error propagation |

---

## Dependencies Added

- none

---

## Rollback

Revert the commit(s) on the tracking branch; no schema migration. Re-enable links would require a separate data repair if ever needed (out of v0 scope).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Client expects old raw Drizzle row shape | Low | Medium | Outbound validated with same schema as mint |

---

## Out of Scope (deliberate)

- E2E browser flow for disable button (UI may already call API — unchanged scope)
- Changing `GET` anonymous error messages
- New migrations or new columns

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Port + adapter only; no route DB |
| scope-critic | PASS | Matches slice boundary |

---

## Approval

- [x] User reviewed and approved this Plan (orchestrator instruction: execute read-only-sharing revoke slice)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan | cloud-agent |
