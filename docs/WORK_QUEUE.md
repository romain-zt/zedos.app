# WORK_QUEUE — Zedos execution backlog

Rebuild with **`/execute-prd scan`**. Schema: `.cursor/rules/execution-loop.mdc` §3.

> **Statut `complete` :** équivalent à **`done`** (orchestration / impl terminée). Voir execution-loop §3 — terminal orchestration status.

## Gates — lecture obligatoire avant `/implement`

| Gate | Statut | Détail |
|------|--------|--------|
| **GATE-PHASE1-A** | **OPEN** | `docs/prd/gates-status.md` — 5 entretiens + express &lt;45 min |
| **GATE-PHASE1-B′** | **OPEN** | ≥10 fake door — Builder+export **après A** |
| **GATE-PHASE1-B** | **OPEN** | ≥20 Builders ou ≥800 € MRR — collab, O1, export MD |
| **GATE-MOAT-C** | **OPEN** | ≥100 payants — moat slices |

**`ready-for-user-stories` ≠ autorisation prod.** Les 17 slices blueprint sont **spec-ready**, **gate-blocked** jusqu’à statut **SATISFIED** dans `gates-status.md`.

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
| SS-guided-clarification--contextual-tab-refinement | Scope Slice | FA-guided-clarification | complete | P2 | false | false | — | Aucun (terminé) |
| SS-guided-clarification--question-preview-and-progress-score | Scope Slice | FA-guided-clarification | complete | P2 | false | false | SS-guided-clarification--contextual-tab-refinement | Aucun (terminé) |
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
| SS-product-analytics--friction-replay-and-error-signals | Scope Slice | FA-product-analytics | complete | P3 | false | false | B-ANALYTICS-002 | Aucun — plan `executed` (2026-06-05) ; replay prod **off** jusqu'à sign-off B-ANALYTICS-002 |
| FA-payments | Feature Area | — | complete | P2 | false | false | — | Builder subscription scaffold livré (2026-06-05) |
| SS-payments--builder-subscription-checkout | Scope Slice | FA-payments | complete | P2 | false | false | — | Aucun — plan `executed` ; Stripe checkout + webhook subscription |
| US-payments--builder-subscription-checkout--v1 | User Story | SS-payments--builder-subscription-checkout | complete | P2 | false | false | — | Aucun — plan `executed` |
| FA-project-workspace | Feature Area | — | complete | P1 | false | false | — | Next-action banner livré (2026-06-05) |
| SS-project-workspace--next-action-banner | Scope Slice | FA-project-workspace | complete | P1 | false | false | — | Aucun — plan `executed` |
| US-project-workspace--next-action-banner--v1 | User Story | SS-project-workspace--next-action-banner | complete | P1 | false | false | — | Aucun — plan `executed` |
| FA-delivery | Feature Area | — | complete | P2 | false | false | — | Export gate livré (2026-06-05) |
| SS-delivery--export-cursor-conversion-gate | Scope Slice | FA-delivery | complete | P2 | false | false | — | Aucun — plan `executed` ; soft/hard gate avant export |
| US-delivery--export-cursor-conversion-gate--v1 | User Story | SS-delivery--export-cursor-conversion-gate | complete | P2 | false | false | — | Aucun — plan `executed` |
| FA-owner-milestone-feedback | Feature Area | — | complete | P3 | false | false | — | Outcome O1 `prd_shared` livré (2026-06-05) |
| SS-owner-milestone-feedback--outcome-prompt-on-share | Scope Slice | FA-owner-milestone-feedback | complete | P3 | false | false | — | Aucun — plan `executed` |
| US-owner-milestone-feedback--outcome-prompt-on-share--v1 | User Story | SS-owner-milestone-feedback--outcome-prompt-on-share | complete | P3 | false | false | — | Aucun — plan `executed` |
| FA-prd-versioning | Feature Area | — | complete | P1 | false | false | — | Export MD client-side (déjà présent) ; plan `executed` |
| SS-prd-versioning--export-markdown-v0-1 | Scope Slice | FA-prd-versioning | complete | P1 | false | false | — | Aucun — plan `executed` |
| US-prd-versioning--export-markdown-v0-1--v1 | User Story | SS-prd-versioning--export-markdown-v0-1 | complete | P1 | false | false | — | Aucun — plan `executed` |
| FA-decision-graph | Feature Area | — | complete | P1 | false | false | — | 4 slices livrées (2026-06-05) |
| SS-decision-graph--persist-from-question-history | Scope Slice | FA-decision-graph | complete | P1 | false | false | — | Aucun — plan `executed` ; migration 0014 |
| US-decision-graph--persist-from-question-history--v1 | User Story | SS-decision-graph--persist-from-question-history | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-decision-graph--owner-decisions-list-panel | Scope Slice | FA-decision-graph | complete | P1 | false | false | — | Aucun — onglet Decisions + backfill |
| US-decision-graph--owner-decisions-list-panel--v1 | User Story | SS-decision-graph--owner-decisions-list-panel | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-decision-graph--section-badges-and-links | Scope Slice | FA-decision-graph | complete | P1 | false | false | — | Aucun — badges PRD → Decisions |
| US-decision-graph--section-badges-and-links--v1 | User Story | SS-decision-graph--section-badges-and-links | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-decision-graph--export-decisions-json | Scope Slice | FA-decision-graph | complete | P1 | false | false | — | Aucun — `decisions.json` dans zip Cursor |
| US-decision-graph--export-decisions-json--v1 | User Story | SS-decision-graph--export-decisions-json | complete | P1 | false | false | — | Aucun — plan `executed` |
| FA-prd-drift-github | Feature Area | — | complete | P1 | false | false | — | 3 slices scaffold v1 (2026-06-05) |
| SS-prd-drift-github--connect-repo | Scope Slice | FA-prd-drift-github | complete | P1 | false | false | — | Aucun — plan `executed` |
| US-prd-drift-github--connect-repo--v1 | User Story | SS-prd-drift-github--connect-repo | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-prd-drift-github--evaluate-and-weekly-digest | Scope Slice | FA-prd-drift-github | complete | P1 | false | false | — | Aucun — inbox + digest stub default-off |
| US-prd-drift-github--evaluate-and-weekly-digest--v1 | User Story | SS-prd-drift-github--evaluate-and-weekly-digest | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-prd-drift-github--webhook-realtime | Scope Slice | FA-prd-drift-github | complete | P1 | false | false | — | Aucun — webhook ingest stub |
| US-prd-drift-github--webhook-realtime--v1 | User Story | SS-prd-drift-github--webhook-realtime | complete | P1 | false | false | — | Aucun — plan `executed` |
| FA-collab-async | Feature Area | — | complete | P1 | false | false | — | Invite commenter + threads (2026-06-05) |
| SS-collab-async--invite-commenter | Scope Slice | FA-collab-async | complete | P1 | false | false | — | Aucun — plan `executed` |
| US-collab-async--invite-commenter--v1 | User Story | SS-collab-async--invite-commenter | complete | P1 | false | false | — | Aucun — plan `executed` |
| SS-collab-async--section-comment-threads | Scope Slice | FA-collab-async | complete | P1 | false | false | — | Aucun — plan `executed` ; migration 0015 |
| US-collab-async--section-comment-threads--v1 | User Story | SS-collab-async--section-comment-threads | complete | P1 | false | false | — | Aucun — plan `executed` |
| FA-templates-marketplace | Feature Area | — | complete | P3 | false | false | — | Catalog seed + use-on-create (2026-06-05) |
| SS-templates-marketplace--official-seed-catalog | Scope Slice | FA-templates-marketplace | complete | P3 | false | false | — | Aucun — plan `executed` |
| US-templates-marketplace--official-seed-catalog--v1 | User Story | SS-templates-marketplace--official-seed-catalog | complete | P3 | false | false | — | Aucun — plan `executed` |
| SS-templates-marketplace--use-template-on-create | Scope Slice | FA-templates-marketplace | complete | P3 | false | false | — | Aucun — plan `executed` |
| US-templates-marketplace--use-template-on-create--v1 | User Story | SS-templates-marketplace--use-template-on-create | complete | P3 | false | false | — | Aucun — plan `executed` |
| FA-ai-red-team | Feature Area | — | complete | P3 | false | false | — | Adversarial review report (2026-06-05) |
| SS-ai-red-team--adversarial-review-report | Scope Slice | FA-ai-red-team | complete | P3 | false | false | — | Aucun — plan `executed` |
| US-ai-red-team--adversarial-review-report--v1 | User Story | SS-ai-red-team--adversarial-review-report | complete | P3 | false | false | — | Aucun — plan `executed` |
| FA-integrations-linear | Feature Area | — | complete | P3 | false | false | GATE-LINEAR-001 | Scaffold v1 livré ; API Linear **stub 501** jusqu'à demande ≥3 |
| SS-integrations-linear--push-stories-and-status-sync | Scope Slice | FA-integrations-linear | complete | P3 | false | false | GATE-LINEAR-001 | Aucun — plan `executed` ; gate override user |
| US-integrations-linear--push-stories-and-status-sync--v1 | User Story | SS-integrations-linear--push-stories-and-status-sync | complete | P3 | false | false | GATE-LINEAR-001 | Aucun — plan `executed` |
| FA-team-data-room | Feature Area | — | complete | P4 | false | false | B-TEAM-PRICE-001 | Bundle export zip livré ; pricing Team encore opérationnel |
| SS-team-data-room--bundle-export-zip | Scope Slice | FA-team-data-room | complete | P4 | false | false | B-TEAM-PRICE-001 | Aucun — plan `executed` |
| US-team-data-room--bundle-export-zip--v1 | User Story | SS-team-data-room--bundle-export-zip | complete | P4 | false | false | B-TEAM-PRICE-001 | Aucun — plan `executed` |

---

## Blueprint backlog (2026-06-04)

Ajout aligné sur `docs/TODO.md` (semaine / mois / trimestre doc livrés) :

- **7** Feature Areas : `decision-graph`, `prd-drift-github`, `collab-async`, `templates-marketplace`, `ai-red-team`, `integrations-linear` (proposed), `team-data-room` (proposed).
- **19** Scope Slices blueprint — **tous implémentés en code** (2026-06-05, plans `executed`).
- **0** plans v1 restants en `draft` dans le backlog Phase 1 / moat.
- Gates PRD (`GATE-PHASE1-*`, `GATE-MOAT-C`) restent **OPEN** pour activation prod ; code livré **default-off** ou scaffold où requis.

**Gates PRD (2026-06-04) :** `GATE-PHASE1-A` (5 entretiens + express &lt;45m) · `GATE-PHASE1-B` (≥20 Builders ou ≥800€ MRR) · `GATE-PHASE1-B′` (Builder+export seulement si ≥10 fake-door, **sans collab**) · `GATE-MOAT-C` (moat si ≥100 payants).

**Ordre Phase 1 après gates :** bannière → Builder → export gate → O1 → export MD → collab. **Moat** après Gate C uniquement.

**Doc legacy :** `docs/product/scope-slices/collab-async-v1--section-comments.md` — boundary trimestre ; slices canoniques `collab-async--*`.
