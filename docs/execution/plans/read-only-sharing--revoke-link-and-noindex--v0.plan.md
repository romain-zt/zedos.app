# Implementation Plan: Revoke link and noindex (v0)

## Parent User Story

[Revoke link and noindex (v0)](../user-stories/read-only-sharing--revoke-link-and-noindex--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **Approval:** executed-by-orchestrator-instruction (tracking PR #68)
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add `DisableShareLinkRequestSchema` in `@repo/contracts`. Harden `POST /api/share/disable` with Zod for the JSON body and `ShareLinkMintResponseSchema` for the JSON response (same row shape as mint; reuse avoids duplicate DTOs). Keep existing ownership check + disable update. Add a colocated Vitest asserting `apps/web/app/share/[token]/page.tsx` exports `metadata.robots` with `index: false, follow: false`.

**Known drift:** The disable route still performs Drizzle reads/writes inline (pre-existing pattern in this codebase). This plan does not expand scope to extract a use case; a follow-up hygiene PR may move revoke behind `IPrdRepository` + application use case per `72-hexagonal-boundaries.mdc`.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Single update path |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `contracts` — `packages/contracts/src/share/disable.ts`
- [x] `app` (routes) — `apps/web/app/api/share/disable/route.ts`
- [x] `app` (pages) — metadata test only; page metadata unchanged

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/share/disable.ts` | add | Request schema for disable |
| `packages/contracts/src/share/disable.test.ts` | add | Contract tests |
| `packages/contracts/src/share/index.ts` | modify | Re-export disable |
| `packages/contracts/package.json` | modify | Subpath exports for `share` surface |
| `apps/web/app/api/share/disable/route.ts` | modify | Request/response zod validation |
| `apps/web/app/share/[token]/page.metadata.test.ts` | add | Robots regression test |
| `docs/product/scope-slices/read-only-sharing--revoke-link-and-noindex.md` | modify | Refine slice → ready-for-user-stories |
| `docs/execution/user-stories/read-only-sharing--revoke-link-and-noindex--v0.md` | add | Story |
| `docs/execution/plans/read-only-sharing--revoke-link-and-noindex--v0.plan.md` | add | This plan |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `DisableShareLinkRequestSchema` | add | `disable.test.ts` |
| (reuse) `ShareLinkMintResponseSchema` | use for outbound | existing `mint.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/share/disable.test.ts` | contract | Disable request parses / rejects |
| `apps/web/app/share/[token]/page.metadata.test.ts` | unit | `metadata.robots` noindex/nofollow |

---

## Dependencies Added

- None

---

## Rollback

Revert the PR; no schema migrations.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Outbound validation rejects rare DB shape | Low | 500 on disable | Log zod error; fix schema or row mapping |

---

## Out of Scope (deliberate)

- Extracting disable into a dedicated application use case + repository port (follow-up)
- Changing anonymous-read inactive UX copy

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Proposed + executed for orchestrator PR #68 | cloud-agent |
