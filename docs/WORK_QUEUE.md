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
| FA-services-feature-split | Feature Area | — | candidate | P1 | false | false | | `/prd update` (activate FG-POST-PRD-V1) then `/feature-area validate services-feature-split` |
| FA-user-stories | Feature Area | — | candidate | P1 | false | false | | `/prd update` (activate FG-POST-PRD-V1) then `/feature-area validate user-stories` |
| FA-test-first-workflows | Feature Area | — | candidate | P2 | false | false | | `/prd update` (activate FG-POST-PRD-V1) then `/feature-area validate test-first-workflows` |
| FA-delivery | Feature Area | — | candidate | P2 | true | false | export-format-TBD | Resolve export format blocker, then `/feature-area validate delivery` |
