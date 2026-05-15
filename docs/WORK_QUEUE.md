# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Schema: `.cursor/rules/execution-loop.mdc` §3.

| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |
|---|---|---|---|:---:|:---:|:---:|---|---|
| FA-account-session | Feature Area | | ready | P0 | false | false | | Implementation in-progress via orchestrator |
| SS-account-session--sign-up-sign-in | Scope Slice | FA-account-session | done | P0 | false | false | | Implemented as fa-account-session slice1 |
| SS-account-session--session-persistence | Scope Slice | FA-account-session | ready | P0 | false | false | | `/implement` via orchestrator phase `fa-account-session-slice2` |
| FA-dashboard-shell | Feature Area | | ready | P0 | false | false | | Validated 2026-05-11; scope slices scaffolded |
| SS-dashboard-shell--signed-in-home | Scope Slice | FA-dashboard-shell | ready | P0 | false | false | | `/implement` via orchestrator phase `fa-dashboard-shell-slice1` (depends on fa-account-session) |
| SS-dashboard-shell--under-construction | Scope Slice | FA-dashboard-shell | ready | P0 | false | false | | `/implement` via orchestrator phase `fa-dashboard-shell-slice2` (depends on slice1) |
| FA-project-workspace | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate project-workspace` |
| FA-prd-versioning | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate prd-versioning` |
| FA-guided-clarification | Feature Area | | exploratory | P2 | true | false | B-001;B-002 | Resolve B-001/B-002 (`BLOCKERS.md` + Feature Area); then `/feature-area validate guided-clarification` |
| FA-question-history | Feature Area | | exploratory | P2 | false | false | | `/feature-area validate question-history` |
| FA-read-only-sharing | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate read-only-sharing` |
| FA-owner-milestone-feedback | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate owner-milestone-feedback` |
| FA-credit-system | Feature Area | | exploratory | P4 | true | false | B-003;B-004 | Resolve B-003/B-004 (`BLOCKERS.md` + Feature Area); then `/feature-area validate credit-system` |
| FA-payments | Feature Area | | exploratory | P4 | false | false | | `/feature-area validate payments` |
| FA-services-feature-split | Feature Area | — | ready | P1 | false | false | | `/implement` via orchestrator phase `fa-services-feature-split--prd-to-feature-split` (awaits `fa-prd-versioning--browse-and-switch-prd-versions`) |
| SS-services-feature-split--prd-to-feature-split | Scope Slice | FA-services-feature-split | ready | P1 | false | false | | `/implement` via orchestrator — plan present; awaits prd-versioning prerequisite |
| FA-user-stories | Feature Area | — | ready | P1 | false | false | | `/implement` via orchestrator phase `fa-user-stories--story-generation-from-feature-split` (awaits services-feature-split) |
| SS-user-stories--story-generation-from-feature-split | Scope Slice | FA-user-stories | ready | P1 | false | false | | `/implement` via orchestrator — plan present; awaits services-feature-split prerequisite |
| US-user-stories--corpus-reliability-batch-quality | User Story | SS-user-stories--story-generation-from-feature-split | ready | P1 | false | false | | `/implement docs/execution/plans/user-stories--story-generation-from-feature-split--corpus-reliability-batch-quality.plan.md` (corpus Date bind fix, bulk generate UX, AI/template draft quality; slice refine for multi-select per Plan Appendix A) |
| FA-test-first-workflows | Feature Area | — | ready | P2 | false | false | | `/implement` via orchestrator phase `fa-test-first-workflows--task-splitting-with-prompts` (awaits user-stories) |
| SS-test-first-workflows--task-splitting-with-prompts | Scope Slice | FA-test-first-workflows | ready | P2 | false | false | | `/implement` via orchestrator — plan present; awaits user-stories prerequisite |
| FA-delivery | Feature Area | — | ready | P2 | false | false | | `/feature-area scaffold-slices delivery` then `/implement` via orchestrator |
