# Documentation Zedos

Carte des dossiers et ordre de lecture recommandé.

## Source de vérité produit

| Chemin | Rôle |
|--------|------|
| [`prd/state.md`](./prd/state.md) | Version PRD, direction, dernier changement majeur |
| [`prd/PRD.md`](./prd/PRD.md) | Narratif produit v0 / v1, Flow Inventory (**Shipped** vs **Planned v0**) |
| [`prd/gates-status.md`](./prd/gates-status.md) | Gates Phase 1 / moat — **OPEN vs SATISFIED** (bloque `/implement`) |
| [`prd/questions/open-questions.md`](./prd/questions/open-questions.md) | File active des questions ouvertes |
| [`product-decisions/`](./product-decisions/) | Décisions durables (PD-001, PD-002, …) |

## Blueprint & GTM (exécution fondateur)

| Chemin | Rôle |
|--------|------|
| [`TODO.md`](./TODO.md) | Backlog blueprint — horizons semaine / mois / trimestre |
| [`gtm/`](./gtm/) | Positionnement, landing, entretiens, fake door, viral share |
| [`ops/go-live-secrets-checklist-operator.md`](./ops/go-live-secrets-checklist-operator.md) | Rotation secrets & Stripe prod (humain) |
| [`ops/gate-a-execution-runbook.md`](./ops/gate-a-execution-runbook.md) | Gate A — express ≤45 min + 5 entretiens (opérateur) |
| [`ops/posthog-legal-decision-plan-b.md`](./ops/posthog-legal-decision-plan-b.md) | PostHog prod vs métriques manuelles |
| [`ops/metrics-weekly-sheet-template.md`](./ops/metrics-weekly-sheet-template.md) | Plan B — sheet hebdo |

## Décomposition produit

| Chemin | Rôle |
|--------|------|
| [`product/feature-areas/`](./product/feature-areas/) | Feature Areas (intent, scope, slices candidates) |
| [`product/scope-slices/`](./product/scope-slices/) | Scope Slices (frontière comportementale) |
| [`product/product-hics-diagnostic.md`](./product/product-hics-diagnostic.md) | Diagnostic priorités (H1–H7) — **pas** la queue d’exécution |
| [`product/decision-graph-v1-spec.md`](./product/decision-graph-v1-spec.md) | Moat — Decision Graph (T1) |
| [`product/prd-drift-github-v1-spec.md`](./product/prd-drift-github-v1-spec.md) | Moat — Drift GitHub (T1) |
| [`product/templates-marketplace-v1-cadrage.md`](./product/templates-marketplace-v1-cadrage.md) | Marketplace templates (T1) |

## Exécution (plans, stories, queue)

| Chemin | Rôle |
|--------|------|
| [`WORK_QUEUE.md`](./WORK_QUEUE.md) | Backlog machine — v0 **complete** + blueprint 2026-06-04 (17 SS ready, gates Phase 1 / moat) ; rescan via `/execute-prd scan` si drift |
| [`BLOCKERS.md`](./BLOCKERS.md) | Blockers par scope |
| [`EXECUTION_LOG.md`](./EXECUTION_LOG.md) | Journal append-only |
| [`execution/user-stories/`](./execution/user-stories/) | User stories |
| [`execution/plans/`](./execution/plans/) | Implementation plans |

## État agent / ops

| Chemin | Rôle |
|--------|------|
| [`state/status.json`](./state/status.json) | État machine (orchestration, secrets, phase) |
| [`state/HANDOFF.md`](./state/HANDOFF.md) | Handoff agent — **aligné 2026-06-04** avec PRD + `WORK_QUEUE` |
| [`ops/production-go-live.md`](./ops/production-go-live.md) | Checklist go-live (secrets, Stripe, tax) |
| [`ops/doc-ok-checklist.md`](./ops/doc-ok-checklist.md) | **Checklist minimale doc OK** (verdict documentation) |

## Observabilité (annexe technique)

| Chemin | Rôle |
|--------|------|
| [`observability/README.md`](./observability/README.md) | Lien FA product-analytics ↔ annexe |
| [`observability/posthog.md`](./observability/posthog.md) | Contrat événements / funnels PostHog |

## Lecture rapide selon la tâche

1. **« Qu’est-ce que le produit promet ? »** → `prd/PRD.md` + Flow Inventory.
2. **« Qu’est-ce qui est en prod vs prévu v0 ? »** → Flow Inventory (**Shipped** / **Planned v0**), pas la MVP checklist seule.
3. **« Quoi implémenter ensuite ? »** → `WORK_QUEUE.md` + slice `ready-for-user-stories`.
4. **« La doc est-elle complète ? »** → `ops/doc-ok-checklist.md` (verdict **doc OK**).
5. **« Puis-je déployer ? »** → `ops/production-go-live.md` + `state/status.json` (`secrets_rotated`, Stripe).

## Synchronisation obligatoire

**Hiérarchie :** `prd/PRD.md` → `WORK_QUEUE.md` → `product/scope-slices/` → `product/feature-areas/` → `TODO.md` (GTM).

Après tout changement de statut slice/FA ou go-live :

- Mettre à jour `WORK_QUEUE.md` (ou `/execute-prd scan`).
- Resync table **Candidate Scope Slices** de la FA parente.
- Aligner `prd/PRD.md` Flow Inventory si le comportement est **Shipped**.
- Mettre à jour `state/HANDOFF.md` + `state/status.json` (`current_phase`, `next_action`) si la frontier change.
- Cocher la **MVP Completeness Checklist** en miroir du Flow Inventory.
- Append `EXECUTION_LOG.md` pour les décisions de queue majeures.
