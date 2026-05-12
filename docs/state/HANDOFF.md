---
type: state-handoff
date: 2026-05-12
author: cloud-agent (orchestrator pipeline)
workspace: /workspace
status: handoff-ready
current_phase: fa-owner-milestone-feedback--milestone-detection-and-prompt--contracts-complete
current_blocker: null
tracking_pr: 93
tracking_branch: orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616475286
remediation_note: null
---

# Cloud Agent State Handoff

## Orchestration (canonical)

- **Pipeline step** `fa-owner-milestone-feedback--milestone-detection-and-prompt`: **in progress** on tracking PR **#93** (`orchestrator/tracking-fa-owner-milestone-feedback--milestone-detection-and-prompt-1778616475286` → `main`). Governance artifacts + contracts layer landed this run; **next layer = `ui`** (provider + milestone emitters).
- **Prior:** `fa-services-feature-split--prd-to-feature-split--impl` complete (PR **#75**). Optional remediation branch may still carry post-merge commits — see archive rows in `status.json` if needed.
- **Prior:** Question-coverage readiness score + question preview chips (**#70**) — complete per earlier handoff.

## Owner milestone feedback — slice layers

| Layer | Status |
|-------|--------|
| `db-migration` | **N/A** — slice stores no prompt state server-side |
| `contracts-domain` | **complete** — `OwnerMilestoneDetectedPayloadSchema` (`packages/contracts/src/feedback/milestone-prompt.ts`) + tests |
| `persistence-use-cases` | **N/A** — no new server use cases for prompt-only surface |
| `api-routes` | **deferred** — optional; milestone wiring can use client context / layout props |
| `ui` | **next** — `OwnerMilestonePromptProvider`, owner gate, session dedupe (`sessionStorage`), emitters after PRD/share/view flows |

### Governance artifacts

- Scope slice: `docs/product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md`
- User story: `docs/execution/user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md`
- Implementation plan: `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`

## User stories slice (prior work — reference)

- **`db-migration` → `ui`** stack for story generation — complete per PR **#87** tracking branch history.

## Still blocked elsewhere

- **Credits slice** `orch-credit-system--ledger-concurrency-and-stripe-webhook` — see `status.json` `phases.2b` / PR **#39**.

## Next action for autonomous agent

1. On tracking branch **#93**, implement **`ui` layer**: mount prompt provider under `apps/web/app/dashboard/projects/[id]/layout.tsx` (owner-only), wire milestone emits for `prd_created`, `prd_updated`, `prd_shared`, `prd_viewed` per approved plan.
2. Finalization layer: rerun `pnpm typecheck` + `pnpm build`, mark `orchestration.steps["fa-owner-milestone-feedback--milestone-detection-and-prompt"]` = `"complete"`, then `gh pr ready 93 --repo romain-zt/zedos.app`.

## Key files (milestone detection slice)

- Contracts: `packages/contracts/src/feedback/milestone-prompt.ts`
- Plan: `docs/execution/plans/owner-milestone-feedback--milestone-detection-and-prompt--v0.plan.md`
