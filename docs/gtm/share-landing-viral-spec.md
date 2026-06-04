Owner : Growth + UX — Priorité : 🟠 — Semaine 1

> **Dépendances :** `landing-one-liner-variants.md`, disclaimer audit OK sur share page.

# Spec — Landing share virale (viewer anonyme)

## Objectif

Chaque lien share = **mini-landing** : lecteur impressionné → **signup express** (viralité budget zéro).

---

## Layout (wire texte)

```
[Watermark discret] Made with Zedos

[Express disclaimer si express]

[PRD content — read only]

--- sticky footer ou bandeau bas ---

You just read a founder's product truth in one link.
Get your own shareable spec in 30 minutes.

[ CTA primaire ] Create yours — express, free
[ CTA secondaire ] See examples

[Legal] Read-only · No account required to view
```

---

## Copy EN / FR

| Élément | EN | FR |
|---------|----|----|
| CTA primaire | Create yours — express, free | Créer le vôtre — express, gratuit |
| Sous-CTA | No credit card for first project | Pas de CB pour le premier projet |
| Watermark | Made with Zedos | Créé avec Zedos |

---

## Tracking (sans PostHog prod)

| Param | Usage |
|-------|--------|
| `?ref=share` | Signup attribution |
| `utm_source=share_link` | Manuel spreadsheet |

---

## Critères succès (mois 1)

| Métrique | Cible |
|----------|-------|
| Viewer → signup | ≥ 5 % |
| Clic CTA bandeau | ≥ 15 % des viewers |

---

## Hors scope semaine 1

- Impl bandeau (ticket dev).
- A/B watermark vs pas watermark.

---

## Références

- `docs/prd/PRD.md` Q-011 anonymous share
- `docs/gtm/prd-gallery-brief.md` (CTA secondaire)
