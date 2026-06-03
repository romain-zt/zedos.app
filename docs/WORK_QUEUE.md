# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Schema: `.cursor/rules/execution-loop.mdc` §3.

> **Statut `complete` :** équivalent à **`done`** (orchestration / impl terminée). Voir execution-loop §3 — terminal orchestration status.

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
| FA-read-only-sharing | Feature Area | — | complete | P3 | false | false | — | Aucun — 3 slices `complete` (SS-11) |
| SS-read-only-sharing--mint-read-only-link | Scope Slice | FA-read-only-sharing | complete | P3 | false | false | — | Aucun — slice `ready-for-user-stories`; plan/US `executed` (SS-11) |
| SS-read-only-sharing--anonymous-read-surface | Scope Slice | FA-read-only-sharing | complete | P3 | false | false | — | Aucun — slice `ready-for-user-stories`; plan/US `executed` (SS-11) |
| SS-read-only-sharing--revoke-link-and-noindex | Scope Slice | FA-read-only-sharing | complete | P3 | false | false | — | Aucun — slice `ready-for-user-stories`; plan/US `executed` (SS-11) |
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
| FA-fast-track-urgent | Feature Area | — | complete | P1 | false | false | — | Aucun — 4 slices livrées (declare + generation + disclaimer + grayed shell) |
| SS-fast-track-urgent--declare-express-mode | Scope Slice | FA-fast-track-urgent | complete | P1 | false | false | — | Aucun — slice file `ready-for-user-stories`; plan/US `executed` (SS-11) |
| SS-fast-track-urgent--express-deliverable-generation | Scope Slice | FA-fast-track-urgent | complete | P1 | false | false | — | Aucun — plan/US `executed` (2026-06-03) |
| SS-fast-track-urgent--express-share-disclaimer | Scope Slice | FA-fast-track-urgent | complete | P1 | false | false | — | Aucun — plan/US `executed` (2026-06-03) |
| SS-fast-track-urgent--grayed-post-prd-shell | Scope Slice | FA-fast-track-urgent | complete | P1 | false | false | — | Aucun — plan/US `executed` (2026-06-03) |
| FA-prd-import | Feature Area | — | complete | P1 | false | false | — | Aucun — slice capture-at-create livrée ; plan/US `executed` (2026-06-03) |
| SS-prd-import--capture-external-prd-at-create | Scope Slice | FA-prd-import | complete | P1 | false | false | — | Aucun — plan/US `executed` (2026-06-03) |
| FA-product-analytics | Feature Area | — | active | P3 | false | false | B-ANALYTICS-001 | Funnel A shipped (default-off); activer prod PostHog après clearance légale |
| SS-product-analytics--owner-product-journey-funnels | Scope Slice | FA-product-analytics | complete | P3 | false | false | B-ANALYTICS-001 | Aucun — plan/US `executed` (2026-06-03); crédits/replay slices restantes |
| SS-product-analytics--credit-blockage-and-monetization | Scope Slice | FA-product-analytics | complete | P3 | false | false | B-ANALYTICS-001 | Aucun — Funnel B shipped (default-off); plan `executed` (2026-06-03) |
| SS-product-analytics--friction-replay-and-error-signals | Scope Slice | FA-product-analytics | exploratory | P3 | false | false | B-ANALYTICS-002 | Phase 2 — après funnel+crédits **shipped** ; approuver plan draft ; `promote-slice` puis `/implement` ; replay prod après B-ANALYTICS-002 |
