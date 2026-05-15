---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
parallel_pipeline_status: in-progress
parallel_pipeline_status_prior_branch_note: blocked-awaiting-plan-approval — historic parallel orch branch gate (superseded on mainline where milestone work advanced to PR #97 + UI complete).
current_phase_primary: orch-credit-system--tests-state-finalization
current_phase_primary_prior_branch_note: fa-owner-milestone-feedback--emitter-wiring-next — older bookkeeping before main advanced credits tests-finalization focus; fa-owner-milestone-feedback--ui-next — older parallel bookkeeping on credits orch tracking branch.
current_phase_milestone_feedback: fa-owner-milestone-feedback--feedback-capture-and-attribution--blocked
current_phase_milestone_feedback_prior_branch_note: fa-owner-milestone-feedback--milestone-detection-and-prompt — complete on tracking PR #99; fa-owner-milestone-feedback--milestone-detection-and-prompt--ui-layer-complete — prior state before milestone marked complete on main; fa-owner-milestone-feedback--milestone-detection-and-prompt--contracts-complete — prior parallel narrative when milestone tracked on PR #93.
current_phase_aggregate: fa-owner-milestone-feedback--milestone-detection-and-prompt--complete
current_phase_aggregate_prior_branch_note: fa-owner-milestone-feedback--milestone-detection-and-prompt--emitter-wiring-next — prior aggregate before completion; fa-owner-milestone-feedback--milestone-detection-and-prompt--blocked-plan-approval — superseded where contracts/UI landed on subsequent tracking PRs.
credit_system_tracking_phase: orch-credit-system--ledger-concurrency-and-stripe-webhook
current_blocker: null
parallel_current_blocker: null
parallel_current_blocker_prior_branch_note: NEED_HUMAN — Approve Implementation Plan before Iteration‑1 contracts code (historic on parallel branch; superseded where contracts landed on tracking PR #93 then advanced on PR #97).
payments_tracking_pr: 102
payments_tracking_branch: orchestrator/tracking-fa-payments--manual-credit-pack-checkout-1778625061087
fa_payments_manual_credit_pack_checkout: blocked
tracking_pr: 100
parallel_credit_tracking_pr: 98
milestone_feedback_tracking_pr: 105
prior_milestone_feedback_tracking_pr: 97
parallel_tracking_pr_legacy: 93
parallel_tracking_pr_legacy_prior_branch: 92
tracking_branch: orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412
parallel_credit_tracking_branch: orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778623987568
milestone_feedback_tracking_branch: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778629075399
prior_milestone_feedback_tracking_branch: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778623811696
parallel_tracking_branch_legacy: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616475286
parallel_tracking_branch_legacy_92: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616264079
remediation_note: null
---

# Cloud Agent State Handoff

## User stories — corpus reliability, batch UI, draft quality (`fa-user-stories--corpus-reliability-batch-quality--impl`)

- **Tracking PR:** **`#118`**, head **`orchestrator/tracking-fa-user-stories--corpus-reliability-batch-quality--impl-1778838044060`** → **`main`**.
- **Orchestration step:** **`in-progress`** in `orchestration.steps["fa-user-stories--corpus-reliability-batch-quality--impl"]` — **`persistence-use-cases`** layer complete; **`fa_user_stories.corpus_reliability_batch_quality_impl`** in `docs/state/status.json` mirrors verification + **`next_layer`:** **`ui`**.
- **Anchors:** `docs/product/feature-areas/user-stories.md`, `docs/product/scope-slices/user-stories--story-generation-from-feature-split.md`, user story `docs/execution/user-stories/user-stories--story-generation-from-feature-split--corpus-reliability-batch-quality.md`, plan `docs/execution/plans/user-stories--story-generation-from-feature-split--corpus-reliability-batch-quality.plan.md`.
- **Delivered this run (2026-05-15) — `persistence-use-cases` layer:** `DrizzleUserStoryCorpusRepository.markReviewReady` uses parameterized `sql` with **`Date`** values (Drizzle ORM `.set()` typings omit nullable `review_ready_at` on this schema build); **`user-story-draft.ts`** system prompt tightened for distinct behaviors and observable acceptance; template-mode behavioral scaffold + **`generate-user-story-draft-usecase`** tests updated. Checks on pushed head: **`pnpm typecheck`**, **`pnpm build`**, **`vitest run`** `generate-user-story-draft-usecase.test.ts` — green.
- **Next eligible layer:** **`ui`** — multi-select + bulk draft generation in **`apps/web/app/dashboard/projects/[id]/_components/user-stories-workspace.tsx`**, then **`tests-state-finalization`** as needed. Do **not** call **`gh pr ready 118`** until the operator checklist marks the orchestration step **`complete`** and gates stay green.

## Owner milestone feedback — feedback capture and attribution (`fa-owner-milestone-feedback--feedback-capture-and-attribution`)

- **Tracking PR:** **`#104`**, head **`orchestrator/tracking-fa-owner-milestone-feedback--feedback-capture-and-attribution-1778629061701`** → **`main`**.
- **Orchestration step:** **`blocked`** in `docs/state/status.json` — no code until governance bridge is satisfied.
- **Anchor:** `docs/product/feature-areas/owner-milestone-feedback.md`, `docs/product/scope-slices/owner-milestone-feedback--feedback-capture-and-attribution.md`.
- **Why blocked:** Scope slice is **`exploratory`** with **Readiness for User Stories: NOT READY** (UX States / Data Touched empty; checklist unchecked). Per **execution-bridge** §5, a **User Story must not be authored** until the slice is **`ready-for-user-stories`**; no **approved Implementation Plan** can gate code before that. Dependency row still lists **`milestone-detection-and-prompt`** as exploratory — reconcile with shipped **#99** when refining.
- **User story / plan:** None — correct until slice promotion.
- **NEED_HUMAN:** Product/governance must **`/feature-area refine-slice`** (fill UX states, data touched, dependencies) and **`/feature-area promote-slice`** to `ready-for-user-stories`, then run **`/plan`** with chat **`approved`** before any implementation layer (`db-migration` onward).
- **This run (2026-05-12):** Updated `status.json` (`orchestration.steps[...] = blocked`, `fa_owner_milestone_feedback.feedback_capture_and_attribution`, `orchestration.blocker`) and this HANDOFF; **no** `gh pr ready` — draft stays open.
- **Safest next task:** Refine `owner-milestone-feedback--feedback-capture-and-attribution.md`; then architect User Story + Plan from slice only.

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

- **Tracking PR (mainline bookkeeping):** **`#100`**, head **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412`** → **`main`**.
- **Tracking PR (parallel branch — PR #98 merge resolution):** **`#98`**, head **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778623987568`** → **`main`**.
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
| `tests-state-finalization` | **complete** — `route.test.ts` for `POST /api/stripe/webhook` (+ error message expectations); **`checkout-session-webhook-processor.test.ts`** (idempotency, validation, grant path); `packages/contracts` **`webhook.contract.test.ts`**; signup / `SignUpUseCase` tests mock **`CreditBalance`** with **`amount`** (not `{ balance }`); `pnpm typecheck` + `pnpm build` + **`pnpm test`** (apps/web full run / vitest) green |

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

- Completed **`tests-state-finalization`** (tracking PR **#98** path): Stripe webhook route tests aligned with `ExternalServiceError.message`; signup unit test mocks `addCredits` with **`CreditBalance`** / **`amount`** shape.
- Completed **`api-routes`** (earlier commits on stack): composition root, HTTP bridge, Stripe webhook verification (`Stripe.API_VERSION`), checkout-session processor, route wiring; legacy `lib/credits.ts` uses shared `getCreditsComposition()` only.
- **`tests-state-finalization`** (mainline **#100** path): `apps/web/src/infrastructure/payments/checkout-session-webhook-processor.test.ts`; fixed `sign-up-usecase.test.ts` mocks to return `CreditBalance` (`amount`) not `{ balance }`.
- **`docs/state`**: pipeline step marked `complete`; tracking PR **#100** / branch **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778624552412`** (plus parallel **#98** branch merged main).

**Owner milestone slice (tracking PR #105):**

- UI layer + milestone emitters + `docs/state/status.json` / `HANDOFF` updated; orchestration step marked `complete`.
- **#97** milestone shell / `milestonePayload` / `signalMilestone` bookkeeping preserved above as historical reference; active shipping path is **Provider + `notifyMilestone`** (stack reconciled on **#105**).

## Safest next task

**Credits:**

1. Slice **`orch-credit-system--ledger-concurrency-and-stripe-webhook`** is **complete** in repo state; after CI green on mainline tracking PR **`#100`**, run **`gh pr ready 100 --repo romain-zt/zedos.app`**. Parallel credits tracking PR **`#98`** branch merged **`origin/main`** via conflict-resolution merge commit — verify CI then **`gh pr ready 98`** if that PR remains the operator-visible surface.
2. Configure **`STRIPE_WEBHOOK_SECRET`** in deployment for **`POST /api/stripe/webhook`** (operator-owned secret; not set from this repo).
3. **Deployment (duplicate emphasis):** configure **`STRIPE_WEBHOOK_SECRET`** in the environment for `POST /api/stripe/webhook`.

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
