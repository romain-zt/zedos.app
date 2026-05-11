# Implementation Plan: Anonymous read surface (v0)

## Parent User Story

[Anonymous read surface (v0)](../user-stories/read-only-sharing--anonymous-read-surface--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add Zod contracts for the share-token path param shape and anonymous JSON response (`packages/contracts/src/share/anonymous-read.ts`). Extend `IPrdRepository` with `getAnonymousPrdVersionByShareToken`: Drizzle selects `share_links` joined to `prd_versions` **only**, validates rows with `AnonymousSharedPrdResponseSchema` before returning. Add thin `GetAnonymousSharedPrdUseCase` forwarding to the port. Replace `GET /api/share/[token]` with inbound `ShareReadTokenParamSchema`, use case invocation, outbound `AnonymousSharedPrdResponseSchema`, and sanitized HTTP messages (404/400/502/500). Update `SharedPrdView` to parse responses with zod client-side optional parse and strip any legacy `projectName` UI. Ship `loading.tsx` + `error.tsx` on the `[token]` segment.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle |
| Auth source-of-truth | Anonymous — none on read |
| Async/sync boundary | Sync per HTTP request |
| Transaction boundary | Single repository read |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `AnonymousSharedPrdSnapshot`, `IPrdRepository.getAnonymousPrdVersionByShareToken`
- [x] `application` — `GetAnonymousSharedPrdUseCase`
- [x] `contracts` — `packages/contracts/src/share/anonymous-read.ts`
- [x] `infrastructure` — `DrizzlePrdRepository.getAnonymousPrdVersionByShareToken`
- [x] `app` — `apps/web/app/api/share/[token]/route.ts`
- [x] `ui` — `apps/web/app/share/[token]/**`

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/share/anonymous-read.ts` | add/modify | Token + anonymous response zod |
| `packages/contracts/src/share/anonymous-read.test.ts` | add | Contract tests |
| `packages/contracts/src/share/index.ts` | modify | Re-export |
| `apps/web/src/domain/prd/prd.ts` | modify | `AnonymousSharedPrdSnapshot` |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port method |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | Anonymous read adapter |
| `apps/web/src/application/prd/get-anonymous-shared-prd-usecase.ts` | add | Use case |
| `apps/web/src/application/prd/get-anonymous-shared-prd-usecase.test.ts` | add | Unit tests |
| `apps/web/src/application/prd/index.ts` | modify | Export |
| `apps/web/app/api/share/[token]/route.ts` | modify | Thin GET adapter |
| `apps/web/app/share/[token]/_components/shared-prd-view.tsx` | modify | Anonymous response + UX |
| `apps/web/app/share/[token]/loading.tsx` | add | Suspense shell |
| `apps/web/app/share/[token]/error.tsx` | add | Recoverable boundary |
| `apps/web/src/application/prd/mint-read-only-share-link-usecase.test.ts` | modify | Mock completeness |
| `docs/product/scope-slices/read-only-sharing--anonymous-read-surface.md` | modify | Slice readiness (`ready-for-user-stories`) |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|----------------|
| `ShareReadTokenParamSchema`, `AnonymousSharedPrdResponseSchema` | add/use | `anonymous-read.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|-------------------------|
| none | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/share/anonymous-read.test.ts` | contract | Parsable valid + invalid payloads |
| `apps/web/src/application/prd/get-anonymous-shared-prd-usecase.test.ts` | unit | Delegates to repository |

---

## Dependencies Added

- None

---

## Rollback

Revert the branch; additive port + contracts only — no destructive schema migration.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy clients expected `projectName` | Low | UX break | Breaking field removal is intentional privacy fix |

---

## Out of Scope (deliberate)

- Revoke / no-index slice

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | No cross-layer leakage in contract |
| scope-critic | PASS | Matches slice boundary |

---

## Approval

- [x] Approved for orchestrator / tracking pipeline
- [x] Verification steps: typecheck + build

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan for anonymous read surface | — |
