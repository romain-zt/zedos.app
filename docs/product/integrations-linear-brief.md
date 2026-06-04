Owner : Product — Priorité : 🟠 — Trimestre 1

> **Dépendances :** user stories FA shipped, concierge demand signal. **Go/no-go :** ≥ 3 founding builders demandent Linear.

# Intégration Linear — brief produit

## Objectif

User stories Zedos → **issues Linear** synchronisées (statut) — fermer boucle spec → exécution équipe.

---

## Périmètre v1

| Inclus | Exclu |
|--------|-------|
| OAuth Linear workspace | Sync bi-directionnelle complète |
| Push story → issue (titre, description AC) | Epics / cycles auto |
| Statut issue → reflet in Zedos (read) | Comments sync |
| 1 workspace / projet Zedos | Multi-workspace |

---

## Mapping

| Zedos | Linear |
|-------|--------|
| User story | Issue |
| `title` + AC markdown | Description |
| Cluster feature name | Label ou project |
| Story status `done` | Issue state Done |

---

## Parcours

1. Settings projet → Connect Linear.
2. User stories tab → **Push to Linear** (batch ou 1).
3. Webhook Linear `Issue.update` → update story status.

---

## Critères d’acceptation

| AC | Description |
|----|-------------|
| AC-1 | OAuth + choix team/project Linear |
| AC-2 | Create issue idempotent (re-push = update) |
| AC-3 | Status change Linear visible sous 5 min |

---

## Go/no-go gate (T1)

| Signal | Seuil |
|--------|-------|
| Demandes concierge « Linear » | ≥ 3 |
| Sinon | Reporter T2 — doc seulement |

---

## Critères done

- [x] Brief + gate.
- [ ] WORK_QUEUE si gate passé.
