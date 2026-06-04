---
date: 2026-06-04
owner: CEO + Product
gate: GATE-PHASE1-A
status: in_progress
---

# Gate A — runbook d’exécution (7 jours)

> **Critère PRD :** ≥5 entretiens **et** ≥1 express **≤45 min** (wall clock).  
> **Fermeture :** mettre **SATISFIED** dans `docs/prd/gates-status.md` uniquement quand les **deux** branches sont vertes.

## Branches

| Branche | Fichier preuve | Cible | Statut |
|---------|----------------|-------|--------|
| **A1 — Entretiens** | `docs/gtm/founder-interviews-log.md` + synthèse | 5 faits, ≥3 avant synthèse partielle | ☐ |
| **A2 — Express** | `docs/product/express-30min-checklist-friction-log.md` | 1× Pass ≤45 min | ☐ |

---

## Jour 0 (30 min) — setup

1. Démarrer l’app : `pnpm dev` (depuis racine monorepo).
2. Compte test dédié Gate A (email jetable ou `+gatea` alias).
3. Calendly 30 min — lien dans `founder-interviews-cursor-guide.md` § Calendrier.
4. Copier **variante A H1** depuis `docs/gtm/landing-one-liner-variants.md` pour les entretiens.

---

## A2 — Session express chronométrée (1 session, ~45 min max)

**Idée produit imposée (comparabilité) :** *« App de réservation de cours de yoga pour studios indépendants »*.

| Heure | Action |
|-------|--------|
| T0 | Chrono démarré — ouvrir `/signup` ou login compte test |
| T0+? | Dashboard → **New project** → mode **Express / Urgent** |
| | Clarify jusqu’à génération autorisée (noter nb mini-forms) |
| | Générer livrable express (12 sections visibles) |
| | **Mint share link** — copier URL |
| T_end | Incognito : ouvrir share → vérifier disclaimer express |

**Remplir immédiatement :** `express-30min-checklist-friction-log.md` (table friction + § Résultat).

**Pass Gate A2 si :** T_end − T0 ≤ **45 min** et steps 5–6 OK.

---

## A1 — Entretiens (5× 30 min, étaler sur 5–7 jours)

| # | Objectif jour | Action |
|---|---------------|--------|
| 1–2 | Bookings | 5 créneaux Calendly ; DM Cursor / réseau |
| 3–7 | Exécution | Grille `founder-interviews-cursor-guide.md` ; notes dans `founder-interviews-log.md` |
| Après 3e | Synthèse partielle | `founder-interviews-cursor-synthesis.md` (verdict A/B/C) |
| Après 5e | Synthèse finale | WTP + implications produit |

**Pass Gate A1 si :** 5 entrées **fait** dans le log + synthèse à jour.

---

## Fermeture Gate A

Dans `docs/prd/gates-status.md` :

```markdown
| **GATE-PHASE1-A** | … | **SATISFIED** | YYYY-MM-DD — entretiens: [lien log] ; express: [durée] min Pass |
```

Puis `docs/state/HANDOFF.md` : `current_blocker: null` (si go-live ops séparé).

**Ne pas** lancer `/implement` Phase 1 avant cette ligne.

---

## Checklist opérateur (copier-coller)

- [ ] A2 express Pass documenté (≤45 min)
- [ ] A1 entretien 1
- [ ] A1 entretien 2
- [ ] A1 entretien 3
- [ ] A1 entretien 4
- [ ] A1 entretien 5
- [ ] Synthèse `founder-interviews-cursor-synthesis.md` complétée
- [ ] `gates-status.md` → SATISFIED + date
