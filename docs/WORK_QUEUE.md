# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Last rebuilt: **2026-05-09** (post–`promote-slice` governance scan). Schema: `.cursor/rules/execution-loop.mdc` §3.

| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |
|---|---|---|---|:---:|:---:|:---:|---|---|
| FA-account-session | Feature Area | | ready | P0 | false | false | | Both account-session Scope Slices `ready-for-user-stories`; next band work: `/feature-area validate dashboard-shell` |
| SS-account-session--signup-to-signed-in-dashboard | Scope Slice | FA-account-session | ready | P0 | false | false | | User stories when story phase opened |
| SS-account-session--returning-owner-sign-in | Scope Slice | FA-account-session | ready | P0 | false | false | | User stories when story phase opened |
| FA-dashboard-shell | Feature Area | | exploratory | P0 | false | false | | `/feature-area validate dashboard-shell` |
| FA-project-workspace | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate project-workspace` |
| FA-prd-versioning | Feature Area | | exploratory | P1 | false | false | | `/feature-area validate prd-versioning` |
| FA-guided-clarification | Feature Area | | exploratory | P2 | true | false | B-001;B-002 | Resolve B-001/B-002 (`BLOCKERS.md` + Feature Area); then `/feature-area validate guided-clarification` |
| FA-question-history | Feature Area | | exploratory | P2 | false | false | | `/feature-area validate question-history` |
| FA-read-only-sharing | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate read-only-sharing` |
| FA-owner-milestone-feedback | Feature Area | | exploratory | P3 | false | false | | `/feature-area validate owner-milestone-feedback` |
| FA-credit-system | Feature Area | | exploratory | P4 | true | false | B-003;B-004 | Resolve B-003/B-004 (`BLOCKERS.md` + Feature Area); then `/feature-area validate credit-system` |
| FA-payments | Feature Area | | exploratory | P4 | false | false | | `/feature-area validate payments` |
