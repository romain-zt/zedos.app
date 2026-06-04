---
date: 2026-06-04
type: doc-sync
---

# Résolution alignement doc — 12 incohérences (2026-06-04)

Trace des corrections appliquées après audit commercial / comité docs-only.

| # | Problème | Résolution |
|---|----------|------------|
| 1 | Express/import shipped vs hics partiel | `product-hics-diagnostic.md` resync **2026-06-04** ↔ PRD + WORK_QUEUE |
| 2 | Post-PRD complete vs coming v1 | `under-construction-inventory.md` : `DEFERRED_ROADMAP_PLACEHOLDERS` vide ; nav projet live ; pass1 = prérequis phase |
| 3 | Monétisation double | `pricing-page-copy-en-v1.md` § v0 vs Phase 1 ; `pricing-narrative-target.md` § hiérarchie |
| 4 | Collab / members | `PD-003` + inventaire ; **UI** : retrait `ProjectMembersPanel` settings |
| 5 | North star étoiles vs outcomes | `PRD.md` § Success Metrics resync `outcome-tracking-v1.md` |
| 6 | Gates vs backlog | `docs/prd/gates-status.md` + en-tête `WORK_QUEUE.md` |
| 7 | PRD-only vs wedge | `PRD.md` § Why This Version Exists |
| 8 | Pro hors Phase 1 | `pricing-page-copy-en-v1.md` — tableau publiable **Free + Builder** ; Pro = draft interne |
| 9 | Analytics shipped vs prod | `observability/README.md` — code default-off, prod = B-ANALYTICS-001 |
| 10 | Go-live pending | `HANDOFF.md` — statut ops explicite (ne pas falsifier `secrets_rotated`) |
| 11 | Product Truth OS vs urgent | `positioning-vocabulary.md` — hiérarchie acquisition |
| 12 | TODO coché vs validation vide | `TODO.md` § Validation humaine ; templates Gate A statut **OPEN** |

**Hiérarchie vérité :** `PRD.md` → `WORK_QUEUE.md` → `gates-status.md` → feature-areas / scope-slices → `product-hics-diagnostic.md` (diagnostic, resync après chaque `/prd update` majeur).
