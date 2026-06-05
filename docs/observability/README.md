# Observabilité — annexe technique

Le **périmètre produit** (Feature Area + scope slices) vit sous `docs/product/` :

| Document | Rôle |
|---|---|
| [Feature Area: Product analytics (PostHog)](../product/feature-areas/product-analytics.md) | Intent, in/out of scope, slices, blockers |
| [Slice: Owner product journey funnels](../product/scope-slices/product-analytics--owner-product-journey-funnels.md) | Funnel activation signup → PRD |
| [Slice: Credit blockage and monetization](../product/scope-slices/product-analytics--credit-blockage-and-monetization.md) | Blocages crédits → achat |
| [Slice: Friction replay and error signals](../product/scope-slices/product-analytics--friction-replay-and-error-signals.md) | Replay + erreurs (phase 2) |

Ce dossier (`docs/observability/`) est l’**annexe d’implémentation** (catalogue d’événements, funnels PostHog, env, runbook).

| Annexe | Contenu |
|---|---|
| [posthog.md](./posthog.md) | Contrat technique PostHog (événements, funnels, RGPD, plan P0–P5) |

## Statut implémentation (sync doc 2026-06-04)

| Slice | WORK_QUEUE | Code `apps/web` | Prod tracking |
|-------|------------|---------------|---------------|
| Owner product journey funnels | **complete** | Intégré **default-off** (env) | **Off** until **B-ANALYTICS-001** cleared |
| Credit blockage and monetization | **complete** | Intégré **default-off** | **Off** until **B-ANALYTICS-001** |
| Friction replay and error signals | **exploratory** | Non prod | Phase 2 ; **B-ANALYTICS-002** |

**Plan B obligatoire mois 1 si legal retard :** `docs/ops/posthog-legal-decision-plan-b.md` + `metrics-weekly-sheet-template.md` (ne remplace pas Gate A qualitatif).

**Queue :** `docs/WORK_QUEUE.md` → `FA-product-analytics` et slices associées.

**Legal :** `docs/BLOCKERS.md` → `B-ANALYTICS-001` (prod enable), `B-ANALYTICS-002` (replay masking).
