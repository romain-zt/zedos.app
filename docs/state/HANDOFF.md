---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
parallel_pipeline_status: in-progress
current_phase_primary: orch-credit-system--tests-state-finalization
current_phase_milestone_feedback: fa-owner-milestone-feedback--milestone-detection-and-prompt--ui-layer-complete
current_phase_aggregate: fa-owner-milestone-feedback--milestone-detection-and-prompt--tests-state-finalization-next
credit_system_tracking_phase: orch-credit-system--ledger-concurrency-and-stripe-webhook
current_blocker: null
parallel_current_blocker: null
tracking_pr: 95
milestone_feedback_tracking_pr: 101
parallel_tracking_pr_legacy: 93
tracking_branch: orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778622207100
milestone_feedback_tracking_branch: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778624614710
parallel_tracking_branch_legacy: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616475286
remediation_note: null
---

# Cloud Agent State Handoff

## Orchestration — credits slice (`orch-credit-system--ledger-concurrency-and-stripe-webhook`)

- **Tracking PR:** `#95`, head **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778622207100`** → **`main`**.
- **Anchors:** `docs/product/feature-areas/credit-system.md`, `docs/product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md`.

## Stack layers (credits epic)

| Layer | Status |
|-------|--------|
| `db-migration` | **complete** (`credit_transactions.correlation_id` present in Drizzle schema) |
| `contracts-domain` | **complete** (`CreditDeductionDecision`, `CreditsDomainService.computeDeductionDecision`, `canOperationProceed` aligned; unit tests updated) |
| `persistence-use-cases` | **complete** — `ICreditsRepository` correlation + `reverseCredits`; Drizzle transactional locking + idempotency; add/deduct use cases; `apps/web/lib/credits.ts` delegates to use cases with deterministic correlation helpers; starter grant in `SignUpUseCase` uses `starter-grant:${userId}` |
| `api-routes` | **complete** — `apps/web/lib/composition.ts` + `credits-http-bridge`; project routes (`clarify`, `generate-prd`, `feature-split/propose`) and `stripe/verify` use bridge (no `@/lib/credits` in `app/api/**`); AI consumption correlation ids: `<projectId>--<opType>--<uuid>` per PIS; `POST /api/stripe/webhook` verifies signature + idempotent `checkout.session.completed` grants via processor |
| `ui` | N/A for this slice |
| `tests-state-finalization` | **next** — contract/integration coverage for webhook + routes; then mark orchestration step complete + `gh pr ready` |

## Owner milestone feedback — slice layers (tracking PR **#101**)

- **Pipeline step** `fa-owner-milestone-feedback--milestone-detection-and-prompt`: **in progress** on tracking PR **#101** (`orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778624614710` → `main`). Contracts + UI shell + **emitter wiring** landed (`signalMilestone` at clarify / refinement / share / PRD-tab view); **next layer = tests-state-finalization** (smoke tests, then orchestration `complete`, then `gh pr ready 101`).

| Layer | Status |
|-------|--------|
| `db-migration` | **N/A** — slice stores no prompt state server-side |
| `contracts-domain` | **complete** — `OwnerMilestoneDetectedPayloadSchema` (`packages/contracts/src/feedback/milestone-prompt.ts`) + tests |
| `persistence-use-cases` | **N/A** — no new server use cases for prompt-only surface |
| `api-routes` | **deferred** — optional; milestone wiring can use client context / layout props |
| `ui` | **complete** — `OwnerMilestonePromptShell` + `useOwnerMilestonePrompt` (`apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx`), mounted in `apps/web/app/dashboard/projects/[id]/layout.tsx` (owner gate via `GetProjectUseCase`); sessionStorage dismiss per milestone type; optional `milestonePayload` query (base64url JSON) |
| `emitter-wiring` | **complete** — `prd_created` (`clarification-chat`), `prd_updated` (`contextual-refinement-panel`), `prd_shared` (`prd-viewer`), `prd_viewed` (enter PRD tab in `project-workspace` after `await fetchVersions`) |
| `tests-state-finalization` | **next** — smoke + `orchestration.steps[...] = complete` + `gh pr ready 101 --repo romain-zt/zedos.app` |

### Governance artifacts (milestone slice)

- Scope slice: `docs/product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md`
- User story: `docs/execution/user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md`
- Implementation plan: `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`

## User stories slice (prior work — reference)

- **`db-migration` → `ui`** stack for story generation — complete per PR **#87** tracking branch history.

## Historical / parallel context

- **Prior milestone tracking:** `fa-services-feature-split--prd-to-feature-split--impl` complete (PR **#75**). Optional remediation branch may still carry post-merge commits — see archive rows in `status.json` if needed.
- Question-coverage readiness score + question preview chips (**#70**) — complete per earlier handoff.

## This run delivered (combined tracks)

**Credits slice:**

- Completed **`api-routes`**: composition root, HTTP bridge, Stripe webhook verification (`Stripe.API_VERSION`), checkout-session processor, route wiring; legacy `lib/credits.ts` uses shared `getCreditsComposition()` only.

**Owner milestone slice (tracking PR #101):**

- UI layer: project layout + client milestone banner/provider; see `apps/web/app/dashboard/projects/[id]/layout.tsx` and `_components/owner-milestone-prompt.tsx`. Bookkeeping: `docs/state/status.json` `fa_owner_milestone_feedback`.

## Safest next task

**Credits:**

1. Run **`tests-state-finalization`** for this slice: webhook + credit-route fixtures; then set `orchestration.steps["orch-credit-system--ledger-concurrency-and-stripe-webhook"]` to **`complete`** and call **`gh pr ready 95`** (after gates green).
2. Configure **`STRIPE_WEBHOOK_SECRET`** in deployment for the new webhook endpoint.

**Owner milestone (#101):**

1. **Tests + finalization**: milestone emitter smoke coverage if needed; `pnpm typecheck` + `pnpm build`; mark `orchestration.steps["fa-owner-milestone-feedback--milestone-detection-and-prompt"]` = `"complete"`; then `gh pr ready 101 --repo romain-zt/zedos.app`.

## Key files (milestone detection slice)

- Contracts: `packages/contracts/src/feedback/milestone-prompt.ts`
- Plan: `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`
- UI: `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx`, `apps/web/app/dashboard/projects/[id]/layout.tsx`

## Other pipeline items

- Separate branches/PRs are tracked independently; resume from their tracking PRs when unblocked.

---

## Parallel pipeline — owner milestone feedback (`fa-owner-milestone-feedback--milestone-detection-and-prompt`) — bookkeeping / gate history

Older orchestrator bookkeeping described this step as **`blocked`** pending explicit Implementation Plan promotion + chat Patch Intent Summary `approved`; **tracking PR #92**. Subsequent work advanced on **tracking PR #93** with contracts-domain complete per `status.json` / sections above.

- Canonical docs:
  - Scope Slice — `docs/product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md`
  - User Story — `docs/execution/user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md`
  - Implementation Plan — `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`

### Blocker narrative (historical — reconcile with current branch state)

```
NEED_HUMAN: Promotion of Implementation Plan from `proposed` → `approved` (execution bridge §6). Until then autonomous agents MUST NOT mutate `packages/**`/`apps/web/**` beyond governance docs already pushed. Afterwards begin Iteration 1 ONLY (`contracts-domain` layer — owner milestone Zod discriminants).
```

Legacy mirrors (superseded by PR #93 where applicable):

- **`fa_owner_milestone_feedback.milestone_detection_and_prompt`**: prior **`blocked`** state tracked with PR `#92`; current tracking PR **`#93`**.

### Completed earlier run narrative (PR #92 era)

- Authored **`ready-for-implementation`** user story + **`proposed`** stacked implementation plan (Iteration 1 = contracts-only) committed to tracking branch.
- Synced **`docs/state/status.json`** mirrors + blocker fields for orchestrator bookkeeping.

### Next eligible task notes (human gate — superseded once plan + PIS approved on current branch)

1. Rename plan `Status` stanza to **`approved`** in-repo *after human records approval*.
2. Execute **contracts-domain iteration** (`packages/contracts/src/owner-milestone-feedback/**` + barrel) per plan table *(note: landed implementation may use `packages/contracts/src/feedback/milestone-prompt.ts` instead — follow Implementation Plan touched paths on branch)*.
3. Run `pnpm typecheck` scoped to `@repo/contracts` if available, otherwise root `pnpm typecheck`.
4. Update `HANDOFF.md` next-layer pointer → **emitter hooks** iteration (thin Next routes referencing contracts).

### Out of scope for immediate next micro-layer (milestone feedback)

DB migrations, emitter wiring, dashboard UI hosting — reserved for later stacked commits per Implementation Plan backlog table.
