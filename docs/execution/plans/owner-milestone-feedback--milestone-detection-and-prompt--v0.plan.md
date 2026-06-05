# Implementation Plan: Owner milestone detection and prompt (v0)

## Parent User Story

[owner-milestone-feedback--milestone-detection-and-prompt--v0.md](../user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md)

## Status

`executed` — persisted under orchestrator tracking PR workflow (tracking PR **#93**, 2026-05-12).

> **Layout in effect:** post-migration (`apps/web/` + `packages/**`)
> **Architecture Surface:** resolved *(see Surface Block below)*
> **NEED_HUMAN:** false for contracts iteration as landed; subsequent UI/emitter iterations still require orchestrator approvals + Patch Intent Summary per execution bridge.*

---

## Approach

Stack work one hex-friendly layer per PR / orchestrator iteration (≤3 layers touched per `.cursor/rules/79-pr-sizing.mdc`).

**Landed iteration (this branch — contracts-domain + verification):**

1. **Contracts:** Add `OwnerMilestoneDetectedPayloadSchema` (project id, milestone type, optional PRD version id) reusing `OwnerMilestoneTypeSchema` so server actions and client providers share one validated shape — implemented under `packages/contracts/src/feedback/milestone-prompt.ts` (+ contract tests).

**Follow-up layers (explicitly deferred until next orchestrator approvals + PIS):**

2. **UI:** Add a client `OwnerMilestonePromptProvider` mounted under the signed-in dashboard project shell. It consumes validated payloads (from router search params or explicit React callbacks), shows a dismissible banner/toast with Skip, and uses `sessionStorage` to suppress repeats until full reload — see Touched Files.
3. **Wiring:** After successful PRD version capture/update, share mint, and owner PRD view-after-generation entry points, invoke the provider callback or navigate with a short-lived validated query/hash payload derived from `OwnerMilestoneDetectedPayloadSchema`.
4. **Ownership gate:** Only render the provider subtree when session user matches `project.ownerId` (passed from server layout).

Historical stacked-plan framing (iteration 1 = contracts-only; emitters/UI later): Iteration **1** delivered canonical outbound payload shape exported from `@repo/contracts` (`OwnerMilestoneDetectedPayloadSchema` / related types); emitters validate outbound payloads (`safeParse` in thin Next routes or server helpers); no DB writes in this slice. Session dedupe + UI hosting remain **subsequent layers** after orchestrator approvals + PIS where applicable.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | No new tables this slice (`docs/product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md` Data Touched) |
| Auth source-of-truth | better-auth `requireUser` / session claims before emit surfaces |
| Async/sync boundary | Synchronous milestone dispatch per request/route |
| Transaction boundary | Milestone payloads piggyback immediate success handlers — no transactional coupling |
| External dependencies | none |
| Payment shape | n/a |

---

## Layers Affected (by iteration + current branch)

### Iteration 1 — contracts-domain (complete on tracking PR #93)

- `contracts` — `packages/contracts/src/feedback/milestone-prompt.ts`, barrel/export paths as listed in Touched Files

### Deferred iterations (explicit)

- Iteration 2 — `/application` façade + domain-free helper exporting Result-safe dedupe semantics *(optional / thin adapter, if needed)*  
- Iteration 3 — `app` emitter hooks (PR capture route, clarification completion path, `/api/share/create`, reopen heuristic) respecting owner guard  
- Iteration 4 — `ui` lightweight prompt host wired into dashboard layouts with `sessionStorage`/React state suppression

_No layer merges until its iteration is unlocked in `docs/state/HANDOFF.md` / orchestrator step._

---

## Touched Files (exact paths — **landed** + planned follow-ups)

| Path | Operation | Notes |
|------|-----------|-------|
| `packages/contracts/src/feedback/milestone-prompt.ts` | **new** *(landed)* | Zod payload schema + inferred types |
| `packages/contracts/src/feedback/milestone-prompt.contract.test.ts` | **new** *(landed)* | Contract tests |
| `packages/contracts/src/feedback/index.ts` | modify *(landed)* | Re-export milestone prompt schemas |
| `packages/contracts/package.json` | modify *(if landed)* | Export subpath `./feedback/milestone-prompt` when required |
| `apps/web/app/dashboard/projects/[id]/layout.tsx` | modify — **next** | Wrap children with prompt provider + owner check |
| `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx` | new — **next** | Client UI + session dedupe |
| PRD version / share / PRD page callsites (determined during UI layer; e.g. routes under `apps/web/app/dashboard/projects/[id]/`) | modify — **next** | Emit milestone payload |

*Alternate stacked-plan module layout (`packages/contracts/src/owner-milestone-feedback/**`) was superseded by the `feedback/milestone-prompt` placement on this branch — follow landed paths.*

Subsequent iterations append rows here before execution.

---

## Contracts Changed

| Schema / type | Operation | Location | Test fixture |
|---------------|-----------|----------|---------------|
| `OwnerMilestoneDetectedPayloadSchema`, `OwnerMilestoneDetectedPayload` | add *(landed)* | `packages/contracts/src/feedback/milestone-prompt.ts` | `milestone-prompt.contract.test.ts` |
| _(optional umbrella)_ `OwnerMilestoneKindSchema` / outbound alias naming | aligned with slice | mirrors `OwnerMilestoneTypeSchema` usage | Vitest/unit around dedupe helper (optional, co-located with provider — **next layer**) |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|----------------------|
| none | — client-only suppression per Scope Slice — | — |

---

## Dependencies Added

- None.

---

## Tests

| Path | Type | Coverage / notes |
|------|------|------------------|
| `packages/contracts/src/feedback/milestone-prompt.contract.test.ts` | contract | Payload validation *(landed)* |
| Emitter / route integration tests | deferred | Arrive with iteration 3 hooks |
| Manual smoke: milestone paths | manual | Trigger each milestone path once as owner and confirm prompt + Skip — **after UI layer** |
| Root `pnpm typecheck` / `pnpm build` | required | Tracking branch gates before merge-ready |

---

## Rollback

Revert provider mount and milestone emits *(when UI lands)*; remove contracts export + files if unused. No persisted feedback rows in this slice.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-------------|
| **Missed callsites** *(UI phase)* | Medium | Milestone never fires | Manual checklist per AC + instrument flows |
| **Query-param leakage** | Low–Medium | Transient payloads in URLs | Prefer in-memory/React context; strip search params after read |
| Milestone discriminants drift from PR semantics | Medium | Emitters/UI disagree | Freeze enum list in contracts + cite PRD + Slice numbering in comments |
| Over-eager emits causing duplicate UX | Medium | Spammy prompts | Session/`sessionStorage` dedupe per Slice |

---

## Out of Scope (deliberate)

- Persisting dismissal or feedback payloads
- Non-owner observers / anonymous share UX
- Extending milestones beyond enumerated four events
- Persisting feedback text or persistence (`feedback-capture-and-attribution`)
- Collaboration / invited-editor feedback prompts

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-12 | Proposed stacked plan for orchestrator milestone prompt slice (`status=proposed`, awaiting approval) — tracking PR **#92** era | cloud-agent |
| 2026-05-12 | Contracts-domain iteration landed + verification on tracking PR **#93**; Status `executed` for executed contracts layer | orchestrator |
