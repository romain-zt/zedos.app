Owner : Product — Priorité : 🔴 — Trimestre 1

> **Dépendances :** `decision-graph-v1-spec.md` (optionnel v1). Export MD + repo lien (`prd-repo-sync-mvp-spec.md`) recommandé.

# PRD Drift Radar — GitHub v1 spec

## Objectif

Signaler quand **le repo ou les issues** divergent du PRD in-app — raison de revenir sur Zedos (rétention).

---

## Prérequis fondateur

| Champ | Détail |
|-------|--------|
| `githubRepoUrl` | `owner/repo` sur projet |
| `githubAccess` | OAuth read-only ou PAT stocké chiffré (décision `/plan`) |

---

## Signaux v1

| Signal ID | Détection | Sévérité |
|-----------|-----------|----------|
| `DRIFT-01` | README mentionne feature **absente** de `core_features` | Medium |
| `DRIFT-02` | Issue ouverte titre match mot-clé feature **out_of_scope** | High |
| `DRIFT-03` | Aucun commit 30j mais PRD `timeline` dit « MVP shipping now » | Low |
| `DRIFT-04` | Diff texte : export MD repo `LATEST.md` vs version PRD active (si sync MVP) | Medium |

**v1 :** heuristiques + LLM résumé optionnel (1 crédit) — pas analyse AST code.

---

## Alerte

| Canal | Fréquence |
|-------|-----------|
| Email | Hebdo lundi |
| In-app | Bannière `NextAction` état **Drift detected** |

**Copy email :** « 2 mismatches between GitHub and your PRD — review »

---

## UI

| Élément | Contenu |
|---------|---------|
| Drift inbox | Liste signaux + bouton « Mark resolved » |
| PRD section | Icône ⚠ si section citée dans signal |

---

## Permissions & privacy

- Lire **public** repo ou repo privé avec OAuth scope minimal.
- Ne pas stocker code source — **métadonnées** only.

---

## Métriques T1

| Métrique | Cible |
|----------|-------|
| % projets Builder avec repo connecté | ≥ 30 % |
| Drift email open rate | ≥ 35 % |

---

## Hors scope v1

- GitLab / Bitbucket
- Auto-PR pour fix PRD
- Blame par commit

---

## Critères done

- [x] Signaux + alerte + UI spec.
- [ ] OAuth scope validé Eng.
