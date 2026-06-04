Owner : CEO + Legal — Priorité : 🔴 — Mois 1

> **Dépendances :** `docs/BLOCKERS.md` B-ANALYTICS-001, `docs/product/feature-areas/product-analytics.md`. Code PostHog = default-off jusqu’à décision.

# PostHog prod — décision légale & Plan B

## Contexte blocker

| ID | Statut | Blocage |
|----|--------|---------|
| B-ANALYTICS-001 | Open, NEED_HUMAN | Tracking prod EU cookies / consent |
| B-ANALYTICS-002 | Open | Replay prod seulement |

**N’empêche pas** le ship code funnels (default-off).

---

## Option A — Activer PostHog prod (nécessite humain)

| Étape | Owner | ☐ |
|-------|-------|---|
| 1. Base légale choisie (consentement vs intérêt légitime B2B) | Legal | |
| 2. Bandeau cookies + politique confidentialité à jour | Legal + Ops | |
| 3. EU PostHog project + DPA signé | Ops | |
| 4. Exclure comptes test / internes | Product | |
| 5. Documenter dans `BLOCKERS.md` résolution B-ANALYTICS-001 | Product | |

**Délai cible :** 14 jours ou bloquer PH jusqu’à avocat.

---

## Option B — Plan B minimal (recommandé mois 1 si legal retard)

**Sheet hebdomadaire** — 5 métriques, source SQL ou admin manuel :

| # | Métrique | Définition | Source |
|---|----------|------------|--------|
| M1 | Signups | Comptes créés 7j | DB `users` count |
| M2 | Activation | % signup → 1ère version PRD 7j | DB join |
| M3 | Share rate | % projets avec ≥1 lien share actif | DB |
| M4 | Export attempts | Clics export Cursor (logs serveur si dispo) | Logs / manuel |
| M5 | Paid | Nouveaux Builder (Stripe) | Stripe dashboard |

**Rituel :** chaque lundi 30 min CEO — remplir [`metrics-weekly-sheet-template.md`](./metrics-weekly-sheet-template.md).

---

## Décision recommandée (doc)

| Horizon | Choix |
|---------|--------|
| Mois 1 | **Plan B obligatoire** + legal en parallèle |
| Mois 2 | Option A si bandeau + DPA OK |

**Ne pas** activer replay prod avant B-ANALYTICS-002.

---

## Critères done

- [x] Options A/B documentées.
- [ ] Legal sign-off Option A **ou** premier lundi Plan B rempli.
