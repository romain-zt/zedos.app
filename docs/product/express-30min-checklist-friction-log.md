Owner : Product — Priorité : 🔴 — Semaine 1

> **Dépendances :** `onboarding-three-intentions-spec.md` (entrée I2). Pas d’amélioration IA cette semaine — **mesurer** seulement.

# Express &lt; 30 min — checklist + friction log

> **Gate A (PRD) :** ≥1 session **Pass** (T_end − T0 **≤ 45 min** wall-clock, PRD seuil Gate A) requis avant ship Phase 1. Statut : `docs/prd/gates-status.md`.

## Statut Gate A — express chronométré

| Champ | Valeur |
|-------|--------|
| **Statut** | **OPEN** — voir runbook `docs/ops/gate-a-execution-runbook.md` |
| Sessions documentées | **0** |
| Dernière session | _à remplir après run A2_ |
| Idée imposée (comparabilité) | App réservation yoga — studios indépendants |

## Protocole test (1 fondateur = opérateur, 1 session)

| # | Étape | Critère succès | Timer |
|---|--------|----------------|-------|
| 1 | Signup ou compte test | Dashboard atteint | T0 |
| 2 | New project → **I2 Urgent** / express | Projet créé `journeyMode=express` | |
| 3 | Clarify minimum IA | Banner express visible ; ≤ **8** mini-forms / décisions *(cible doc, pas cap code)* | |
| 4 | Generate express livrable | 12 sections JSON rendues | |
| 5 | Mint share link | Lien copié | |
| 6 | Open share (incognito) | Disclaimer « Express version — to be deepened » visible | T_end |

**Objectif temps :** T_end − T0 **≤ 30 min** (wall clock, idée simple type « app de réservation yoga »).

---

## Friction log (template — à remplir à la session)

| Step | OK? | Durée (min) | Friction | Gravité 🔴🟠🟡 | Action doc/dev |
|------|-----|-------------|----------|----------------|----------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |

---

## Bloqueurs connus (à confirmer en test)

| Bloqueur potentiel | Source | Si confirmé |
|--------------------|--------|---------------|
| Clarify > 8 tours | Minimum IA variable | Ticket : cap soft UX « 3 questions left » |
| Génération lente stream | Infra | Noter P95 secondes |
| Crédits bloquent avant share | Ledger | Vérifier grace premier circuit |
| Import confondu avec express | Onboarding | Renforcer 3 cartes |

---

## Résultat session pilote (2026-06-04 — doc only, run humain requis)

| Champ | Valeur |
|-------|--------|
| Testeur | _à remplir_ |
| Idée produit | _à remplir_ |
| Temps total | _à remplir_ |
| Objectif 30 min | ☐ Pass ☐ Fail |
| Top 3 frictions | 1. _ 2. _ 3. _ |

**Statut doc :** checklist + template **done**. **Statut Gate A :** run humain **pending** — ne pas cocher « Parcours express testé » dans TODO tant que § Résultat session n’est pas **Pass**.

---

## Références

- `docs/product/express-disclaimer-coverage-audit.md`
- `docs/prd/PRD.md` journey #10, PD-002
