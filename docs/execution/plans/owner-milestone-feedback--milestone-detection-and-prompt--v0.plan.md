# Implementation Plan: Milestone detection and prompt (v0)

## Parent User Story

[Milestone detection and prompt (v0)](../user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md)

## Status

`approved`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extend Zod contracts for owner milestone enums, feedback POST shapes, and the PRD-generation SSE completion envelope (including optional `prdVersionId` and `prdGenerationKind`). Augment buffered streaming helpers and the generate-prd route to merge those extras into the final SSE event. In the Clarification chat client, `safeParse` the completed envelope and map `first` vs `update` to slice milestone strings; reuse `sessionStorage` keys per milestone + version within the browser session. In PRD Viewer, gate `prd_shared` prompts on session keys. In Project Workspace, surface `prd_reopened_after_generation` when entering the PRD tab from another tab or switching versions on the PRD tab, skipping one activation immediately after clarify-driven generation navigates away to avoid stacking modals. Validate feedback POST bodies in `/api/feedback` with Zod.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres/Drizzle (unchanged); no schema change |
| Auth | better-auth (`requireUser` on `/api/feedback`; owner-only UX) |
| Async/sync boundary | Synchronous SSE stream |
| Contracts | `@repo/contracts` for client + feedback route |

---

## Layers Affected

- [x] `contracts`
- [x] `app` routes (feedback, generate-prd)
- [x] `ui` components (dashboard project workspace subtree)
- [x] `lib` adapters (`createBufferedStreamingResponse` note: existing retirement path—touched narrowly per slice)

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|----------|
| `packages/contracts/src/feedback/milestone.ts` | add | Milestone enums + POST body schema |
| `packages/contracts/src/feedback/milestone.test.ts` | add | Contract tests |
| `packages/contracts/src/feedback/index.ts` | modify | Re-exports |
| `packages/contracts/src/ai/generate-prd-stream.ts` | modify | Completion envelope schema |
| `packages/contracts/package.json` | modify | `exports` for feedback entry |
| `packages/contracts/src/index.ts` | modify | Barrel export |
| `apps/web/app/api/feedback/route.ts` | modify | inbound zod validation |
| `apps/web/app/api/projects/[id]/generate-prd/route.ts` | modify | emit completion extras |
| `apps/web/lib/ai-service.ts` | modify | merge `onComplete` extras into final SSE chunk |
| `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt-session.ts` | add | Session key helpers |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | consume completion envelope |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | share + labels |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | reopened milestone |
| `apps/web/components/milestone-feedback-modal.tsx` | modify | session marks on dismiss |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|----------------|
| `OwnerMilestoneTypeSchema`, `MilestoneFeedbackPostBodySchema` | add | `milestone.test.ts` |
| `GeneratePrdStreamCompletedEnvelopeSchema` | add | clarified via clarification flow tests / usage |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — | — |

---

## Dependencies Added

| Package | Reason |
|---------|--------|
| None | |

---

## Rollback

Revert PR—no migrations.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extra SSE keys rejected by strict clients | Low | Medium | envelope fields optional |

---

## Out of Scope (deliberate)

- Feedback attribution slice UX and schema changes beyond prompt typing

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Planned for milestone detection slice (`approved`) | — |
