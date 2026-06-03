# Observabilité — annexe technique

Le **périmètre produit** (Feature Area + scope slices) vit sous `docs/product/` :

| Document | Rôle |
|---|---|
| [Feature Area: Product analytics (PostHog)](../product/feature-areas/product-analytics.md) | Intent, in/out of scope, slices, blockers |
| [Slice: Owner product journey funnels](../product/scope-slices/product-analytics--owner-product-journey-funnels.md) | Funnel activation signup → PRD |
| [Slice: Credit blockage and monetization](../product/scope-slices/product-analytics--credit-blockage-and-monetization.md) | Blocages crédits → achat |
| [Slice: Friction replay and error signals](../product/scope-slices/product-analytics--friction-replay-and-error-signals.md) | Replay + erreurs (phase 2) |

Ce dossier (`docs/observability/`) est l’**annexe d’implémentation** (catalogue d’événements, funnels PostHog, env, runbook) — à utiliser **quand** une slice passera en `/plan` / `/implement`, pas avant.

| Annexe | Contenu |
|---|---|
| [posthog.md](./posthog.md) | Contrat technique PostHog (événements, funnels, RGPD, plan P0–P5) |

**État code :** PostHog non intégré dans `apps/web`.
