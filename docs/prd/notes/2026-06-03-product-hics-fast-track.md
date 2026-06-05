# Discovery note — Hics produit & fast-track

**Date:** 2026-06-03  
**Type:** product diagnostic (not PRD persistence)  
**Author:** founder + PM diagnostic session

## Summary

Zedos v0 sert bien la **génération PRD** mais pas les fondateurs **contraints par le temps**. Le hic #1 (**fast-track / urgent**) est **totalement absent** du produit : un seul tunnel clarify → génération → post-PRD gated.

Autres hics : PRD externe (H2), orientation projet (H3), évolution besoins (H4), multi-projets (H5), copy post-PRD (H6), dual Cursor/app (H7).

## Fast-track — founder decisions (2026-06-03)

1. **Déclencheur** : tous les cas (création **et** bascule en cours de projet).
2. **Artefact** : **livrable minimal** (pas PRD complet vide).
3. **Clarify** : **minimum IA** (plus petit ensemble de questions jugé nécessaire).
4. **Crédits** : **même tarif** que standard.
5. **Transparence** : **oui** — label *version express — à approfondir* sur partage (et équivalent owner).
6. **Post-PRD** : **grisé** (visible, désactivé, message produit).

Recorded formally as **PD-002** : `docs/product-decisions/PD-002.md`.

## Artifacts

| Doc | Role |
|-----|------|
| `docs/product/product-hics-diagnostic.md` | Full hics + backlog + flows |
| `docs/product/feature-areas/fast-track-urgent.md` | FA proposed |
| `docs/product-decisions/PD-002.md` | Durable decision |
| `todo.md` (repo root) | Short index |

## PRD impact

**Persisted** in `docs/prd/PRD.md` via `/prd update` 2026-06-03: journey 10, flow inventory, business objects, configuration matrix, MVP checklist, FG-PRD-V0 Fast-track sub-component, risks.

## Q-025 answer (2026-06-03)

**Express minimal livrable** uses the **same section set** as the **standard** generated PRD (no reduced heading list). **Express** = shorter / leaner **content per section** + **minimum IA** clarify + share disclaimer — not fewer tabs.

**Standard sections (8, in-app generator today):**

| id | title |
|----|-------|
| `vision` | Product Vision & Problem Statement |
| `target_users` | Target Users & Personas |
| `core_features` | Core Features (MVP Scope) |
| `user_journeys` | User Journeys |
| `technical` | Technical Constraints & Preferences |
| `success_metrics` | Success Metrics |
| `out_of_scope` | Out of Scope / Future Considerations |
| `risks` | Open Questions & Risks |

Plus envelope: `title`, `version_summary`.

**Optional sections proposed for founder validation (not in standard prompt yet):**

| Proposed id | title | Why for express / urgent |
|-------------|-------|---------------------------|
| `executive_summary` | Executive Summary (5–10 lines) | Lecteur lien partagé / pitch — above the fold |
| `business_model` | Business Model & Monetization | Investisseur, partenaire, DD |
| `differentiation` | Differentiation & Alternatives | Pitch « pourquoi nous » |
| `timeline` | Timeline & Near-Term Milestones | Contexte deadline |

**Q-026 answer (2026-06-03):** founder validates **all four** optional sections for express livrable.

**Express section list (final, 12 + envelope):**

| Order | id | title |
|-------|-----|-------|
| — | *(envelope)* | `title`, `version_summary` |
| 1 | `executive_summary` | Executive Summary (5–10 lines) |
| 2 | `vision` | Product Vision & Problem Statement |
| 3 | `target_users` | Target Users & Personas |
| 4 | `core_features` | Core Features (MVP Scope) |
| 5 | `user_journeys` | User Journeys |
| 6 | `technical` | Technical Constraints & Preferences |
| 7 | `success_metrics` | Success Metrics |
| 8 | `business_model` | Business Model & Monetization |
| 9 | `differentiation` | Differentiation & Alternatives |
| 10 | `timeline` | Timeline & Near-Term Milestones |
| 11 | `out_of_scope` | Out of Scope / Future Considerations |
| 12 | `risks` | Open Questions & Risks |

Express generation: **lean content** per section (PD-002); **minimum IA** clarify; standard 8 + 4 express-only additions.

## Q-027 answer (2026-06-03)

> **SUPERSEDED 2026-06-04** — express + import **Shipped** ; voir `docs/prd/PRD.md` Flow Inventory et `docs/prd/questions/open-questions.md` Q-027.

Flow Inventory — parcours express : **Planned v0** (pas encore en prod). Colonne / libellé à refléter au prochain `/prd update` (ne pas marquer `Yes` = shipped pour express).

## Q-028 answer (2026-06-03)

**Import PRD externe** (coller / fichier) : **v0** — peut se combiner avec express (intentions distinctes). À persister : Flow Inventory + journey ; FA import à définir.

## Q-029 answer (2026-06-03)

Terminologie : remplacer **« minimal livrable »** par **« livrable express »** partout dans le PRD (12 sections, **contenu lean** — pas moins de rubriques).

## Open product work

- Align express `generate-prd-stream` prompt to **12 sections** (engineering; PRD persisted 2026-06-03).
- Schema field name: `journeyMode` vs `urgency` (engineering).
- Import PRD (H2) remains separate FA — combinable with express.
