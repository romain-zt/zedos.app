Owner : Product — Priorité : 🟠 — Semaine 1

> **Dépendances :** aucune. Remplace progressivement les **étoiles** comme signal nord (gel nouveaux prompts étoiles-only).

# Outcome tracking v1 — spec produit

## Objectif

Mesurer si Zedos aide à **sortir un résultat réel**, pas seulement si l’utilisateur « aime » le texte généré.

---

## Trois outcomes v1

| ID | Question (owner, skippable) | Moment de capture | Stockage minimal |
|----|----------------------------|-------------------|------------------|
| **O1** | « As-tu **partagé** ce PRD (lien ou export) ? » Oui / Non / Pas encore | 24h après 1ère génération PRD | `project_id`, `prd_version_id`, `outcome=shared`, `timestamp` |
| **O2** | « As-tu **pitché** avec ce livrable ? » Oui / Non | Après milestone `prd_shared` (remplace ou complète like/dislike) | `outcome=pitched` |
| **O3** | « As-tu **lancé du code** (Cursor/repo) depuis ce projet ? » Oui / Non | Après 1er export Cursor réussi *(ou clic export)* | `outcome=shipped_code` |

**Gel semaine 1 :** ne pas ajouter de 4e outcome avant 50 payants concierge.

---

## Règles UX

- **1 question max** par prompt (pas formulaire long).
- Toujours **skippable** ; pas de blocage génération.
- **Jamais** sur surface share anonyme (inchangé PRD).

---

## Dépréciation étoiles

| Avant | Après v1 |
|-------|----------|
| 1–5 stars après milestone | Conserver en **optionnel secondaire** ou masquer |
| North star = positive feedback rate | North star = **O1 + O2 rate** sur cohortes express |

---

## Backlog impl (hors scope doc)

- Event `outcome_submitted` (PostHog) après B-ANALYTICS-001.
- Table `owner_outcomes` ou colonne JSON sur feedback existant.

---

## Critères doc done

- [x] 3 outcomes + moments définis.
- [ ] CEO valide O2/O3 wording EN.
- [ ] Lien mois 1 : `TODO.md` → alignement prompts milestone.
