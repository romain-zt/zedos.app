Owner : Product — Priorité : 🔴 — Semaine 1

> **Dépendances :** aucune. Complété par `pricing-human-estimator.md` (semaine 1) et finalisation mois 1 dans TODO.

# Pricing narrative cible (façade produit)

## Principe

| Couche | Modèle | Statut |
|--------|--------|--------|
| **v0 launch (PRD)** | Ledger crédits + packs Stripe 100/200/1000 + auto-reload opt-in | **Live** — loi produit |
| **Façade marketing / Phase 1** | Abonnement **Free / Builder** (Pro = hors Phase 1) | **Copy** — impl après Gate A/B |
| **Backend transition** | Packs = top-up ; Builder = quota mensuel + export Cursor | Spec `stripe-subscription-builder-brief.md` |

- **Interdit marketing :** « 100 crédits », « burn tier 5 » en hero — page « How usage works » secondaire uniquement.
- **Pas de contradiction :** v0 = crédits in-app ; GTM = **narratif** Builder — les deux coexistent jusqu’à migration technique.

---

## Plans cibles (hypothèses blueprint — à valider CEO)

| Plan | Prix indicatif | Inclus (langage humain) |
|------|----------------|-------------------------|
| **Free** | 0 € | 1 projet actif, mode express, 1 partage/mois, pas d’export Cursor |
| **Builder** | 29–49 €/mois | Projets illimités, clarify + PRD standard & express, partage illimité, **export Cursor**, quota IA mensuel « usage typique 2–3 PRD complets » |
| **Pro** | 79–129 €/mois | Tout Builder + modèles IA premium, collab async (quand livré), playbooks express |

**Overage IA :** « Si tu dépasses le quota mensuel, tu complètes en one-shot transparent (pas de dette cachée). »

---

## Mapping crédits → invisible

| Aujourd’hui (interne) | Demain (message fondateur) |
|----------------------|----------------------------|
| 20 crédits signup | « Inclus dans Free pour tester express » |
| Packs 100/200/1000 | « Recharge usage » **ou** inclus dans Builder |
| Grace 20 premier circuit | « Première boucle PRD : on ne coupe pas ta session » (une phrase FAQ) |
| Auto-reload opt-in | « Recharge automatique optionnelle » — jamais « abonnement caché » |

---

## Pages à produire (copy seulement, semaine/mois)

1. **Pricing** — tableau 3 plans, CTA Builder, FAQ overage.
2. **FAQ** — « Pourquoi pas illimité comme ChatGPT ? » → mémoire décisionnelle + handoff Cursor.
3. **Billing in-app** — remplacer titre « Credit packs » par « Usage & plan » avec lien upgrade.

---

## Critères « doc done » semaine 1

- [x] Ce fichier validé par Product.
- [ ] CEO valide fourchette Builder 29 vs 49 €.
- [ ] Growth intègre plans dans `fake-door-subscription-spec.md`.

## Mois 1 — copy publiable

→ [`docs/gtm/pricing-page-copy-en-v1.md`](../gtm/pricing-page-copy-en-v1.md) (finalisé).

## Références

- `docs/prd/PRD.md` § Payment model, Configuration Matrix (burn tiers = interne)
- `docs/product/pricing-human-estimator.md`
