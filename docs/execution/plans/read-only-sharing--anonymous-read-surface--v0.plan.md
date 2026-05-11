# Implementation Plan: Anonymous read surface (v0)

## Parent User Story

[Anonymous read surface (v0)](../user-stories/read-only-sharing--anonymous-read-surface--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false

Uses local `@repo/result` (`Result<T, E>`) per existing app patterns; variance constraints noted in `73-result-rop.mdc`.

---

## Approach

Define `ShareLinkTokenPathSchema` and `AnonymousSharedPrdResponseSchema` in `packages/contracts` (rule 74). Extend `AnonymousSharedPrdReadModel` and `IPrdRepository.findAnonymousSharedPrdByToken` so the DB adapter loads only `share_links` + `prd_versions` (`versionNumber`, `content`) for an enabled token — no `projects` join, no IDs in the HTTP DTO (rule 72–75). Add `GetAnonymousSharedPrdUseCase`. Refactor `GET /api/share/[token]` to parse token with Zod, call one use case, map `ApplicationError` to HTTP, outbound-validate JSON (rules 73, 77). Update `SharedPrdView` to `safeParse` responses and remove reliance on leaked fields (`projectName`, metadata). Maintain existing `robots`/noindex on the share page route.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle |
| Auth source-of-truth | Anonymous read — none required (`n/a`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Single read query per request |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `AnonymousSharedPrdReadModel`, `IPrdRepository.findAnonymousSharedPrdByToken`
- [x] `application` — `GetAnonymousSharedPrdUseCase`
- [x] `contracts` — `packages/contracts/src/share/anonymous-read.ts`
- [x] `infrastructure` — `DrizzlePrdRepository.findAnonymousSharedPrdByToken`
- [x] `app` (routes) — `apps/web/app/api/share/[token]/route.ts`
- [x] `ui` — `apps/web/app/share/[token]/_components/shared-prd-view.tsx`

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/package.json` | modify | Export `share/mint`, `share/anonymous-read` subpaths |
| `packages/contracts/src/share/anonymous-read.ts` | add | Zod contracts |
| `packages/contracts/src/share/anonymous-read.test.ts` | add | Contract tests |
| `packages/contracts/src/share/index.ts` | modify | Re-exports |
| `apps/web/src/domain/prd/prd.ts` | modify | `AnonymousSharedPrdReadModel` |
| `apps/web/src/domain/prd/prd-repository.ts` | modify | Port method |
| `apps/web/src/infrastructure/persistence/prd-repository.ts` | modify | Anonymous read query (no projects join) |
| `apps/web/src/application/prd/get-anonymous-shared-prd-usecase.ts` | add | Use case |
| `apps/web/src/application/prd/index.ts` | modify | Export |
| `apps/web/app/api/share/[token]/route.ts` | modify | Thin adapter |
| `apps/web/app/share/[token]/_components/shared-prd-view.tsx` | modify | Contract-safe client parse + UI |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `ShareLinkTokenPathSchema`, `AnonymousSharedPrdResponseSchema` | add | `anonymous-read.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/share/anonymous-read.test.ts` | contract | Token + response schemas |

---

## Dependencies Added

- None

---

## Rollback

Revert the merge commit; redeploy prior build. API would return legacy shape if rollback omits migration (none applies).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-------------|
| PRD JSON stores sensitive strings inside `content` | Low | Viewer sees embedded text | Out of slice — owners control shared document body; API still strips workspace joins |

---

## Out of Scope (deliberate)

- Link revocation / disable UX
- SSR data fetch refactor for `/share/[token]` (client fetch retained)
- `lib/composition.ts` wiring (parity with mint route instantiation)

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | No projects join on anonymous path; DTO matches contract |
| scope-critic | PASS | Aligns with slice privacy boundary |

---

## Approval

- [x] User reviewed and approved this Plan (orchestrator / operator instruction)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / build) defined in §Tests above

**Approval status:** approved  
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored and executed for tracking PR #54 | cloud-agent |
