# Implementation Plan: Owner milestone detection and feedback prompt (v0)

## Parent User Story

[Owner milestone detection and feedback prompt (v0)](../user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add Zod contracts under `packages/contracts/src/feedback/` for owner milestone types, POST `/api/feedback` bodies, and successful/duplicate responses per `74-contracts-zod.mdc`. Wire `POST apps/web/app/api/feedback/route.ts` to parse inbound JSON with `SubmitMilestoneFeedbackRequestSchema`, keep existing Drizzle insert against `milestoneFeedback`, and validate outbound JSON with `MilestoneFeedbackRowSchema` or `MilestoneFeedbackDuplicateResponseSchema`. In the dashboard UI, reuse `MilestoneFeedbackModal`: `ClarificationChat` sets `prd_created` vs `prd_updated_after_clarification` using the count of versions **before** generation completes (passed from `ProjectWorkspace` as `prdVersions.length`). `PrdViewer` triggers `prd_shared` after a validated share mint response. `ProjectWorkspace` handles `prd_reopened` when switching into the PRD tab from another tab, suppressing duplicate prompts for the same browser session via `sessionStorage` and skipping one immediate reopen right after Generate PRD lands on the PRD tab. Auth remains via existing `requireUser` Result pattern on the route. Record planned drift: existing feedback route performs persistence directly rather than a separate application use case (frozen pattern for this slice; no new `lib/`).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth — `requireUser` in route |
| Async/sync boundary | Synchronous per request |
| Transaction boundary | Single insert per POST; duplicate check read then write |
| External dependencies | None for this slice |
| Payment shape (if money) | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [x] `contracts` — new feedback milestone schemas + tests
- [x] `infrastructure` — none (DB access remains in route adapter for this slice)
- [x] `app` (routes, server actions, server components) — `app/api/feedback/route.ts`
- [x] `ui` — milestone modal + project workspace, clarification chat, PRD viewer
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/feedback/milestone.ts` | create | Owner milestone + request/response zod |
| `packages/contracts/src/feedback/milestone.test.ts` | create | Contract tests |
| `packages/contracts/src/feedback/index.ts` | modify | Barrel export |
| `packages/contracts/src/index.ts` | modify | Re-export feedback |
| `packages/contracts/package.json` | modify | Export map entry `./feedback` |
| `apps/web/app/api/feedback/route.ts` | modify | Inbound/outbound zod validation on POST |
| `apps/web/components/milestone-feedback-modal.tsx` | modify | Types + response parse |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | Milestone type from existing version count |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Pass count; `prd_reopened` tab handler + modal |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Ensure `prd_shared` uses typed milestone (as needed) |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `OwnerMilestoneTypeSchema` | create | `milestone.test.ts` |
| `SubmitMilestoneFeedbackRequestSchema` | create | `milestone.test.ts` |
| `MilestoneFeedbackRowSchema` | create | `milestone.test.ts` |
| `MilestoneFeedbackDuplicateResponseSchema` | create | `milestone.test.ts` |
| `MilestoneFeedbackPostResponseSchema` | create | `milestone.test.ts` |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| — | — | n/a (uses existing `milestone_feedback`) |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/feedback/milestone.test.ts` | unit | Valid/invalid parses for milestone feedback contracts |
| `pnpm typecheck` / `pnpm build` (repo root) | integration | Monorepo compiles after changes |

---

## Dependencies Added

- none

---

## Rollback

Revert the listed files to prior commit. No schema migration to roll back. Clear optional `sessionStorage` key `zedos:milestone-prd-reopened:<projectId>` is client-only and needs no server rollback.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `prd_reopened` over- or under-triggers | medium | UX annoyance or missed prompt | Session + post-generate suppression; document behavior in scope slice |
| Route remains “thick” vs hex ideal | low | Review noise | Note follow-up to extract use case in a hygiene slice |

---

## Out of Scope (deliberate)

- Anonymous viewer prompts
- New persistence tables or migrations
- Full feedback-capture-and-attribution slice

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Contracts-only boundary; UI uses `@repo/contracts` |
| scope-critic | PASS | Stays within four milestones and owner-only surface |

---

## Approval

- [x] User reviewed and approved this Plan
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved  
**Approval date:** 2026-05-11

**Note:** Approved under orchestrator cloud-agent instruction to complete pipeline step `fa-owner-milestone-feedback--milestone-detection-and-prompt` with tracking PR #55.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan + approval for orchestrator execution | cloud-agent |
