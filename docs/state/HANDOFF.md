---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
current_phase: orch-credit-system--ledger-concurrency-and-stripe-webhook
current_blocker: null
tracking_pr: 91
tracking_branch: orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778616260895
remediation_note: null
---

# Cloud Agent State Handoff

## Orchestration — credits slice (`orch-credit-system--ledger-concurrency-and-stripe-webhook`)

- **Tracking PR:** `#91`, head **`orchestrator/tracking-orch-credit-system--ledger-concurrency-and-stripe-webhook-1778616260895`** → **`main`**.
- **Anchors:** `docs/product/feature-areas/credit-system.md`, `docs/product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md`.

## Stack layers (this epic)

| Layer | Status |
|-------|--------|
| `db-migration` | **complete** (`credit_transactions.correlation_id` present in Drizzle schema) |
| `contracts-domain` | **complete** (`CreditDeductionDecision`, `CreditsDomainService.computeDeductionDecision`, `canOperationProceed` aligned; unit tests updated) |
| `persistence-use-cases` | **next** — widen `ICreditsRepository` (`correlationId`, `reverseCredits`); Drizzle repo: idempotency + domain deduct path + reversal; refactor `apps/web/lib/credits.ts` + thread IDs through application use cases |
| `api-routes` | pending (Stripe webhook, etc.) |
| `ui` | N/A for this slice |
| `tests-state-finalization` | pending |

## This run delivered

- Landed **`contracts-domain`** for locked-row deduction: single authority `computeDeductionDecision` + tests.

## Safest next task

1. Implement **`persistence-use-cases`** only (port, `DrizzleCreditsRepository`, `lib/credits.ts`, deduct/add use cases, test doubles).
2. Run `pnpm typecheck` and `pnpm build` before marking further steps complete.

## Other pipeline items

- Separate branches/PRs (user-stories, milestone feedback, etc.) are unaffected; resume from their tracking PRs when unblocked.

