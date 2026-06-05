Owner : Product — Priorité : 🟠 — Mois 1

> **Dépendances :** `docs/product-decisions/PD-003.md`. Pas d’édition live — commentaires async uniquement.
>
> **Superseded (2026-06-04) :** doc trimestre ; slices canoniques `collab-async--invite-commenter` et `collab-async--section-comment-threads`. Voir `docs/WORK_QUEUE.md`.

# Scope Slice — Collab async v1 (commentaires par section)

## Status

`superseded` — ne pas promouvoir ; utiliser `collab-async--invite-commenter` et `collab-async--section-comment-threads`.

## Product Intent

Un **associé** (invité par email) peut **commenter une section** du PRD sans éditer le document — le fondateur garde le contrôle de la vérité produit.

---

## In Scope

- Owner invite **commenter** par email (max **3** invités actifs / projet en v1).
- Commenter voit PRD **read-only** + fil de commentaires **par section** (`section_id`).
- Owner reçoit notification in-app (email optionnel v1.1).
- Owner peut **resolve** / **archive** un fil.
- Pas de commentaire sur surface **share anonyme**.

## Out of Scope

- Édition live / co-editing.
- Rôle **editor** qui modifie le PRD (PRD v0 exclusion — PD-003).
- Threads sur clarify / question history (v2).
- @mentions, réactions emoji (v2).

---

## Permissions

| Rôle | Voir PRD | Commenter | Éditer PRD | Inviter |
|------|----------|-----------|------------|---------|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Commenter | ✓ | ✓ | — | — |
| Share viewer | ✓ (link) | — | — | — |

---

## Business Objects

| Objet | Champs clés |
|-------|-------------|
| `ProjectInvite` | `projectId`, `email`, `role=commenter`, `status` |
| `SectionComment` | `sectionId`, `prdVersionId`, `authorId`, `body`, `resolvedAt` |

---

## User Journeys

1. Owner invite → email magic link → compte ou session commenter.
2. Commenter ouvre PRD → clic section → ajoute commentaire.
3. Owner voit badge « 2 unresolved » sur section → répond ou resolve.

---

## Dependencies

| Dep | Status |
|-----|--------|
| Masquer `ProjectMembersPanel` editor/viewer | PD-003 |
| PRD versioning | shipped |
| Auth email | shipped |

---

## Acceptance (high level)

| AC | Description |
|----|-------------|
| AC-1 | Invité commenter ne peut pas PATCH section content |
| AC-2 | Commentaires attachés à une version PRD (snapshot ou live — décision `/plan`) |
| AC-3 | Owner-only resolve |

---

## FA parent suggérée

`collab-async` (nouvelle FA) ou extension `project-workspace`.

---

## Critères doc done

- [x] Slice frontière rédigée.
- [ ] `/feature-area` + WORK_QUEUE si validé.
