---
type: state-handoff
date: 2026-06-03
author: doc-sync
workspace: zedos.app
status: handoff-ready
current_phase: v0-core-shipped--express-import-analytics-backlog
current_blocker: null
---

# Cloud Agent State Handoff

## Etat canonique

| Source | Etat |
|--------|------|
| `docs/state/status.json` → `orchestration.steps` | Toutes les étapes historiques **complete** (socle v0 + post-PRD code) |
| `docs/prd/PRD.md` → Flow Inventory | **Shipped** = socle PRD + Stripe + post-PRD **code** ; **Planned v0** = express (livrable/disclaimer/grayed), import ; analytics prod-enable (B-ANALYTICS-001) |
| `docs/WORK_QUEUE.md` | Frontier active : **FA-fast-track-urgent**, **FA-prd-import**, **FA-product-analytics** |

## Go-live ops (bloquant prod réelle)

Checklist détaillée : [`docs/ops/production-go-live.md`](../ops/production-go-live.md)

1. Rotation des secrets — `secrets_rotated` reste **`false`** (**attendu** ; `secrets_rotated_policy` dans `status.json`) jusqu’à §1 de `production-go-live.md` complété.
2. `STRIPE_WEBHOOK_SECRET` en production.
3. Stripe Tax / `automatic_tax` pour FR/EU/US.

## Backlog produit documenté (pas encore Shipped)

- **Fast-track :** declare livré (US/plan executed) ; 3 slices — plans/US **`draft`** (liste : `doc-ok-checklist.md` § D3).
- **Import PRD :** plan/US **`draft`** (Q-028) — idem § D3.
- **Analytics :** funnel plan **`approved`** → PIS + `/implement` ; crédit + replay **`draft`** ; **B-ANALYTICS-001** avant enable prod — § D3–D4.

## Doc OK (checklist minimale)

**Verdict documentation : OK** (2026-06-03, reconcile **12/12**) — détail : [`docs/ops/doc-ok-checklist.md`](../ops/doc-ok-checklist.md).

Go-live opérateur et approbation des plans restent **pending** (§ D du même fichier).

## Notes de maintenance

- Carte `docs/README.md` — ordre de lecture.
- Après implémentation : mettre à jour Flow Inventory **Shipped** + MVP checklist + `EXECUTION_LOG.md`.
- Ne pas marquer `secrets_rotated: true` sans rotation réelle.
