Owner : Product — Priorité : 🟠 — Mois 1

> **Dépendances :** `docs/product/outcome-tracking-v1.md`. Backlog dev : remplacer prompts milestone.

# Outcome tracking — alignement prompts (milestones)

## Objectif

**1 question outcome** remplace le prompt **étoiles-only** sur le milestone le plus actionnable : **`prd_shared`**.

---

## Mapping milestones actuels → v1

| Milestone existant | Prompt v0 (étoiles) | Prompt v1 (outcome) | Action |
|--------------------|---------------------|---------------------|--------|
| `prd_created` | Stars + comment | **Gel** — pas d’outcome (trop tôt) | Keep stars optional ou silence |
| `prd_updated` | Stars | **Gel** mois 1 | Pas de changement |
| **`prd_shared`** | Stars | **O1** « Did you share this externally? » Yes / Not yet / No | **Replace primary** |
| `prd_viewed` | Stars | **Gel** | Pas de changement |

**O2 pitched** : déclencher **48h après** `prd_shared` si O1 = Yes (email ou in-app mois 2).

**O3 shipped code** : déclencher sur event `cursor_export_completed` (voir `conversion-export-cursor-spec.md`).

---

## Copy modal (EN) — `prd_shared`

**Title:** Quick check-in

**Question:** Did you share this PRD link (or export) with someone outside your account?

**Options:**
- Yes — sent to investor / cofounder / advisor  
- Not yet — still polishing  
- No — private for now  

**Secondary (collapsed):** How useful was this version? 1–5 *(optional, legacy)*

---

## Copy modal (FR)

**Question:** As-tu partagé ce PRD (lien ou export) avec quelqu’un hors de ton compte ?

---

## Règles produit

| Règle | Détail |
|-------|--------|
| Skippable | Oui — pas de blocage |
| Fréquence | Max 1 outcome prompt / milestone / version |
| Analytics | `outcome_submitted` quand PostHog OK ; sinon table seule |

---

## Backlog dev (référence WORK_QUEUE)

| Tâche | Priorité |
|-------|----------|
| Étendre `OwnerMilestonePrompt` pour type `outcome` | P2 |
| Persister `outcome` enum | P2 |
| Dashboard admin outcomes (ops) | P3 |

---

## Critères done

- [x] Mapping + copy EN/FR `prd_shared`.
- [ ] Ticket dev lié à FA owner-milestone-feedback.
