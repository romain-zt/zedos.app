# Implementation Plan: Cursor package export (v0)

## Parent User Story

[Cursor package export (v0)](../user-stories/delivery--cursor-package-export--v0.md)

## Status

`approved`

> **Layout in effect:** `apps/web/` + `packages/contracts` + `packages/db` (read-only on locked bundles)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false
> **Approval note:** User approved Plan in chat on 2026-05-29. Implementation via `/implement` with Patch Intent Summary per execution bridge. PIS must list OQ-1 (task_split tables on branch) as first approval blocker when tables are absent on `main`.

---

## Approach

**Application layer:** three use cases — `listExportEligibleBundles`, `previewDeliveryPackage`, `buildDeliveryPackage` — orchestration only, `Result<T, ApplicationError>` throughout.

**Infrastructure:** `DeliveryExportRepository` (Drizzle) reads **locked** task-split bundles (`locked_at` not null) with ordered tasks and linked user-story metadata; `CursorPackageAssembler` builds the PD-001 layout (`WORK_QUEUE.md`, `docs/execution/user-stories/<id>.md` with acceptance criteria and inline per-task prompts) and an in-memory **ZIP** archive streamed in the export HTTP response.

**Routes:** thin handlers — `GET …/delivery/eligible`, `POST …/delivery/preview`, `POST …/delivery/export` (body = selected bundle ids).

**UI:** page at `app/dashboard/projects/[id]/delivery/` with a client workspace covering all slice UX states. Remove `delivery` from `DEFERRED_ROADMAP_PLACEHOLDERS` so the surface is reachable.

**PR stacking (79-pr-sizing):** (1) contracts + domain + application + infrastructure + API + tests; (2) dashboard UI + roadmap placeholder update.

**Data prerequisite:** no migration in this Plan. Export reads task-split tables once delivered by `test-first-workflows--task-splitting-with-prompts--v0`.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`packages/db`) |
| Auth source-of-truth | better-auth (`requireUser` + project owner guard) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Read-only queries; no multi-write transaction |
| External dependencies | None (local ZIP assembly) |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — `ExportEligibleBundle`, `IDeliveryExportRepository` port
- [x] `application` — list / preview / build use cases
- [x] `contracts` — zod DTOs in `packages/contracts/src/delivery/`
- [x] `infrastructure` — Drizzle adapter + ZIP assembler
- [x] `app` — API routes
- [x] `ui` — export workspace
- [ ] `shared` — existing logger only

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/delivery/delivery-contracts.ts` | new | Eligible, preview, export schemas |
| `packages/contracts/src/delivery/delivery.contract.test.ts` | new | Contract tests |
| `packages/contracts/package.json` | modify | `./delivery` export subpath |
| `apps/web/src/domain/delivery/export-bundle.ts` | new | Domain types |
| `apps/web/src/domain/delivery/delivery-export-repository.ts` | new | Port |
| `apps/web/src/infrastructure/delivery/delivery-export-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/delivery/cursor-package-assembler.ts` | new | PD-001 + ZIP |
| `apps/web/src/application/delivery/list-export-eligible-bundles-usecase.ts` | new | |
| `apps/web/src/application/delivery/preview-delivery-package-usecase.ts` | new | |
| `apps/web/src/application/delivery/build-delivery-package-usecase.ts` | new | |
| `apps/web/src/application/delivery/build-delivery-package-usecase.test.ts` | new | Mocked assembly |
| `apps/web/app/api/projects/[id]/delivery/eligible/route.ts` | new | GET |
| `apps/web/app/api/projects/[id]/delivery/preview/route.ts` | new | POST |
| `apps/web/app/api/projects/[id]/delivery/export/route.ts` | new | POST → `application/zip` |
| `apps/web/app/dashboard/projects/[id]/delivery/page.tsx` | new | Entry |
| `apps/web/app/dashboard/projects/[id]/delivery/_components/delivery-export-workspace.tsx` | new | Full UX |
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | modify | Activate Delivery in product nav |
| `apps/web/package.json` | modify | `archiver` dependency |

*(If a single PR exceeds §2 file limits, ship rows above as PR A then PR B per Approach stacking note.)*

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `ExportEligibleBundleSchema`, `DeliveryPreviewRequestSchema`, `DeliveryPreviewResponseSchema`, `DeliveryExportRequestSchema` | add | `packages/contracts/src/delivery/delivery.contract.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| — | — | None; reads existing locked task-split bundles |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/delivery/delivery.contract.test.ts` | contract | Invalid payloads fail closed |
| `apps/web/src/application/delivery/build-delivery-package-usecase.test.ts` | unit | WORK_QUEUE rows + story files present |
| `apps/web/src/infrastructure/delivery/cursor-package-assembler.test.ts` | unit | ZIP non-empty; PD-001 paths |

---

## Dependencies Added

- `archiver` (and `@types/archiver` devDependency) in `apps/web` — server-side ZIP generation (no ZIP library in monorepo today)

---

## Rollback

- Hide nav link and return 404 from delivery API routes.
- Remove `archiver` if rolling back entirely.
- No schema migration to revert.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Task-split not merged → empty eligible list | High until prerequisite lands | Medium | OQ-1; gate `/implement` PIS; UI empty state already specified |
| Large ZIP / memory pressure | Medium | Medium | Cap bundle count or total prompt bytes; explicit error |
| Sensitive prompt text in downloaded archive | Low | High | Owner-only APIs; no prompt logging |

---

## Out of Scope (deliberate)

- Full task-split implementation (separate approved Plan)
- Generated `.cursor/rules/**` in the ZIP (PD-001 v1 minimum: WORK_QUEUE + user-story files)
- Auto-reload, credits, share links

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | ZIP + Drizzle confined to infrastructure; thin routes; no vendor SDK in app |
| scope-critic | PASS | Matches slice + PD-001; no Cursor execution; roadmap placeholder update is UX activation only |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-29

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-29 | Initial plan for Cursor package export slice; user-approved in chat | — |
