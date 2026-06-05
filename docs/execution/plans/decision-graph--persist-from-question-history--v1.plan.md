# Implementation Plan: decision-graph--persist-from-question-history (v1)

## Parent User Story

[decision-graph--persist-from-question-history (v1)](../user-stories/decision-graph--persist-from-question-history--v1.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/**`) — confirmed: `zedos/nextjs_space/` no longer exists; `apps/web/` + `packages/{db,contracts,auth,result,...}/` are canonical (`docs/state/status.json` → `phase3.p0..p3 = complete`).
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

This slice introduces the **decision-graph** persistence boundary: every `question_history` row becomes a durable `Decision` (and, when the row's `prd_impact` matches a canonical PRD section, a `DecisionLink`). The mapping is **immutable** per spec — once a Decision exists for a given `question_history.id`, it is never updated by this slice (downstream slices that need re-mapping will introduce a new versioning surface).

Architecture shape:

1. **Schema (`packages/db`)** — add `decisions` and `decision_links` tables. The new `decisions.question_history_id` column carries a **`UNIQUE` index**: this is the natural idempotency key. `ON CONFLICT (question_history_id) DO NOTHING` makes both the synchronous clarify path and the batch backfill safe under concurrent calls.
2. **Contracts (`packages/contracts/src/decisions/`)** — Zod single-source-of-truth schemas: `DecisionDTOSchema`, `DecisionLinkDTOSchema`, `BackfillDecisionsResponseSchema`. No DTO is hand-written; everything crossing a layer or HTTP boundary goes through `z.infer`. Contract tests live next to the schemas (`decision.contract.test.ts`).
3. **Domain (`apps/web/src/domain/decision-graph/`)** — pure entity types (`Decision`, `DecisionLink`), the `DecisionGraphRepository` port, and the pure mapper `mapQuestionHistoryRowToDecisionDraft(row, knownPrdSections)`. Zero imports outside `@shared` and `@contracts` (types only).
4. **Application (`apps/web/src/application/decision-graph/`)** — two use cases, each returning `Promise<Result<T, ApplicationError>>`:
   - `persistDecisionFromQuestionHistoryEntryUseCase({ entry, projectId, prdVersionId }, deps)` — called from the clarify route immediately after `db.insert(questionHistory).returning({ id })`. Idempotent: if the repo reports a conflict, returns `ok({ created: false })`.
   - `backfillDecisionsForProjectUseCase({ projectId, ownerUserId }, deps)` — owner-only, paginates question_history rows (200 per batch), runs each batch in a single `db.transaction`, returns `{ scanned, inserted, skipped }`.
5. **Infrastructure (`apps/web/src/infrastructure/persistence/decision-graph-repository.ts`)** — `DrizzleDecisionGraphRepository` implements the port. Inserts use `ON CONFLICT (question_history_id) DO NOTHING RETURNING id`. No Drizzle row types leak to domain/application (mapper at the boundary).
6. **App (`apps/web/app/api/...`)** — two surfaces, both thin (≤ 20 lines of logic) per `72-hexagonal-boundaries.mdc` §5:
   - Modify `apps/web/app/api/projects/[id]/clarify/route.ts`: change the existing `db.insert(questionHistory).values(qhInsert)` to `db.insert(questionHistory).values(qhInsert).returning({ id })`, then call `persistDecisionFromQuestionHistoryEntryUseCase` inside the same `try/catch` already present in `persistAfterValidStream`. Mapping failures are logged via the existing `routeLogger` and never break the streaming response (preserves existing clarify UX).
   - Add `apps/web/app/api/projects/[id]/decision-graph/backfill/route.ts`: `POST` only, `requireUser` guard, project-ownership check (same pattern as clarify route), call backfill use case, validate outbound DTO with `BackfillDecisionsResponseSchema.safeParse` before `Response.json`.

Cited rules: `70-execution-bridge.mdc` (§3.2, §8), `71-monorepo-context.mdc` (§2 post-migration paths), `72-hexagonal-boundaries.mdc` (§3 import matrix, §5 thin route, §8 hard rules), `73-result-rop.mdc` (§3 Result contract, §10 ApplicationError hierarchy), `74-contracts-zod.mdc` (§2 boundary table, §5 usage, §7 hard rules), `75-drizzle.mdc` (§3 schema conventions, §4 migration discipline, §5 transactional / idempotency patterns), `76-better-auth.mdc` (server `requireUser` guard from `@repo/auth/guards`), `77-nextjs.mdc` (§3 route handler choice, §4 thin route), `78-testing.mdc` (§2 taxonomy, §3 colocation).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser` from `@repo/auth/guards`) |
| Async/sync boundary | Synchronous per HTTP request (clarify persists inline in the existing buffered-stream callback; backfill is one synchronous POST per project owner — no queue, no background worker) |
| Transaction boundary | Per use-case via `db.transaction(async tx => …)`; backfill batches 200 question-history rows per transaction; idempotency enforced by `UNIQUE (decisions.question_history_id)` + `ON CONFLICT DO NOTHING` (no row lock required because no monotonic counter or balance is mutated) |
| External dependencies | None (no AI, no Stripe, no third-party SDK) |
| Payment shape (if money) | n/a (no credit / Stripe surface; see slice "Credit / Payment Impact: None") |
| ↳ Webhook idempotency mechanism (if Payment shape ≠ n/a) | n/a |
| ↳ Webhook signature secret source (if Payment shape ≠ n/a) | n/a |
| ↳ Reservation vs deduct-after-success (if Payment shape ≠ n/a) | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `Decision`, `DecisionLink` entity types, `DecisionGraphRepository` port, `mapQuestionHistoryRowToDecisionDraft` pure mapper.
- [x] `application` — `persistDecisionFromQuestionHistoryEntryUseCase`, `backfillDecisionsForProjectUseCase`.
- [x] `contracts` — `DecisionDTOSchema`, `DecisionLinkDTOSchema`, `BackfillDecisionsResponseSchema` + contract tests.
- [x] `infrastructure` — `DrizzleDecisionGraphRepository`; new Drizzle schema + migration in `packages/db`.
- [x] `app` (routes) — modify `clarify/route.ts` to call persist use case; add `decision-graph/backfill/route.ts`.
- [ ] `ui` — _None_ (excluded by slice: owner Decisions panel ships under `decision-graph--owner-decisions-list-panel`).
- [ ] `shared` — _None_ (uses existing `ApplicationError` hierarchy + `Result`).

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/decision-graph.ts` | add | New Drizzle tables `decisions` (id, project_id FK, prd_version_id FK nullable, question_history_id FK + UNIQUE, structured_question, chosen_option nullable, rejected_options jsonb, owner_comment nullable, ai_interpretation nullable, created_at) and `decision_links` (id, decision_id FK, section_id, anchor nullable, created_at) per `decision-graph-v1-spec.md` §"Objets métier" |
| `packages/db/src/schema/index.ts` | modify | Re-export `./decision-graph` |
| `packages/db/src/migrations/0014_decision_graph.sql` | add (via `pnpm generate`) | New tables + indexes + UNIQUE constraint on `decisions.question_history_id` |
| `packages/db/src/migrations/meta/0014_snapshot.json` | add (via `pnpm generate`) | Drizzle snapshot for migration 0014 |
| `packages/db/src/migrations/meta/_journal.json` | modify (via `pnpm generate`) | Journal entry for migration 0014 |
| `packages/contracts/package.json` | modify | Add `./decisions` to `exports` map |
| `packages/contracts/src/decisions/decision.ts` | add | `DecisionDTOSchema`, `DecisionLinkDTOSchema`, `BackfillDecisionsResponseSchema`, `DecisionDraftSchema` (internal cross-layer shape) |
| `packages/contracts/src/decisions/decision.contract.test.ts` | add | Vitest contract tests: valid DTOs, malformed `rejectedOptions`, unknown section coerced to `null`, backfill response shape |
| `packages/contracts/src/decisions/index.ts` | add | Barrel re-export |
| `packages/contracts/src/index.ts` | modify | `export * from './decisions';` |
| `apps/web/src/domain/decision-graph/decision.ts` | add | `Decision` / `DecisionLink` entity types + invariants (`rejectedOptions` is always an array, `sectionId` is a canonical PRD section from `PRD_SECTIONS` or `null`) |
| `apps/web/src/domain/decision-graph/decision-graph-repository.ts` | add | Port interface: `insertDecisionIfAbsent(draft)`, `findByProjectId(projectId, limit, cursor)`, `countByProjectId(projectId)`, `findQuestionHistoryIdsAlreadyPersisted(projectId, candidateIds)` |
| `apps/web/src/domain/decision-graph/map-question-history-to-decision.ts` | add | Pure mapper from `QuestionHistoryRow` shape (typed via `@repo/contracts`) → `DecisionDraft` + optional `DecisionLinkDraft` |
| `apps/web/src/domain/decision-graph/index.ts` | add | Barrel |
| `apps/web/src/application/decision-graph/persist-decision-from-question-history-usecase.ts` | add | Use case: calls mapper, then `repo.insertDecisionIfAbsent(...)`, returns `Result<{ created: boolean }, ApplicationError>` |
| `apps/web/src/application/decision-graph/persist-decision-from-question-history-usecase.test.ts` | add | Unit: happy path + idempotent re-call (mocked repo returns `created: false` second time) + malformed `availableOptions` → `ValidationError` |
| `apps/web/src/application/decision-graph/backfill-decisions-for-project-usecase.ts` | add | Use case: paginates 200 rows / batch, filters already-persisted via `findQuestionHistoryIdsAlreadyPersisted`, calls `insertDecisionIfAbsent` per remaining row, accumulates `{ scanned, inserted, skipped }` |
| `apps/web/src/application/decision-graph/backfill-decisions-for-project-usecase.test.ts` | add | Unit: empty history, partial backfill, full re-run inserts 0 (idempotent), mapping error skips one row but completes |
| `apps/web/src/application/decision-graph/index.ts` | add | Barrel |
| `apps/web/src/infrastructure/persistence/decision-graph-repository.ts` | add | `DrizzleDecisionGraphRepository` implementing the port; insert uses `ON CONFLICT (question_history_id) DO NOTHING RETURNING id`; all error paths return `err(new DatabaseError(...))` from `@shared/errors/application-error` |
| `apps/web/src/infrastructure/persistence/decision-graph-repository.integration.ts` | add | Integration test against real Postgres test container: two concurrent inserts with same `questionHistoryId` produce exactly one row; backfill idempotency |
| `apps/web/src/infrastructure/persistence/index.ts` | modify | Export `decisionGraphRepository` singleton |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | (1) Change existing `db.insert(questionHistory).values(qhInsert)` to `await db.insert(questionHistory).values(qhInsert).returning({ id: questionHistory.id })`; (2) inside the same `persistAfterValidStream` `try/catch`, call `persistDecisionFromQuestionHistoryEntryUseCase` after the insert succeeds; (3) on use-case `err`, log via existing `routeLogger.error` and continue — clarify response is unaffected (slice UX: "Error — mapping failed: Clarify still usable; decision row skipped"). |
| `apps/web/app/api/projects/[id]/decision-graph/backfill/route.ts` | add | `POST` only, thin (≤ 20 lines): `requireUser` → project-ownership check (`projects.userId === userId`) → `backfillDecisionsForProjectUseCase` → outbound `BackfillDecisionsResponseSchema.safeParse` → `Response.json` |
| `apps/web/e2e/decision-graph-backfill.spec.ts` | add | Playwright: signed-in owner POSTs backfill, asserts `inserted >= 0`; second POST returns `inserted: 0`; unauthenticated POST returns `401`. |
| `docs/execution/user-stories/decision-graph--persist-from-question-history--v1.md` | modify | Promote to `ready-for-implementation`, fill ACs against UX states, type test plan |
| `docs/execution/plans/decision-graph--persist-from-question-history--v1.plan.md` | modify | This Plan |

> **No** edit to `packages/db/src/schema/question-history.ts`, `apps/web/src/infrastructure/persistence/question-history-repository.ts`, or any other file outside this list. Anything not on this list is out of scope — Plan revision required to expand.

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `DecisionDTOSchema` | add | `packages/contracts/src/decisions/decision.contract.test.ts` |
| `DecisionLinkDTOSchema` | add | `packages/contracts/src/decisions/decision.contract.test.ts` |
| `DecisionDraftSchema` (cross-layer write shape used by domain mapper) | add | `packages/contracts/src/decisions/decision.contract.test.ts` |
| `BackfillDecisionsResponseSchema` (`{ scanned, inserted, skipped }`, all `z.number().int().min(0)`) | add | `packages/contracts/src/decisions/decision.contract.test.ts` |

No existing contract is modified (clarify input schema `ClarifyPostBodySchema` and `QuestionHistoryRowSchema` are read-only inputs to the mapper).

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| `0014_decision_graph` (one migration, one logical change per `75-drizzle.mdc` §4.2 and `79-pr-sizing.mdc` §2) | `decisions` (new), `decision_links` (new) | Yes — additive only. No existing column or table is modified; no data backfill in the migration itself (backfill is application-driven so it can be re-run safely and observed per-project). Forward-only (no down migration), per `75-drizzle.mdc` §4.2. Generated with `cd packages/db && pnpm generate`; reviewed before commit; applied locally with `pnpm db:migrate`. |

Indexes / constraints in the migration:

- `decisions.question_history_id` — `UNIQUE NOT NULL` (the idempotency key for clarify + backfill).
- `decisions_project_id_idx` on `decisions.project_id`.
- `decisions_prd_version_id_idx` on `decisions.prd_version_id`.
- `decision_links_decision_id_idx` on `decision_links.decision_id`.
- `decision_links_section_id_idx` on `decision_links.section_id`.
- FKs use `ON DELETE CASCADE` from `projects` and `question_history`; `ON DELETE SET NULL` from `prd_versions` (matches existing `question_history` policy for `prd_version_id`).

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/decisions/decision.contract.test.ts` | contract | Valid `DecisionDTO`, valid `DecisionLinkDTO`, malformed `rejectedOptions` → `safeParse.success = false`, `BackfillDecisionsResponseSchema` rejects negative counts |
| `apps/web/src/application/decision-graph/persist-decision-from-question-history-usecase.test.ts` | unit | Happy path inserts; second call with same `questionHistoryId` returns `ok({ created: false })`; malformed `availableOptions` returns `err(ValidationError)` and the repo is never called |
| `apps/web/src/application/decision-graph/backfill-decisions-for-project-usecase.test.ts` | unit | Empty history → `{ scanned: 0, inserted: 0, skipped: 0 }`; partial backfill inserts only missing rows; full re-run inserts `0`; one mapping failure skips one row, loop continues |
| `apps/web/src/infrastructure/persistence/decision-graph-repository.integration.ts` | integration | Real Postgres test container (per `75-drizzle.mdc` §4.3 + `78-testing.mdc` §2): two parallel `insertDecisionIfAbsent` calls with the same `questionHistoryId` resolve to exactly one inserted row; `findQuestionHistoryIdsAlreadyPersisted` returns the right subset |
| `apps/web/e2e/decision-graph-backfill.spec.ts` | e2e | Owner POST `/api/projects/:id/decision-graph/backfill` returns `{ scanned, inserted, skipped }`; second POST returns `inserted: 0`; unauthenticated POST returns `401`; non-owner POST returns `403` |
| `pnpm typecheck` (root) | repo gate | Clean |
| `pnpm lint` (root, boundaries enforced) | repo gate | No new boundaries / `as any` / `throw new Error` violations |
| `pnpm test` (root, vitest workspaces) | repo gate | All new + existing tests green |
| `pnpm build` (root, turbo) | repo gate | Next build succeeds |

---

## Dependencies Added

- None. The work uses only existing packages: `drizzle-orm` (already in `packages/db`), `zod` (already in `packages/contracts`), `@repo/db`, `@repo/contracts`, `@repo/auth/guards`, `@repo/result`, and the existing `ApplicationError` hierarchy from `apps/web/src/shared/errors/application-error.ts`.

---

## Rollback

Forward-only schema migration per `75-drizzle.mdc` §4.2. If a problem surfaces after merge:

1. **Disable the backfill endpoint** by reverting the commit that adds `apps/web/app/api/projects/[id]/decision-graph/backfill/route.ts` — the route 404s and the synchronous persist path can be neutralized by reverting the additive lines inside `persistAfterValidStream` (existing clarify behavior is preserved because the new call is wrapped in the existing `try/catch`).
2. **Existing rows are harmless**: `decisions` and `decision_links` are owner-private, are not exposed via any UI in this slice, and are not shipped in any export. They remain in the DB and become the substrate for the follow-up slices when they ship.
3. **Schema rollback** (only if strictly required): author a follow-up migration that `DROP`s the new tables. No data loss, because no upstream feature depends on Decision rows yet.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| A malformed `available_options` JSON in `question_history` blocks the mapper for that row | medium | one decision row missing, clarify response still streams | `AvailableOptionsFromDbSchema` already coerces invalid JSON to `null` in the contracts layer; the mapper treats `null` as "no rejected options"; mapping failures are caught and logged per AC-4 |
| Backfill on a project with thousands of question-history rows takes seconds | low | slow POST; no UX block (slice: "no blocking modal v1") | Pagination at 200 rows / batch, one transaction per batch; client-side button can disable while pending; owner-triggered explicitly |
| Concurrent backfill calls (two browser tabs) | low | duplicate inserts | Prevented by `UNIQUE (decisions.question_history_id)` + `ON CONFLICT DO NOTHING`; second call observes `inserted: 0` |
| `prd_impact` text in legacy question-history rows is free-form / not in `PRD_SECTIONS` | medium | DecisionLink row omitted; Decision still created | Mapper checks against `PRD_SECTIONS` canonical list from `@repo/contracts/questions/history`; non-canonical impact stored on `decisions.structured_question`-adjacent fields, no link row — section-badges slice will surface this gap later, not this slice |
| Clarify request fails *after* `question_history` insert but *before* `Decision` insert | low | one Decision missing until next backfill | Acceptable: backfill is idempotent and recovers the row; error is logged via `routeLogger.error` with `{ projectId, questionHistoryId }` (no PII) |
| Decision row immutability vs PRD versioning churn | low | re-runs of clarify on a corrected answer don't update the Decision row | Accepted per spec (`decision-graph-v1-spec.md` §Règles: "Immutabilité ; nouvelle version PRD → nouvelles decisions"). Future PRD-version handling is the responsibility of a follow-up slice |

---

## Out of Scope (deliberate)

- Owner Decisions list / panel UI (slice `decision-graph--owner-decisions-list-panel`).
- PRD section badges and clickable links (slice `decision-graph--section-badges-and-links`).
- `decisions.json` in the Cursor delivery zip (slice `decision-graph--export-decisions-json`).
- Force-directed graph visualization (out of v1 per spec).
- Anonymous share viewers reading decisions (decisions remain owner-private; share-link viewer surface is not touched).
- Editing or versioning decisions (immutable per spec — re-mapping after PRD version churn is a future slice's concern).
- Background queues, scheduled jobs, or auto-backfill on project open (slice says "background; no blocking modal v1" — but explicitly leaves trigger choice to the implementer; this Plan picks owner-initiated POST, which is the smallest surface that satisfies the acceptance outcome).
- Re-architecting the existing `clarify/route.ts` (fat-route refactor) — kept frozen, this Plan only adds the persist call inside the existing callback.

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| `domain-guardian` | **PASS** | (1) Layer boundaries respected: domain imports only `@shared` and `@repo/contracts` (types only); application imports `@domain` + `@contracts` + `@shared`; infrastructure imports `@repo/db` + domain port; routes call exactly one use case each. (2) No raw vendor SDK outside infrastructure — Drizzle stays in `packages/db` + the new adapter. (3) No Drizzle row types leak past the adapter — domain entities are returned via the mapper. (4) Every use case returns `Promise<Result<T, ApplicationError>>`; no `throw new Error` outside the domain entity invariants. (5) No new contributions to frozen-violation counts (`72-hexagonal-boundaries.mdc` §7, `73-result-rop.mdc` §7): no `as any`, no `lib/` additions, no `prisma.*` calls, no raw `throw` in app/application/infrastructure. (6) Contracts respect `74-contracts-zod.mdc` §7: all cross-layer DTOs are `z.infer`, route validates inbound + outbound. |
| `scope-critic` | **PASS** | (1) Plan stays inside the slice's `Included Behavior`: map question-history → Decision (+ optional DecisionLink), idempotent backfill, sync persistence on new clarify turns. (2) Explicitly carves out the four sibling slices (owner panel, section badges, JSON export, force graph) and the anonymous viewer surface. (3) No silent scope expansion across the bridge — every layer change ties back to an Acceptance Criterion (AC-1..AC-6) or a directly enumerated UX state. (4) The new backfill route is the **minimum** route surface that satisfies the "idempotent backfill for existing projects" requirement; no list / read / delete endpoints are added. (5) Touched-files list is exact and does not glob; no aspirational paths. |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit (per `70-execution-bridge.mdc` §3.3)
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-06-05

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-04 | Blueprint scaffold (minimal) | — |
| 2026-06-05 | Full architect draft: Approach, Surface Block resolved, exact Touched Files, Contracts, Migrations, Tests per layer, Risks, Rollback, adversarial PASS/PASS; status moved from `draft` to `approved`; companion User Story promoted to `ready-for-implementation`. | architect |
