---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
current_phase: fa-services-feature-split--prd-to-feature-split--impl-complete
current_blocker: null
tracking_pr: 75
tracking_branch: orchestrator/tracking-fa-services-feature-split--prd-to-feature-split--impl-1778551730470
remediation_note: "Post-merge fix commit on tracking_branch; open PR to main (automation could not create PR)."
---

# Cloud Agent State Handoff

## Orchestration (canonical)

- **Pipeline step** `fa-services-feature-split--prd-to-feature-split--impl`: **complete**. Tracking PR **#75** merged to `main`. Follow-up remediation (owner-scoped PRD lookup, `feature_split` credits, refinement UI types, docs state) is on branch `orchestrator/tracking-fa-services-feature-split--prd-to-feature-split--impl-1778551730470` — **open a PR to `main`** if those commits are not yet on `main`.
- **Prior:** Question-coverage readiness score + question preview chips (**#70**) — complete per prior handoff.

## What changed (this phase)

- **Scope slice:** `docs/product/scope-slices/services-feature-split--prd-to-feature-split.md`
- **User story:** `docs/execution/user-stories/services-feature-split--prd-to-feature-split--v0.md`
- **Implementation plan:** `docs/execution/plans/services-feature-split--prd-to-feature-split--v0.plan.md`
- **DB:** `packages/db/src/schema/feature-split.ts`, `packages/db/src/migrations/0004_feature_split_tables.sql` (already existed on branch), `packages/db/src/types.ts` (added `NewFeatureSplitRow`, `FeatureSplitUpdate`, `NewFeatureSplitClusterRow`)
- **Contracts:** `packages/contracts/src/feature-split/feature-split.ts`, `packages/contracts/src/ai/feature-split-proposal.ts` (already existed on branch)
- **Domain:** `apps/web/src/domain/feature-split/` (port + entity types + barrel)
- **Persistence:** `apps/web/src/infrastructure/persistence/feature-split-repository.ts` (`DrizzleFeatureSplitRepository`)
- **AI infra:** `apps/web/src/infrastructure/ai/feature-split-proposal.ts` (wraps `callAI`, validates with `FeatureSplitProposalSchema`)
- **Use cases:** `apps/web/src/application/feature-split/` (get, save-draft, confirm, propose)
- **Tests:** save-draft + confirm use case unit tests
- **Routes:** `apps/web/app/api/projects/[id]/feature-split/route.ts` (GET+PUT), `propose/route.ts`, `confirm/route.ts`
- **UI:** `apps/web/app/dashboard/projects/[id]/feature-split/page.tsx` + `feature-split-workspace.tsx`
- **Placeholder:** `services-feature-split` removed from `DEFERRED_ROADMAP_PLACEHOLDERS`

## Still blocked elsewhere

- **Credits slice** `orch-credit-system--ledger-concurrency-and-stripe-webhook` — PIS + plan approval (PR #39); see `status.json` `phases.2b` and `pis_blockers`.
- **`fa-owner-milestone-feedback--milestone-detection-and-prompt`** — see `status.json` `fa_owner_milestone_feedback.blocker`.

## Next action for autonomous agent

1. **Remediation** — Branch `orchestrator/tracking-fa-services-feature-split--prd-to-feature-split--impl-1778551730470` has post–PR-#75 fixes; verify whether `main` already contains them, otherwise open a PR to `main`. (`gh pr ready 75` does not apply: PR #75 is merged.)
2. **Next pipeline step** — `fa-user-stories--story-generation-from-feature-split--impl` (`in-progress` in `status.json`). Read `docs/state/orchestration.pipeline.json` + `status.json`.

## Key files (this slice)

- Plan: `docs/execution/plans/services-feature-split--prd-to-feature-split--v0.plan.md`
- Domain: `apps/web/src/domain/feature-split/`
- Persistence: `apps/web/src/infrastructure/persistence/feature-split-repository.ts`
- Use cases: `apps/web/src/application/feature-split/`
- Routes: `apps/web/app/api/projects/[id]/feature-split/`
- UI: `apps/web/app/dashboard/projects/[id]/feature-split/`
