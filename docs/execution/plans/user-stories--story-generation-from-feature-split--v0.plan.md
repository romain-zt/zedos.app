# Implementation Plan: Story generation from feature split (v0)

## Parent User Story

[Story generation from feature split (v0)](../user-stories/user-stories--story-generation-from-feature-split--v0.md)

## Status

`proposed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add persistence for a **user story corpus** scoped to `projectId`, anchored to a single **confirmed** `feature_split_cluster` row (FK after `fa-services-feature-split` lands), with ordered **story** child rows (`title`, `body`, `sortOrder`, `archivedAt`, `draftMarker`, `reviewReadyAt` / corpus-level review flag as appropriate). Use Drizzle in `packages/db`, domain ports returning `Result<T, ApplicationError>` per 72–73, and Zod contracts under `packages/contracts/src/user-stories/` per 74.

Application use cases cover: load corpus for project + cluster, optional **generate** path (template-only and/or AI-assisted via `apps/web/src/infrastructure/ai/`), optional **deduct** through existing credits use cases when assisted generation runs, **save** edits and reorder transactionally, **archive** / **merge duplicate** helpers, and **mark review complete** transitioning corpus state for downstream navigation.

Next.js App Router: authenticated `route.ts` handlers under `apps/web/app/api/projects/[projectId]/user-stories/` parse with zod, delegate to one use case each, validate outbound DTOs (77). Dashboard UI (mobile-first): cluster selector when multiple confirmed clusters exist → review workspace → mark ready, matching parent slice UX states. **Dependency:** assumes `feature_splits` / `feature_split_clusters` from `services-feature-split--prd-to-feature-split` exist or ships in an earlier migration; if clusters are absent, routes return gated errors per AC-1 / AC-7.

**PR stacking (79):** Ship as stacked PRs on the tracking branch — for example (1) `packages/db` migration + schema for corpus + stories, (2) contracts + domain + persistence + use cases, (3) API routes, (4) dashboard UI + placeholder navigation updates — each respecting file count, layer count, and single-migration-per-PR rules.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`packages/db`) |
| Auth source-of-truth | better-auth (same session guards as existing project API routes) |
| Async/sync boundary | Synchronous per HTTP request; no background queues |
| Transaction boundary | Per use-case: batch reorder + merge/archive writes wrapped in DB transaction |
| External dependencies | Managed AI client only in `infrastructure/ai/`; credits via existing infrastructure when attempted generation is assisted |
| Payment shape | n/a (credits are ledger-based; no new Stripe surface in this slice) |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `IUserStoryCorpusRepository`, corpus + story entities
- [x] `application` — generate, load, save edits, reorder, archive/merge, mark review-ready use cases
- [x] `contracts` — user-story HTTP + optional AI draft schemas + tests
- [x] `infrastructure` — Drizzle repository; optional AI wrapper; credits hook
- [x] `app` (routes, server actions, server components) — user-stories API routes
- [x] `ui` — dashboard user-stories pages/components
- [ ] `shared` — none unless an existing error helper is reused as-is

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/user-stories.ts` | new | `user_story_corpora` + `user_story_lines` (names align with drizzle conventions); FK to `feature_split_clusters.id` |
| `packages/db/src/schema/index.ts` | modify | Re-export schema |
| `packages/db/src/migrations/0005_user_story_corpus_tables.sql` | new | Forward-only DDL **after** `0004_feature_split_tables` from upstream slice |
| `packages/db/src/migrations/meta/*` | modify | Drizzle meta snapshots as generated |
| `packages/contracts/src/user-stories/*.ts` | new | Request/response + story DTO schemas |
| `packages/contracts/src/user-stories/index.ts` | new | Barrel |
| `packages/contracts/src/index.ts` | modify | Re-export |
| `apps/web/src/domain/user-stories/user-story-corpus-repository.ts` | new | Port |
| `apps/web/src/domain/user-stories/user-story-corpus.ts` | new | Domain types |
| `apps/web/src/domain/user-stories/index.ts` | new | Barrel |
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/index.ts` | modify | Export adapter if barrel pattern exists |
| `apps/web/src/infrastructure/ai/user-story-draft.ts` | new | Optional AI wrapper validating draft list schema |
| `apps/web/src/application/user-stories/get-user-story-corpus-usecase.ts` | new | Load corpus + lines |
| `apps/web/src/application/user-stories/generate-user-story-draft-usecase.ts` | new | Template and/or AI path + credit gate |
| `apps/web/src/application/user-stories/save-user-story-corpus-usecase.ts` | new | Persist edits / reorder |
| `apps/web/src/application/user-stories/mark-user-stories-review-ready-usecase.ts` | new | Completes review step |
| `apps/web/src/application/user-stories/index.ts` | new | Barrel |
| `apps/web/app/api/projects/[projectId]/user-stories/route.ts` | new | GET/PUT corpus for cluster |
| `apps/web/app/api/projects/[projectId]/user-stories/generate/route.ts` | new | POST draft generation |
| `apps/web/app/api/projects/[projectId]/user-stories/review-ready/route.ts` | new | POST mark ready |
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | modify | Narrow placeholder when live surface ships |
| `apps/web/app/dashboard/projects/[projectId]/user-stories/page.tsx` | new | Owner-only surface |
| `apps/web/app/dashboard/projects/[projectId]/_components/user-stories-workspace.tsx` | new | Client workspace |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `UserStoryLineSchema`, `UserStoryCorpusSchema` | add | `packages/contracts/src/user-stories/user-stories.test.ts` |
| `SaveUserStoryCorpusRequestSchema`, `GenerateUserStoriesRequestSchema`, `GenerateUserStoriesResponseSchema` | add | same |
| `UserStoryAiDraftListSchema` (optional AI output) | add | same |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `0005_user_story_corpus_tables` | `user_story_corpora`, `user_story_lines` | yes (additive; requires feature split tables for FK) |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/user-stories/user-stories.test.ts` | contract | Valid/invalid DTOs |
| `apps/web/src/application/user-stories/save-user-story-corpus-usecase.test.ts` | unit | Reorder + merge/archive rules |
| `apps/web/src/application/user-stories/mark-user-stories-review-ready-usecase.test.ts` | unit | Gating + state transition |
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.integration.test.ts` | integration | Optional if repo integration pattern exists elsewhere |

---

## Dependencies Added

- None (reuse existing `zod`, `drizzle-orm`, AI infra package wiring)

---

## Rollback

Revert UI links; disable routes. Schema rollback only via forward follow-up migration if an emergency revert is required.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration ordering vs feature-split `0004` | medium | high | Land feature split first; renumber migration if `0004`/`0005` drift |
| AI draft drift vs behavioral-only stories | medium | medium | Strict zod on AI output; user editing is first-class |
| Oversized single PR | high | high | `/split` stack per Approach |

---

## Out of Scope (deliberate)

- Test-first workflow task splitting slice
- Collaborative editing or sharing of story drafts
- Changing PRD versioning or feature split semantics

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Ports + Result; AI only in infrastructure |
| scope-critic | PASS | Matches slice included/excluded lists |

---

## Approval

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** pending
**Approval date:** —

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial proposed plan for story generation slice | — |