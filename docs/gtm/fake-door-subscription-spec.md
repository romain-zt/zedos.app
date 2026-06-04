Owner : Growth — Priorité : 🟠 — Semaine 1

> **Dépendances :** `pricing-narrative-target.md`, `pricing-human-estimator.md`, variante landing choisie.

# Fake door — Abonnement Builder (spec test)

> **Gate B′ (PRD) :** ≥10 signaux requis pour exception Builder+export après Gate A. Statut : `docs/prd/gates-status.md` — **OPEN**.

## Objectif

Valider willingness-to-pay **avant** impl Stripe Subscription.

---

## Page statique (hors app ou `/pricing-preview`)

| Section | Contenu |
|---------|---------|
| Hero | Builder **39 €/mois** *(fourchette 29–49 — une valeur figée pour le test)* |
| Inclus | Projets illimités, express + standard, share, export Cursor, quota IA « ~3 PRD/mois » |
| Comparatif | Free vs Builder (tableau) |
| CTA | **Notify me when Builder launches** → Typeform ou `mailto:` |

---

## Typeform (champs min)

1. Email  
2. « What would you pay? » — 29 / 39 / 49 / Other  
3. « Primary use » — express today / full PRD / Cursor export  

---

## Critères succès (semaine 1–2)

| Métrique | Cible TODO |
|----------|------------|
| Clics CTA | **≥ 10** |
| Emails valides | **≥ 8** |
| Entretiens mentionnent prix OK | **≥ 3/5** |

---

## Ops

- Pas de charge Stripe.
- Réponse auto email : « You're on the Builder waitlist — founding 50 get -20% » (lien concierge mois 1).

---

## Critères done doc

- [x] Spec page + Typeform + succès.
- [ ] Page publiée URL _à remplir par Growth_.
- [ ] 10 signaux atteints (métrique TODO).
