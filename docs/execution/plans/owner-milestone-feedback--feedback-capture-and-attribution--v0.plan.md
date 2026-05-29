# Implementation Plan: Feedback capture and attribution (v0)

## Parent User Story

[Feedback capture and attribution (v0)](../user-stories/owner-milestone-feedback--feedback-capture-and-attribution--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Implement a thin feedback-capture path that accepts owner milestone feedback input, validates contracts at the boundary, and persists an attributed record containing rating, optional comment, project, PRD version, milestone type, and timestamp. Ensure skip behavior remains non-persistent, enforce owner-only submission, and keep route handlers thin by delegating business rules to application/domain layers.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth owner session guards |
| Async/sync boundary | Synchronous per HTTP submit |
| Transaction boundary | Single feedback submission transaction |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `domain` — feedback capture entity/port expectations
- [x] `application` — capture use case (validation + mapping)
- [x] `contracts` — capture request/response schemas (if missing or incomplete)
- [x] `infrastructure` — attributed persistence adapter
- [x] `app` (routes) — submission endpoint (thin)
- [x] `ui` — owner prompt submit/skip wiring
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/feedback/*` | modify | Contract guarantees for attributed capture |
| `apps/web/src/domain/**` (feedback-related paths) | modify | Domain-safe capture payload types |
| `apps/web/src/application/**` (feedback capture use case) | add/modify | Centralized capture behavior |
| `apps/web/src/infrastructure/persistence/**` (feedback persistence) | modify | Store attributed feedback record |
| `apps/web/app/api/**` (feedback submission route) | add/modify | Auth + zod + use case invocation |
| `apps/web/app/dashboard/projects/[id]/**` | modify | Owner submit/skip UX integration |
| `docs/execution/user-stories/owner-milestone-feedback--feedback-capture-and-attribution--v0.md` | add | Parent story |
| `docs/execution/plans/owner-milestone-feedback--feedback-capture-and-attribution--v0.plan.md` | add | This plan |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| Feedback capture request/response + attributed fields | add/modify (if needed) | feedback contract tests |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| None planned at plan stage | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/feedback/*.test.ts` | contract | Input/output schema correctness |
| `apps/web/src/application/**/capture*.test.ts` | unit | Attribution mapping and skip behavior |
| `apps/web/app/api/**/route.test.ts` | route | owner guard + validation + errors |
| `pnpm -w run typecheck` | repo | Type safety regression check |
| `pnpm -w run build` | repo | Build regression check |

---

## Dependencies Added

- None

---

## Rollback

Revert feature commits on working branch; no forward-only migration required by this plan.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Incorrect attribution fields | Medium | High | Enforce schema + unit tests for mapping |
| Duplicate submissions | Medium | Medium | Disable submit in-progress + idempotency guard where applicable |
| Privacy leak to non-owner surfaces | Low | High | Maintain owner-only route and no exposure on share surfaces |

---

## Out of Scope (deliberate)

- Feedback analytics dashboards
- Historical feedback browsing UI
- Feedback edit/delete flows

---

## Approval

- [x] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (`typecheck` / `build` / tests) confirmed

**Approval status:** approved

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-28 | Initial implementation plan for feedback capture and attribution slice | — |
| 2026-05-28 | Decision recorded: approved | Product + Engineering lead |
