Owner : UX — Priorité : 🔴 — Semaine 1

> **Dépendances :** `positioning-vocabulary.md`. Alimente `under-construction-dashboard-pass1.md`.

# Inventaire — surfaces « under construction » / v1 flou

## Légende actions

| Action | Signification |
|--------|---------------|
| **Masquer** | Retirer de la nav ou désactiver sans modal « coming soon » |
| **Expliquer** | Garder visible avec copy valeur + CTA (ex. passer en standard) |
| **Dater** | Afficher « Disponible Q3 2026 » si date connue |
| **Ship label** | Renommer : feature **existe** — ne plus dire « not built » |

---

## Inventaire complet

| Écran / zone | Message actuel | État doc (WORK_QUEUE / code) | Action | Statut 2026-06-04 |
|--------------|----------------|------------------------------|--------|-------------------|
| Dashboard home / sidebar — `DEFERRED_ROADMAP` | Vide (`deferred-roadmap-placeholders.ts`) | Post-PRD **sans** placeholder global | **OK** — liens via nav **projet** | ✅ Aligné |
| Nav projet — Feature split / stories / delivery | Routes live si `phase` OK | FA **complete** | **Expliquer** prérequis phase — pass1 | 🟠 Pass1 |
| Express — post-PRD nav | Grisé + hint express | PD-002 by design | **Expliquer** — OK | ✅ |
| Standard — post-PRD | Guard `phase` / readiness | Code **complete** | Copy « After PRD v1 » — pas « coming v1 » | 🟠 Pass1 |
| Project members panel | Settings dialog | Hors v0 — **PD-003** | **Masquer** | ✅ Retiré UI |
| PRD export PDF | i18n présent | Hors scope v0 | **Masquer** bouton ou « Soon » | Eng |
| Credits page hero | Packs 100/200/1000 | Shipped | **Expliquer** → renommer « Usage » (aligné pricing narrative) | Product copy |

---

## Remplacement : « roadmap personnelle »

Concept doc (pas impl semaine 1) : bandeau unique **« Prochaine action »** remplace 4 modals « coming in v1 ».

| État projet | Message bandeau |
|-------------|-----------------|
| Pas de PRD | « Créer ta première version (express : ~30 min) » |
| PRD sans share | « Partager ton livrable » |
| PRD partagé, pas export | « Exporter vers Cursor » |
| Post-PRD dispo | « Découper en user stories » |

Spec mois 1 : `docs/TODO.md` → bandeau prochaine action.

---

## Critères done

- [x] Tableau validé UX + Product.
- [ ] Pass 1 dashboard : `under-construction-dashboard-pass1.md`.
