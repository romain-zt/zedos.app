# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Schema: `.cursor/rules/execution-loop.mdc` §3.

| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |
|---|---|---|---|:---:|:---:|:---:|---|---|
| FA-account-session | Feature Area | | ready | P0 | false | false | | `/feature-area check` on Scope Slices; `/feature-area refine-slice` per exploratory slice |
| SS-account-session--signup-to-signed-in-dashboard | Scope Slice | FA-account-session | exploratory | P0 | false | false | | `/feature-area refine-slice docs/product/scope-slices/account-session--signup-to-signed-in-dashboard.md` |
| SS-account-session--returning-owner-sign-in | Scope Slice | FA-account-session | exploratory | P0 | false | false | | `/feature-area refine-slice docs/product/scope-slices/account-session--returning-owner-sign-in.md` |
| FA-dashboard-shell | Feature Area | | exploratory | P0 | false | false | | `/feature-area validate dashboard-shell` |
| FA-project-workspace | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate project-workspace` |
| FA-prd-versioning | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate prd-versioning` |
| FA-guided-clarification | Feature Area | | exploratory | P2 | true | false | B-001;B-002 | Resolve B-001/B-002 (`BLOCKERS.md` + Feature Area); then `/feature-area validate guided-clarification` |
| FA-question-history | Feature Area | | exploratory | P2 | false | false | | `/feature-area validate question-history` |
| FA-read-only-sharing | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate read-only-sharing` |
| FA-owner-milestone-feedback | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate owner-milestone-feedback` |
| FA-credit-system | Feature Area | | exploratory | P4 | true | false | B-003;B-004 | Resolve B-003/B-004 (`BLOCKERS.md` + Feature Area); then `/feature-area validate credit-system` |
| FA-payments | Feature Area | | exploratory | P4 | false | false | | `/feature-area validate payments` |
