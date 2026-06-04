Owner : Product + Growth — Priorité : 🟠 — Trimestre 1

> **Dépendances :** playbooks express (`playbook-express-pitch-demain.md`), galerie (`prd-gallery-live-content.md`).

# Templates marketplace v1 — cadrage

## Objectif

Bibliothèque **forkable** de parcours + structures PRD — effet réseau sans attendre UGC massif.

---

## 10 templates seed (T1)

| ID | Nom | Type | Journey | Secteur |
|----|-----|------|---------|---------|
| T01 | Pitch tomorrow | Playbook | express | Generic |
| T02 | B2B SaaS seed | PRD skeleton | standard | B2B |
| T03 | Marketplace two-sided | PRD skeleton | standard | Marketplace |
| T04 | AI developer tool | PRD skeleton | standard | AI |
| T05 | Mobile consumer app | PRD skeleton | standard | Consumer |
| T06 | Investor dataroom lite | One-pager pack | express | Fundraising |
| T07 | Pivot this week | Playbook | express | Generic |
| T08 | Import ChatGPT cleanup | Import guide | import | Generic |
| T09 | Cursor handoff only | Post-PRD | standard | DevTools |
| T10 | FR pitch demain | Playbook | express | FR |

**Contenu seed :** dériver de docs existants (`playbook-express-pitch-demain.md`, `stakeholder-one-pager-templates.md`, examples galerie).

---

## Métadonnées template

| Champ | Description |
|-------|-------------|
| `slug` | URL |
| `title`, `description` | Marketing |
| `journeyMode` | standard \| express \| import |
| `sectionsOutline[]` | ids PRD pré-remplis |
| `clarifyHints[]` | Questions suggérées |
| `author` | `zedos-official` |
| `forkCount` | Compteur public |

---

## Règles publication communautaire (v1.1)

| Règle | Détail |
|-------|--------|
| Qui publie | Pro plan + compte ≥ 30 jours |
| Modération | 1ère publication review manuelle ops |
| Interdit | Données perso, spam, contenu hors produit |
| Licence | CC-BY — auteur garde responsabilité |
| Retrait | Signalement → hide sous 48h |

**T1 :** seed official only — pas UGC ouvert.

---

## UX MVP

| Écran | Comportement |
|-------|--------------|
| `/templates` | Grille 10 cartes |
| Clic | « Use template » → préremplit création projet |
| Preview | Modal outline sections |

---

## Métriques

| Métrique | Cible T1 |
|----------|----------|
| % new projects via template | ≥ 25 % |
| Top 3 templates usage | Track |

---

## Critères done

- [x] 10 seed + règles + UX outline.
- [ ] Rédaction contenu T02–T10 (Growth, par template).
