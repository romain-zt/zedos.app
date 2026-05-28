# TODO

## 1) Débloquer les slices bloquées (gouvernance)

- [ ] `fa-payments--manual-credit-pack-checkout`
  - [ ] Exécuter `/feature-area refine-slice` sur `docs/product/scope-slices/payments--manual-credit-pack-checkout.md`
  - [ ] Compléter UX states, data touched, dépendances, checklist de readiness
  - [ ] Exécuter `/feature-area promote-slice` vers `ready-for-user-stories`
  - [ ] Créer User Story puis Plan d'implémentation
  - [ ] Obtenir validation explicite `approved` avant code

- [ ] `fa-owner-milestone-feedback--feedback-capture-and-attribution`
  - [ ] Exécuter `/feature-area refine-slice` sur `docs/product/scope-slices/owner-milestone-feedback--feedback-capture-and-attribution.md`
  - [ ] Compléter UX states, data touched, dépendances, checklist de readiness
  - [ ] Exécuter `/feature-area promote-slice` vers `ready-for-user-stories`
  - [ ] Créer User Story puis Plan d'implémentation
  - [ ] Obtenir validation explicite `approved` avant code

## 2) Ops / Sécurité (priorité haute)

- [ ] Configurer `STRIPE_WEBHOOK_SECRET` en local pour tester `POST /api/stripe/webhook`
  - [ ] Vérifier que la variable existe dans `apps/web/.env` (sans la commiter)
  - [ ] Tester le endpoint webhook en local (signature valide/invalide)
- [ ] Rotation des secrets exposés (à faire plus tard avant toute mise en prod)
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `ABACUSAI_API_KEY`
- [x] Vérifier que les pipelines et webhooks utilisent uniquement les nouveaux secrets
  - [x] Webhook Stripe lit `process.env.STRIPE_WEBHOOK_SECRET` dans `apps/web/app/api/stripe/webhook/route.ts`
  - [x] Les workflows GitHub référencent des secrets GitHub (`secrets.*`) et pas de valeurs en dur
  - [x] Aucune valeur de secret en clair détectée dans le code scanné

## 3) Alignement documentaire

- [ ] Aligner `docs/WORK_QUEUE.md` avec `docs/state/status.json` (source de vérité actuelle)
- [ ] Mettre à jour `docs/state/HANDOFF.md` pour une section "next actions" compacte et non dupliquée
- [ ] Archiver ou réécrire `docs/state/overnight-checklist.md` (contenu historique, plus aligné)

## 4) Vérifications rapides après mise à jour

- [ ] `pnpm -w run typecheck`
- [ ] `pnpm -w run build`
- [ ] `pnpm -w run test`
- [ ] Vérifier que `docs/state/status.json` et `docs/WORK_QUEUE.md` racontent la même histoire

## Notes

- Référence état courant: `docs/state/status.json`, `docs/state/HANDOFF.md`, `docs/BLOCKERS.md`, `docs/POINTS_OF_ATTENTION.md`.
- Le serveur dev local est actif (`pnpm dev`) et répond sur les endpoints observés.
