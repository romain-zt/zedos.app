Owner : Product — Priorité : 🔴 — Trimestre 1

> **Dépendances :** question history FA (données amont). Mois 1 express/share stables recommandé avant impl.

# Decision Graph v1 — spec produit

## Objectif

Chaque affirmation du PRD est **traçable** à une décision fondateur (ou marquée « inférée ») — moat vs ChatGPT.

---

## Objets métier

| Objet | Champs v1 |
|-------|-----------|
| **Decision** | `id`, `projectId`, `prdVersionId`, `questionText`, `chosenOption`, `rejectedOptions[]`, `ownerComment?`, `aiInterpretation?`, `createdAt` |
| **DecisionLink** | `decisionId`, `sectionId`, `anchor?` (phrase ou offset léger) |
| **InferenceTag** | `sectionId`, `confidence` (high \| medium \| low) — sans decision si inféré |

**Source amont :** mapper `question history` existant → Decision (migration logique, pas re-saisie).

---

## MVP UI (sans fancy)

| Écran | Comportement |
|-------|--------------|
| PRD viewer | Onglet **Decisions** = liste chronologique |
| Section PRD | Badge « 2 decisions » → clic scroll vers liste filtrée |
| Decision row | Question + choix + lien « Affects: Vision, Metrics » |

Pas de graphe force-directed v1 — **liste + liens** suffisent.

---

## Règles

| Règle | Détail |
|-------|--------|
| Immutabilité | Decision non éditée ; nouvelle version PRD → nouvelles decisions |
| Share anonyme | **Aucune** decision exportée sur share (owner-only) |
| Express | Decisions possibles mais moins nombreuses |

---

## Export

- MD export : annexe « Decision log » optionnelle v1.1
- Cursor package : fichier `decisions.json` dans zip v2

---

## Métriques succès T1

| Métrique | Cible |
|----------|-------|
| % sections avec ≥1 decision link (standard projects) | ≥ 40 % |
| Owners ouvrant onglet Decisions / MAU | ≥ 15 % |

---

## Hors scope v1

- Graphe visuel interactif
- Vote associé sur decision
- Merge decisions cross-projets

---

## Critères done

- [x] Objets + MVP UI + règles.
- [ ] Validation fondateur avant slices (`decision-graph-v1-slices-and-acceptance.md`).
