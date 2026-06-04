Owner : Product — Priorité : 🟠 — Trimestre 1

> **Dépendances :** `decision-graph-v1-spec.md` validée.

# Decision Graph v1 — slices & critères d’acceptation

## Découpage (4 slices, ordre strict)

| # | Slice ID | Livrable | Priorité |
|---|----------|----------|----------|
| 1 | `decision-graph--persist-decisions-from-question-history` | Backfill + sync new clarify turns → Decision | P1 |
| 2 | `decision-graph--owner-decisions-list-panel` | Onglet liste + filtres section | P1 |
| 3 | `decision-graph--section-badges-and-links` | Badges sur PRD viewer | P2 |
| 4 | `decision-graph--export-decisions-json` | Inclure dans Cursor zip | P3 |

---

## Slice 1 — Persist

**US :** En tant qu’owner, chaque entrée question history devient une Decision consultable.

| AC | Test |
|----|------|
| AC-1 | Après clarify, ≥1 Decision row existe | Integration |
| AC-2 | `rejectedOptions` peuvent être vides mais champ présent | Unit |
| AC-3 | Idempotent : re-import même history ne duplique pas | Integration |

---

## Slice 2 — List panel

| AC | Test |
|----|------|
| AC-1 | Onglet visible owner-only | E2E |
| AC-2 | Tri desc `createdAt` | Unit |
| AC-3 | Clic decision → highlight sections liées | E2E |

---

## Slice 3 — Section badges

| AC | Test |
|----|------|
| AC-1 | Section sans lien = pas de badge | UI |
| AC-2 | Badge count = nombre DecisionLink distincts | Unit |

---

## Slice 4 — Export JSON

| AC | Test |
|----|------|
| AC-1 | `decisions.json` schéma zod validé | Contract test |
| AC-2 | Absent si 0 decisions | Unit |

---

## FA suggérée

`decision-graph` (nouvelle) — parent FG-POST-PRD-V1 ou FG-PRD-V0 selon `/feature-area` humain.

---

## Critères done

- [x] 4 slices + AC.
- [ ] Entrée WORK_QUEUE après go/no-go.
