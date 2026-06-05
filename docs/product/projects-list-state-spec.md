Owner : UX — Priorité : 🟡 — Mois 1

> **Dépendances :** `docs/product/next-action-banner-spec.md` (même logique d’état). *Peut attendre après bandeau — spec livrée.*

# Liste projets — colonne état

## Objectif

Diagnostic **H5** : reprendre un projet en 1 coup d’œil — **brouillon / PRD v1 / partagé / export Cursor**.

---

## Colonnes liste (`/dashboard/projects`)

| Colonne | Description |
|---------|-------------|
| **Name** | Titre projet (existant) |
| **State** | Badge unique dérivé (voir table) |
| **Updated** | `lastActivityAt` relatif |
| **Mode** | Express / Standard pill |
| **Action** | Lien CTA contextuel |

---

## Dérivation état (priorité haute → basse)

| Badge | Condition |
|-------|-----------|
| **Exported** | ≥1 export Cursor complété (compte ou projet) |
| **Shared** | ≥1 share link actif + PRD exists |
| **PRD ready** | ≥1 version PRD, pas de share |
| **Clarifying** | Session clarify ouverte sans PRD |
| **Draft** | Projet créé, pas de PRD |

---

## CTA par état

| State | CTA label |
|-------|-----------|
| Draft | Continue setup |
| Clarifying | Resume clarify |
| PRD ready | Share |
| Shared | Export to Cursor |
| Exported | Open project |

---

## Filtres (v2)

- Tous / Express only / Needs action

---

## Hors scope

- Tri multi-user
- Archivage projets

---

## Critères done

- [x] Spec colonnes + dérivation + CTA.
- [ ] Ticket dev après `NextActionBanner`.
