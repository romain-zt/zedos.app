# Implementation Plan: PRD to feature split (v0)

## Parent User Story

[PRD to feature split (v0)](../user-stories/services-feature-split--prd-to-feature-split--v0.md)

## Status

`proposed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Introduce a normalized persistence model for a **feature split** aggregate (header row keyed by `projectId` + `sourcePrdVersionId`, child **cluster** rows with `sortOrder`, `label`, `valueLine`, `boundaryCue`) via Drizzle in `packages/db`, exposed through a new domain port `IFeatureSplitRepository` and `DrizzleFeatureSplitRepository` returning `Result<T, ApplicationError>` per rules 72–73.

Add Zod contracts under `packages/contracts/src/feature-split/` for all HTTP and AI-validated payloads (inbound/outbound validation on every route per 74). Application use cases orchestrate: load split + PRD snapshot context, optional **propose** path that calls an AI wrapper in `apps/web/src/infrastructure/ai/` (reuse existing vendor isolation pattern), optional **deduct** via existing `DeductCreditsUseCase` / credits port when assisted generation runs, **save draft** (replace cluster set transactionally), and **confirm** (status transition to `confirmed`).

Next.js App Router: thin `route.ts` handlers under `apps/web/app/api/projects/[id]/feature-split/` parse with zod, call one use case each, validate outbound DTOs before `Response.json` (77). Dashboard UI replaces the deferred placeholder for `services-feature-split` with a mobile-first flow: version picker → review/editor → confirm, matching UX states in the parent slice.

**PR stacking (79):** This allow-list describes the full slice. Implementation MUST ship as stacked PRs on the tracking branch—for example (1) `packages/db` migration + schema only, (2) contracts + domain + persistence + use cases, (3) API routes, (4) dashboard UI + placeholder removal—each subset respecting file count, layer count, and single-migration-per-PR rules.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`packages/db`) |
| Auth source-of-truth | better-auth (`requireUser` / session helper used by existing PRD routes) |
| Async/sync boundary | Synchronous per HTTP request; no background queues |
| Transaction boundary | Per use-case: draft save and confirm wrap cluster writes in a DB transaction |
| External dependencies | Managed AI client only inside `infrastructure/ai/`; optional credit deduct via existing credits infrastructure |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `IFeatureSplitRepository`, `FeatureSplit` / `FeatureCluster` entities
- [x] `application` — propose, get split for project/version, save draft, confirm use cases
- [x] `contracts` — feature-split and optional AI proposal schemas + tests
- [x] `infrastructure` — Drizzle repository; AI wrapper; credits hook for assisted flow
- [x] `app` (routes, server actions, server components) — feature-split API routes
- [x] `ui` — dashboard feature-split page/panel components
- [ ] `shared` — none unless a shared error helper is reused as-is

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/feature-split.ts` | new | `feature_splits` + `feature_split_clusters` tables |
| `packages/db/src/schema/index.ts` | modify | Re-export schema |
| `packages/db/src/migrations/0004_feature_split_tables.sql` | new | Forward-only DDL (tag aligned to drizzle-kit output) |
| `packages/db/src/migrations/meta/*` | modify | Drizzle meta snapshots as generated |
| `packages/contracts/src/feature-split/*.ts` | new | Request/response + cluster DTO schemas |
| `packages/contracts/src/feature-split/index.ts` | new | Barrel |
| `packages/contracts/src/index.ts` | modify | Re-export |
| `apps/web/src/domain/feature-split/feature-split-repository.ts` | new | Port |
| `apps/web/src/domain/feature-split/feature-split.ts` | new | Domain types |
| `apps/web/src/domain/feature-split/index.ts` | new | Barrel |
| `apps/web/src/infrastructure/persistence/feature-split-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/index.ts` | modify | Export if barrel exists |
| `apps/web/src/infrastructure/ai/feature-split-proposal.ts` | new | AI wrapper; validates `FeatureSplitProposalSchema` |
| `apps/web/src/application/feature-split/get-feature-split-usecase.ts` | new | Load draft/confirmed + clusters |
| `apps/web/src/application/feature-split/propose-feature-split-usecase.ts` | new | Optional AI + credit gate |
| `apps/web/src/application/feature-split/save-feature-split-draft-usecase.ts` | new | Transactional cluster replace |
| `apps/web/src/application/feature-split/confirm-feature-split-usecase.ts` | new | Status transition |
| `apps/web/src/application/feature-split/index.ts` | new | Barrel |
| `apps/web/app/api/projects/[id]/feature-split/route.ts` | new | GET list/get by version; PUT save draft |
| `apps/web/app/api/projects/[id]/feature-split/propose/route.ts` | new | POST assisted proposal |
| `apps/web/app/api/projects/[id]/feature-split/confirm/route.ts` | new | POST confirm |
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | modify | Remove or narrow placeholder when live |
| `apps/web/app/dashboard/projects/[id]/feature-split/page.tsx` | new | Owner-only surface |
| `apps/web/app/dashboard/projects/[id]/_components/feature-split-workspace.tsx` | new | Client/editor UI |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `FeatureClusterSchema`, `FeatureSplitDraftSchema`, `FeatureSplitConfirmedSchema` | add | `packages/contracts/src/feature-split/feature-split.test.ts` |
| `ProposeFeatureSplitRequestSchema`, `ProposeFeatureSplitResponseSchema` | add | same |
| `FeatureSplitProposalSchema` (AI output) | add | same |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `0004_feature_split_tables` | `feature_splits`, `feature_split_clusters` | yes (additive) |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/feature-split/feature-split.test.ts` | contract | Valid/invalid DTOs |
| `apps/web/src/application/feature-split/save-feature-split-draft-usecase.test.ts` | unit | Draft save delegations / ordering |
| `apps/web/src/application/feature-split/confirm-feature-split-usecase.test.ts` | unit | Confirm rules |
| `apps/web/src/infrastructure/persistence/feature-split-repository.integration.test.ts` | integration | Optional if repo tests exist elsewhere |

---

## Dependencies Added

- None (reuse existing `zod`, `drizzle-orm`, AI infra package wiring)

---

## Rollback

Disable routes and UI link; drop migration via forward follow-up only if needed. No destructive DDL in v0 beyond table drop in emergency revert PR.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI proposal drift vs slice boundaries | medium | medium | Strict zod for AI output; reject + retry UX (AC-5) |
| Oversized single PR | high | high | Explicit `/split` stack per 79 in Approach |
| Credit tier unset | medium | low | Config constant + OQ-1 until matrix row exists |

---

## Out of Scope (deliberate)

- Downstream user-story generation slice
- Collaborative editing
- Changing PRD versioning behavior

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Ports + Result; AI only in infrastructure |
| scope-critic | PASS | Matches slice included/excluded lists |

---

## Approval

- [x] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial proposed plan for PRD → feature split slice | — |
| 2026-05-11 | Approved by owner — unlocked for orchestrator implementation | owner |
