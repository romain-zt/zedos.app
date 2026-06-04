---
date: 2026-06-04
status: active
supersedes: informal gate tracking in scattered templates
---

# Gates Phase 1 / Moat — statut exécution

> **Loi produit :** `docs/prd/PRD.md` § Payment model — Phase 1 execution gates.  
> **Queue :** les slices `ready-for-user-stories` dans `docs/WORK_QUEUE.md` sont **documentées**, pas **autorisées en prod** tant que la gate parente n’est pas **satisfied**.

## Matrice gates

| Gate | Critère (PRD) | Statut doc | Bloque |
|------|---------------|------------|--------|
| **GATE-PHASE1-A** | ≥5 entretiens (`founder-interviews-cursor-synthesis.md`) **et** ≥1 run express **&lt;45 min** (`express-30min-checklist-friction-log.md`) | **IN_PROGRESS** — runbook `docs/ops/gate-a-execution-runbook.md` | Toute ship Phase 1 prod ; `/implement` sur slices `GATE-PHASE1-A` |
| **GATE-PHASE1-B′** | ≥10 signaux fake door (`fake-door-subscription-spec.md`) | **OPEN** — page URL _à remplir_ | Builder + export gate **seulement** (après A) ; **jamais** collab |
| **GATE-PHASE1-B** | ≥20 Builders actifs **ou** ≥800 € MRR | **OPEN** | Collab, export MD, outcome O1 (ordre PRD #4–6) |
| **GATE-MOAT-C** | ≥100 payants **ou** waiver `/prd update` | **OPEN** | decision-graph, prd-drift-github, templates-marketplace, ai-red-team |
| **GATE-LINEAR-001** | ≥3 demandes concierge | **OPEN** | integrations-linear |
| **GATE-MRR-500** | 500 MRR + pricing Team | **OPEN** | team-data-room |

## Règle WORK_QUEUE

| Statut slice | Signification |
|--------------|---------------|
| `complete` (v0) | Livré selon orchestration — hors gates Phase 1 |
| `ready-for-user-stories` + `Blocked By: GATE-*` | **Spec prête** — **pas** go prod sans gate **satisfied** |
| `draft` (US/plan) | Pas `/implement` sans plan approuvé **et** gate |

**17 slices `ready-for-user-stories`** (blueprint 2026-06-04) ≠ permission d’implémenter en parallèle : respecter **ship order** PRD après gates.

## Gate A — suivi branches

| Branche | Preuve | Statut |
|---------|--------|--------|
| **A1 Entretiens** | `docs/gtm/founder-interviews-log.md` (5×) → `founder-interviews-cursor-synthesis.md` | **0/5** |
| **A2 Express** | `docs/product/express-30min-checklist-friction-log.md` § Résultat | **0** session Pass |

**Runbook :** [`docs/ops/gate-a-execution-runbook.md`](../ops/gate-a-execution-runbook.md)

## Actions pour fermer Gate A

1. Exécuter runbook (express chronométré + 5 entretiens).
2. Mettre à jour les deux branches ci-dessus.
3. Remplacer **IN_PROGRESS** par **SATISFIED** + date + liens preuve.

## Sync

- Alignement incohérences doc : `docs/product/doc-alignment-resolution-2026-06-04.md`
- Plan B si PostHog retard : `docs/ops/posthog-legal-decision-plan-b.md` (**ne remplace pas** Gate A)
