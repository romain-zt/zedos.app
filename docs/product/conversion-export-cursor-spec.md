Owner : Product — Priorité : 🔴 — Mois 1

> **Dépendances :** `docs/gtm/pricing-page-copy-en-v1.md`, `docs/product/pricing-narrative-target.md` (Free = pas d’export).

# Conversion — 1er export Cursor (paywall moment)

## Objectif

Le **premier export Cursor réussi** = moment de valeur maximale → upgrade **Builder** (ROI #6).

---

## Trigger produit

| Événement | Condition |
|-----------|-----------|
| `cursor_export_completed` | Owner signed-in, 1ère fois **par compte** (pas par projet) |
| Prérequis | PRD version exists + delivery package generated |

---

## Comportement par plan (cible)

| Plan | 1er export |
|------|------------|
| **Free** | Autoriser **preview** (liste fichiers) **ou** bloquer download → modal upgrade |
| **Builder / Pro** | Export complet, pas de friction |

**Décision recommandée :** **soft gate** — voir structure zip + 1 fichier exemple ; zip complet après upgrade. *(Alternative stricte : bloc total — plus de MRR, plus de churn.)*

---

## Modal upgrade (copy EN)

**Title:** Your Cursor handoff is ready.

**Body:** Export the full package — user stories, tasks, and agent prompts — on Builder. Most founders ship their first spec the same day.

**CTA:** Upgrade to Builder — $39/mo  
**Secondary:** Download sample file only  
**Tertiary:** Not now

---

## Email transactionnel (J0 export bloqué)

**Subject:** Your Zedos → Cursor package is waiting

**Body bullets:**
- Project name + link
- What’s inside the package (WORK_QUEUE, stories, prompts)
- Founding Builder $29 if concierge cohort
- CTA billing

---

## In-app nudges (avant export)

| Surface | Copy |
|---------|------|
| Delivery tab | « Export unlocks on Builder — included in your plan » |
| Post-PRD nav | Badge « Export » avec lock icon si Free |

---

## Métriques

| Métrique | Cible mois 1 |
|----------|--------------|
| Export attempt → upgrade click | ≥ 25 % |
| Export attempt → paid (7j) | ≥ 10 % |

---

## Backlog dev (référence)

- Feature flag `export_gate_free_v1`
- Stripe Checkout session Builder
- Event analytics après B-ANALYTICS-001

---

## Critères doc done

- [x] Trigger + modal + email spec.
- [ ] CEO choisit soft vs hard gate.
