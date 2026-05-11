# Implementation Plan: Persist structured decision entries (v0)

## Parent User Story

[Persist structured decision entries (v0)](../user-stories/question-history--persist-structured-decision-entries--v0.md)

## Status

`executed`

> **Layout in effect:** `apps/web/` + `packages/**`  
> **Architecture Surface:** resolved  
> **NEED_HUMAN:** false  
> **NEED_UPDATE:** false  
> **Approval:** Orchestrator phase `fa-question-history--persist-structured-decision-entries` (2026-05-11) authorizes execution on tracking branch `orchestrator/tracking-fa-question-history--persist-structured-decision-entries-1778521309393`.  
> **PR sizing:** Bundles `packages/contracts` + `apps/web` API routes + governance/docs on tracking PR #48 (orchestrator bundle; exceeds default single-PR file/layer limits by design).

---

## Approach

Add Zod contracts under `packages/contracts` for **clarify** streamed JSON (`ClarifyAiResponseSchema`), **generate-PRD** streamed JSON (`GeneratePrdAiResponseSchema`), shared **decision UI** shape (`ClarifyDecisionUiSchema`), clarify **POST** body (`ClarifyPostBodySchema`), and **question history** list rows (`QuestionHistoryListResponseSchema`). Wire `apps/web` routes to validate **before side effects**: on clarify and generate-prd, parse the buffered stream JSON with `safeParse`, then deduct credits and insert rows; on invalid AI JSON, log and skip deduct/insert. For GET question history, map Drizzle rows to DTOs and `safeParse` before `Response.json`. Coerce invalid legacy `available_options` in DB to `null` in the outbound schema. Does not refactor fat routes or `lib/` (frozen v0 exceptions).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) |
| Auth source-of-truth | better-auth (`requireUser`) |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Per completing stream callback (no new cross-request transaction) |
| External dependencies | Managed AI (existing `callAI` / streaming helper in app `lib/`) |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [ ] `domain` — _None_
- [ ] `application` — _None_
- [x] `contracts` — new AI + questions/history schemas, package exports
- [ ] `infrastructure` — _None_ (DB schema unchanged)
- [x] `app` (routes) — clarify, generate-prd, questions GET
- [ ] `ui` — _None_
- [ ] `shared` — _None_

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/package.json` | modify | Export `./ai/clarify-stream`, `./ai/decision-ui`, `./ai/generate-prd-stream`, `./questions/history` |
| `packages/contracts/src/ai/clarify-stream.ts` | add | `ClarifyAiResponseSchema` |
| `packages/contracts/src/ai/decision-ui.ts` | add | `ClarifyDecisionUiSchema`, options |
| `packages/contracts/src/ai/generate-prd-stream.ts` | add | `GeneratePrdAiResponseSchema` |
| `packages/contracts/src/ai/index.ts` | modify | Re-exports |
| `packages/contracts/src/index.ts` | modify | Re-export `questions/history` if needed |
| `packages/contracts/src/questions/history.ts` | add | `ClarifyPostBodySchema`, list row schemas + legacy coerce |
| `packages/contracts/src/questions/history.contract.test.ts` | add | Contract tests |
| `apps/web/app/api/projects/[id]/clarify/route.ts` | modify | Inbound + validate stream before deduct/insert |
| `apps/web/app/api/projects/[id]/generate-prd/route.ts` | modify | Validate stream before deduct/insert |
| `apps/web/app/api/projects/[id]/questions/route.ts` | modify | Outbound list `safeParse` |
| `docs/product/scope-slices/question-history--persist-structured-decision-entries.md` | modify | `ready-for-user-stories` + UX/Data |
| `docs/product/feature-areas/question-history.md` | modify | Slice row **complete** |
| `docs/execution/user-stories/question-history--persist-structured-decision-entries--v0.md` | add | This story |
| `docs/execution/plans/question-history--persist-structured-decision-entries--v0.plan.md` | add | This plan |
| `docs/state/status.json` | modify | Orchestration step complete + mirrors |
| `docs/state/HANDOFF.md` | modify | Phase handoff |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| `ClarifyDecisionUiSchema` | add | `history.contract.test.ts` |
| `ClarifyAiResponseSchema` | add | `history.contract.test.ts` |
| `GeneratePrdAiResponseSchema` | add | `history.contract.test.ts` |
| `ClarifyPostBodySchema` | add | `history.contract.test.ts` |
| `QuestionHistoryRowSchema` / `QuestionHistoryListResponseSchema` | add | `history.contract.test.ts` (legacy coerce) |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| _None_ | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/questions/history.contract.test.ts` | contract | Valid / invalid parses; legacy `availableOptions` |
| `pnpm typecheck` | repo | Clean |
| `pnpm build` | repo | Next build succeeds |

---

## Dependencies Added

- None

---

## Rollback

Revert commits on the orchestrator tracking branch; no migration.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Invalid AI JSON upsets founders (no row) | medium | confusion | Log server-side; product iteration under guided-clarification FA |
| Legacy DB JSON surprises | low | null options | Preprocess in outbound schema |

---

## Out of Scope (deliberate)

- Thin-route refactors and `lib/` retirement
- New UI for browsing history
- Anonymous/share exposure of history

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Contracts-only cross-package imports; routes remain adapters |
| scope-critic | PASS | Matches slice boundary; generate-prd ordering is structural consistency only |

---

## Approval

- [x] User reviewed and approved this Plan (orchestrator phase authorization 2026-05-11)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in Tests above

**Approval status:** approved (orchestrator)  
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan + executed on orchestrator branch | cloud-agent |
