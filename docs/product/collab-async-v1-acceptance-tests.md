Owner : Product — Priorité : 🟠 — Trimestre 1

> **Dépendances :** `scope-slices/collab-async-v1--section-comments.md` **implémentée**. Doc QA avant release ; exécutable manuellement si pas encore codé.

# Collab async v1 — acceptance tests (doc QA)

## Scénarios

### AT-01 — Invite commenter

| Step | Action | Expected |
|------|--------|----------|
| 1 | Owner ouvre projet → Invite `commenter@test.com` | Email sent |
| 2 | Commenter clique lien magic | Session commenter, no edit UI |
| 3 | Owner voit pending invite | Status active |

---

### AT-02 — Comment on section

| Step | Action | Expected |
|------|--------|----------|
| 1 | Commenter ouvre PRD section `vision` | Read-only content |
| 2 | Ajoute comment « Metric vague » | Comment visible owner |
| 3 | Owner répond | Thread 2 messages |
| 4 | Owner resolve | Badge resolved |

---

### AT-03 — No PRD edit for commenter

| Step | Action | Expected |
|------|--------|----------|
| 1 | Commenter tente modifier texte section | **Blocked** — no controls |
| 2 | API PATCH section as commenter | **403** |

---

### AT-04 — Share surface isolated

| Step | Action | Expected |
|------|--------|----------|
| 1 | Viewer ouvre share link | PRD read-only |
| 2 | Pas de UI comment | No comment box |

---

### AT-05 — Owner notification

| Step | Action | Expected |
|------|--------|----------|
| 1 | New comment | Owner in-app badge/inbox |
| 2 | Email | Optional v1.1 — document skip |

---

### AT-06 — Max invites

| Step | Action | Expected |
|------|--------|----------|
| 1 | Owner invite 4th commenter | **Rejected** with message (max 3) |

---

## Non-regression

| ID | Check |
|----|-------|
| NR-1 | PD-003 : editor/viewer panel still hidden |
| NR-2 | Solo owner flow unchanged |

---

## Sign-off release

| Rôle | Date | Pass ☐ |
|------|------|--------|
| Product | | |
| QA / Founder | | |

---

## Critères done

- [x] Scénarios AT-01..06 documentés.
- [ ] Exécution manuelle post-impl.
