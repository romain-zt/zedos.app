---
type: state-handoff
date: 2026-06-04
author: doc-sync
workspace: zedos.app
status: handoff-ready
current_phase: v0-shipped--blueprint-phase1-moat-backlog
current_blocker: GATE-PHASE1-A (in progress — voir docs/ops/gate-a-execution-runbook.md)
---

# Cloud Agent State Handoff

## Etat canonique

| Source | Etat |
|--------|------|
| `docs/state/status.json` → `orchestration.steps` | Socle v0 + post-PRD + express + import + guided-clarification slices **complete** |
| `docs/prd/PRD.md` → Flow Inventory | **Shipped** : standard + **express** (PD-002), **import**, share, crédits/Stripe, post-PRD **code** ; **Phase 1 wedge** documenté (Builder, collab PD-003, export MD, O1) — **gated** (A/B/B′/C) |
| `docs/WORK_QUEUE.md` | v0 **complete** ; frontier = **blueprint** (17 slices `ready-for-user-stories`, gates `GATE-PHASE1-*` / `GATE-MOAT-C`) ; analytics replay **exploratory** ; Linear / Team **exploratory** |

## Go-live ops (bloquant prod réelle)

Checklist détaillée : [`docs/ops/production-go-live.md`](../ops/production-go-live.md)

1. Rotation des secrets — `secrets_rotated` reste **`false`** jusqu’à §1 complété.
2. `STRIPE_WEBHOOK_SECRET` en production.
3. Stripe Tax / `automatic_tax` pour FR/EU/US.

## Backlog produit (code)

| Horizon | Contenu | Gate / statut |
|---------|---------|----------------|
| **Phase 1** | Bannière → Builder → export gate → O1 → export MD → collab | `GATE-PHASE1-A` puis **B** ou **B′** (voir `PRD.md`) |
| **Moat** | Decision graph, drift GitHub, templates, red-team | `GATE-MOAT-C` (≥100 payants) |
| **Analytics** | Funnel A/B **complete** (code default-off) ; replay **exploratory** | Prod = **B-ANALYTICS-001** ; mois 1 = **Plan B** sheet (`posthog-legal-decision-plan-b.md`) |
| **Hold** | Linear, Team data room | `GATE-LINEAR-001`, `GATE-MRR-500` |

Plans blueprint : **19** paires US/plan **`draft`** — approuver puis `/implement` après gates.

## Doc OK

**Verdict documentation : OK** pour le noyau produit (PRD + `WORK_QUEUE` + FAs blueprint resync 2026-06-04).

**Alignement 12 incohérences :** `docs/product/doc-alignment-resolution-2026-06-04.md`.

Go-live opérateur (**secrets_rotated** reste `false` jusqu’à rotation réelle) et **Gate A** (entretiens + express chronométré) restent **pending humain**.

## Notes de maintenance

- Carte `docs/README.md` — ordre de lecture et règle de sync.
- Hiérarchie conflit : `PRD.md` → `WORK_QUEUE.md` → scope-slices → feature-areas → `TODO.md`.
- Ne pas marquer `secrets_rotated: true` sans rotation réelle.
- Snapshot alignement express : [`prd/flow-inventory-work-queue-alignment-2026-06-04.md`](../prd/flow-inventory-work-queue-alignment-2026-06-04.md) (**done** — PRD sync 2026-06-04).
