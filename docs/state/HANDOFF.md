---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
parallel_pipeline_status: in-progress
current_phase_primary: orch-credit-system--tests-state-finalization
current_phase_milestone_feedback: fa-owner-milestone-feedback--milestone-detection-and-prompt--complete
current_phase_aggregate: fa-owner-milestone-feedback--milestone-detection-and-prompt--complete
credit_system_tracking_phase: orch-credit-system--ledger-concurrency-and-stripe-webhook
current_blocker: null
parallel_current_blocker: null
payments_tracking_pr: 102
payments_tracking_branch: orchestrator/tracking-fa-payments--manual-credit-pack-checkout-1778625061087
fa_payments_manual_credit_pack_checkout: blocked
tracking_pr: 100
milestone_feedback_tracking_pr: 105
parallel_tracking_pr_legacy: 93
tracking_branch: orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412
milestone_feedback_tracking_branch: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778629075399
parallel_tracking_branch_legacy: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616475286
remediation_note: null
---

# Cloud Agent State Handoff

## Payments — manual credit pack checkout (`fa-payments--manual-credit-pack-checkout`)

- **Tracking PR:** **`#102`**, head **`orchestrator/tracking-fa-payments--manual-credit-pack-checkout-1778625061087`** → **`main`**.
- **Orchestration step:** **`blocked`** in `docs/state/status.json` (do not mark complete until slice bridge + implementation ship).
- **Anchor:** `docs/product/feature-areas/payments.md`, `docs/product/scope-slices/payments--manual-credit-pack-checkout.md`.
- **Prerequisite:** `orch-credit-system--ledger-concurrency-and-stripe-webhook` is **`complete`** in `status.json` (operator “blocked until credit system” no longer applies).
- **Why blocked:** The scope slice is **`exploratory`** with **Readiness for User Stories: NOT READY** (empty UX States / Data Touched; checklist unchecked). Per **execution-bridge** (§5 inputs, §9), a **User Story must not be authored** until the parent slice is **`ready-for-user-stories`**; no **approved Implementation Plan** can gate code before that.
- **User story / plan:** None yet — correct until slice promotion.
- **NEED_HUMAN:** Product/governance must **`/feature-area refine-slice`** (fill UX states, data touched, dependencies) and **`/feature-area promote-slice`** to `ready-for-user-stories`, then run **`/plan`** with chat **`approved`** before any implementation layer (`db-migration` … `tests-state-finalization`).
- **Safest next task:** Refine `payments--manual-credit-pack-checkout.md`; then architect User Story + Plan from slice only (no scope beyond Included Behavior).

## Orchestration — credits slice (`orch-credit-system--ledger-concurrency-and-stripe-webhook`)

- **Tracking PR:** **`#100`**, head **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412`** → **`main`**.
- **Anchors:** `docs/product/feature-areas/credit-system.md`, `docs/product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md`.

Orchestration: `orchestration.steps["orch-credit-system--ledger-concurrency-and-stripe-webhook"]` = **`complete`**. Mark tracking PR **`gh pr ready 100`** after CI green.

## Stack layers (credits epic)

| Layer | Status |
|-------|--------|
| `db-migration` | **complete** (`credit_transactions.correlation_id` present in Drizzle schema) |
| `contracts-domain` | **complete** (`CreditDeductionDecision`, `CreditsDomainService.computeDeductionDecision`, `canOperationProceed` aligned; unit tests updated) |
| `persistence-use-cases` | **complete** — `ICreditsRepository` correlation + `reverseCredits`; Drizzle transactional locking + idempotency; add/deduct use cases; `apps/web/lib/credits.ts` delegates to use cases with deterministic correlation helpers; starter grant in `SignUpUseCase` uses `starter-grant:${userId}` |
| `api-routes` | **complete** — `apps/web/lib/composition.ts` + `credits-http-bridge`; project routes (`clarify`, `generate-prd`, `feature-split/propose`) and `stripe/verify` use bridge (no `@/lib/credits` in `app/api/**`); AI consumption correlation ids: `<projectId>--<opType>--<uuid>` per PIS; `POST /api/stripe/webhook` verifies signature + idempotent `checkout.session.completed` grants via processor |
| `ui` | N/A for this slice |
| `tests-state-finalization` | **complete** — `checkout-session-webhook-processor.test.ts` (idempotency, validation, grant path); `packages/contracts` already has `webhook.contract.test.ts`; `SignUpUseCase` tests mock `CreditBalance` with `amount` |

## Owner milestone feedback — slice layers (tracking PR **#105**)

- **Pipeline step** `fa-owner-milestone-feedback--milestone-detection-and-prompt`: **complete** on tracking PR **#105** (`orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778629075399` → `main`). Same implementation as prior **#99** delivery: `OwnerMilestonePromptProvider` in project layout (**owner-only**), emitters for `prd_created` / `prd_updated` / `prd_shared` / `prd_viewed`, `pnpm typecheck` + `pnpm build` clean.

### Prior exploratory branch (tracking PR **#97**) — reference

- **Prior pipeline bookkeeping** described **in progress** on **`orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778623811696`**: contracts + **UI shell** (`OwnerMilestonePromptShell`): URL param **`milestonePayload`** (base64url JSON), **`signalMilestone`** context, **sessionStorage** per-milestone dismiss. Subsequent **#99** work added **`notifyMilestone`** + **`MilestoneFeedbackModal`** + clarify/refinement/PRD viewer emitter wiring; treat **#97** as superseded for active implementation paths.

| Layer | Status |
|-------|--------|
| `db-migration` | **N/A** — slice stores no prompt state server-side |
| `contracts-domain` | **complete** — `OwnerMilestoneDetectedPayloadSchema` (`packages/contracts/src/feedback/milestone-prompt.ts`) + tests |
| `persistence-use-cases` | **N/A** — no new server use cases for prompt-only surface |
| `api-routes` | **deferred** — optional; milestone wiring uses client context / layout |
| `ui` | **complete** — provider + `sessionStorage` dedupe + URL `om`/`omv` + **#97-era** `milestonePayload` / `OwnerMilestonePromptShell` patterns documented for historical comparison |
| `emitter-wiring` | **complete** (tracking **#105** / prior **#99**) — `notifyMilestone` from `clarification-chat.tsx`, `contextual-refinement-panel.tsx`, `prd-viewer.tsx` |
| `tests-state-finalization` | **complete** (orchestrator gates: root typecheck + build) |

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

**Credits slice (complete for this step):**

- **`tests-state-finalization`**: `apps/web/src/infrastructure/payments/checkout-session-webhook-processor.test.ts`; fixed `sign-up-usecase.test.ts` mocks to return `CreditBalance` (`amount`) not `{ balance }`.
- **`docs/state`**: pipeline step marked `complete`; tracking PR **#100** / branch **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412`**.

**Owner milestone slice (tracking PR #105):**

- UI layer + milestone emitters + `docs/state/status.json` / `HANDOFF` updated; orchestration step marked `complete`.
- **#97** milestone shell / `milestonePayload` / `signalMilestone` bookkeeping preserved above as historical reference; active shipping path is **Provider + `notifyMilestone`** (stack reconciled on **#105**).

## Safest next task

**Credits:**

1. **Deployment:** configure **`STRIPE_WEBHOOK_SECRET`** in the environment for `POST /api/stripe/webhook` (operator-owned secret; not set from this repo).

**Owner milestone (#105):**

- No further automated work on this slice unless product changes the prompt UX. If revisiting **#97**-only integrations, prefer **`notifyMilestone`** + **`OwnerMilestonePromptProvider`** at callsites.

## Key files (milestone detection slice)

- Contracts: `packages/contracts/src/feedback/milestone-prompt.ts`
- Plan: `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`
- UI: `apps/web/app/dashboard/projects/[id]/layout.tsx`, `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx`, emitters in `clarification-chat.tsx`, `contextual-refinement-panel.tsx`, `prd-viewer.tsx`

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
