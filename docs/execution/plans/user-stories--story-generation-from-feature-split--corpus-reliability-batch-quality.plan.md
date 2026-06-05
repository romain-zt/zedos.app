# Implementation Plan: User story corpus reliability, batch generation, and draft quality

## Parent User Story

[User story corpus reliability, batch generation, and draft quality](../user-stories/user-stories--story-generation-from-feature-split--corpus-reliability-batch-quality.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Fix production **`TypeError` … `Buffer.byteLength` … `Received an instance of Date`** by removing Drizzle `sql`…`` interpolations that pass raw JS `Date` into the Postgres driver (`user-story-corpus-repository.ts` `save` branch `UPDATE … updated_at = ${now}` and `markReviewReady`). Use Drizzle’s typed **`update(userStoryCorpora).set({ updatedAt: … })`** / equivalent per **`75-drizzle.mdc`** and **`72-hexagonal-boundaries.mdc`** (persistence stays in infrastructure).

Improve **draft quality**: tighten **`user-story-draft.ts`** system prompt so each story is a **distinct user-visible behavior**, explicitly forbidding verbatim recycling of `label` / `valueLine` / `boundaryCue` as the sole content. Adjust **template mode** in **`generate-user-story-draft-usecase.ts`** to emit a **short behavioral scaffold** (e.g. structured user-story shape) instead of one concatenated echo of cluster fields—still cheap, no extra vendor calls.

**Batch generation:** Prefer **client-orchestrated** calls to the existing **`POST …/user-stories/generate`** (one cluster per request) to avoid new credit / transaction semantics until a dedicated bulk use case is justified. Extend **`user-stories-workspace.tsx`** with multi-select (checkboxes), a **“Generate selected (AI)”** / **“Generate selected (template)”** action, progress indicator, and per-cluster error toasts. **Product prerequisite:** parent slice Included Behavior must allow multi-select batch (see **Appendix A**); until merged, ship persistence + prompt + template + **single-cluster UX** only, or hide bulk buttons behind a simple feature check tied to “slice text updated” (implementer’s choice documented in PIS).

Ground in **`73-result-rop.mdc`** (repository continues `Result`), **`74-contracts-zod.mdc`** (no new DTOs if no new HTTP shape), **`77-nextjs.mdc`** (route stays thin; bulk is UI-driven).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`packages/db`) |
| Auth source-of-truth | better-auth (`requireUser` pattern unchanged) |
| Async/sync boundary | Synchronous per HTTP request; bulk = sequential client POSTs |
| Transaction boundary | Existing per-cluster transactional `save` unchanged |
| External dependencies | Managed AI via existing `infrastructure/ai` + `lib/ai-service` bridge (frozen path; no new `lib/` consumers) |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [ ] `domain` — none expected
- [x] `application` — template scaffold behavior in generate use case
- [ ] `contracts` — none if UI-only batch (else add batch request schema + test)
- [x] `infrastructure` — Drizzle repository fix; AI prompt text
- [ ] `app` — no route change if UI-only bulk
- [x] `ui` — `user-stories-workspace.tsx` multi-select + bulk actions
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.ts` | modify | Fix `Date` binding in `save` / `markReviewReady` using Drizzle `update` API |
| `apps/web/src/infrastructure/ai/user-story-draft.ts` | modify | Prompt quality / anti-echo rules |
| `apps/web/src/application/user-stories/generate-user-story-draft-usecase.ts` | modify | Template scaffold output |
| `apps/web/src/application/user-stories/generate-user-story-draft-usecase.test.ts` | modify | Expectations for template path |
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.test.ts` | modify | Assert `update` / `execute` usage if mocks need alignment |
| `apps/web/app/dashboard/projects/[id]/_components/user-stories-workspace.tsx` | modify | Multi-select + bulk generate UX |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| *None* (bulk stays UI-only) | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| *None* | — | — |

---

## Dependencies Added

- None

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/src/infrastructure/persistence/user-story-corpus-repository.test.ts` | integration | `save` / `markReviewReady` no longer rely on `sql`+`Date` anti-pattern; `updatedAt` still set |
| `apps/web/src/application/user-stories/generate-user-story-draft-usecase.test.ts` | unit | Template output shape / non-duplicate behavior |

---

## Rollback

Revert repository + UI commits; schema unchanged. If prompt regression, revert `user-story-draft.ts` only.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sequential bulk AI triggers rate limits / cost spikes | medium | medium | Cap concurrent requests (e.g. 1 at a time), show progress, stop on first hard failure per product choice |
| Slice text lag vs UI | low | medium | Gate bulk UI until `refine-slice` merged; document in PIS |
| `lib/ai-service` coupling | low | low | No expansion—only prompt string edits |

---

## Out of Scope (deliberate)

- New server-side bulk endpoint / new credit aggregation rules (unless a later Plan adds them)
- Changing `user_story_corpora` uniqueness (still one corpus per cluster)
- E2E Playwright suite in this PR (optional manual checklist only)

---

## Appendix A — Proposed slice wording (for `/feature-area refine-slice`, not implementer allow-list)

**Replace** Included bullet:

> Selecting exactly one confirmed feature cluster originating from an approved PRD-derived split artifact.

**With:**

> Selecting one or more confirmed feature clusters originating from an approved PRD-derived split artifact for generation; the review and edit surface remains **one cluster at a time** while each cluster retains its own persisted corpus and linkage to cluster identifiers.

**UX States — Cluster selection row:** clarify that multi-select is allowed for **queued / batch generation**, while single active cluster remains for editing.

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Fix stays in infrastructure; no new cross-layer leaks; replace raw SQL Date bind with Drizzle update |
| scope-critic | PASS | Multi-select explicitly tied to slice `refine-slice` prerequisite + Appendix A; no hidden collaboration / v0 violations |

---

## Approval

- [x] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-15

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-15 | Initial proposal (prod Date bind, batch UX, draft quality) | — |
| 2026-05-15 | Status `executed` after user `executed` | — |
