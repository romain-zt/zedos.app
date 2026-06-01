# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Schema: `.cursor/rules/execution-loop.mdc` §3.

| ID | Type | Parent | Status | Priority | NEED_HUMAN | NEED_UPDATE | Blocked By | Next Action |
|---|---|---|---|:---:|:---:|:---:|---|---|
| FA-account-session | Feature Area | — | complete | P0 | false | false | — | Aucun (terminé dans `orchestration.steps`) |
| SS-account-session--sign-up-sign-in | Scope Slice | FA-account-session | complete | P0 | false | false | — | Aucun (terminé) |
| SS-account-session--session-persistence | Scope Slice | FA-account-session | complete | P0 | false | false | — | Aucun (terminé) |
| FA-dashboard-shell | Feature Area | — | complete | P0 | false | false | — | Aucun (terminé) |
| SS-dashboard-shell--signed-in-home | Scope Slice | FA-dashboard-shell | complete | P0 | false | false | — | Aucun (terminé) |
| SS-dashboard-shell--under-construction | Scope Slice | FA-dashboard-shell | complete | P0 | false | false | — | Aucun (terminé) |
| FA-project-workspace | Feature Area | — | complete | P1 | false | false | — | Aucun (terminé) |
| FA-prd-versioning | Feature Area | — | complete | P1 | false | false | — | Aucun (terminé) |
| FA-guided-clarification | Feature Area | — | complete | P2 | false | false | — | Aucun (terminé) |
| FA-question-history | Feature Area | — | complete | P2 | false | false | — | Aucun (terminé) |
| FA-read-only-sharing | Feature Area | — | complete | P3 | false | false | — | Aucun (terminé) |
| FA-owner-milestone-feedback | Feature Area | — | complete | P3 | false | false | — | Aucun (milestone + feedback capture terminés) |
| SS-owner-milestone-feedback--milestone-detection-and-prompt | Scope Slice | FA-owner-milestone-feedback | complete | P3 | false | false | — | Aucun (terminé) |
| SS-owner-milestone-feedback--feedback-capture-and-attribution | Scope Slice | FA-owner-milestone-feedback | complete | P3 | false | false | — | Aucun (terminé) |
| FA-credit-system | Feature Area | — | complete | P4 | false | false | — | Aucun (step `orch-credit-system--ledger-concurrency-and-stripe-webhook` terminé) |
| FA-payments | Feature Area | — | complete | P4 | false | false | — | Aucun (manual credit checkout terminé) |
| SS-payments--manual-credit-pack-checkout | Scope Slice | FA-payments | complete | P4 | false | false | — | Aucun (terminé) |
| FA-services-feature-split | Feature Area | — | complete | P1 | false | false | — | Aucun (terminé) |
| SS-services-feature-split--prd-to-feature-split | Scope Slice | FA-services-feature-split | complete | P1 | false | false | — | Aucun (terminé) |
| FA-user-stories | Feature Area | — | complete | P1 | false | false | — | Aucun (terminé) |
| SS-user-stories--story-generation-from-feature-split | Scope Slice | FA-user-stories | complete | P1 | false | false | — | Aucun (terminé) |
| US-user-stories--corpus-reliability-batch-quality | User Story | SS-user-stories--story-generation-from-feature-split | complete | P1 | false | false | — | Aucun (terminé, vérifié) |
| FA-test-first-workflows | Feature Area | — | complete | P2 | false | false | — | Aucun (terminé) |
| SS-test-first-workflows--task-splitting-with-prompts | Scope Slice | FA-test-first-workflows | complete | P2 | false | false | — | Aucun (terminé) |
| FA-delivery | Feature Area | — | complete | P2 | false | false | — | Aucun (cursor package export livré — 2026-06-01) |
| SS-delivery--cursor-package-export | Scope Slice | FA-delivery | complete | P2 | false | false | — | Aucun (terminé) |
| SS-payments--auto-reload-opt-in-and-outcomes | Scope Slice | FA-payments | complete | P4 | false | false | — | Aucun (implémenté 2026-06-01) |
| SS-payments--tax-and-vat-legibility | Scope Slice | FA-payments | complete | P4 | false | false | — | Aucun (implémenté 2026-06-01) |
