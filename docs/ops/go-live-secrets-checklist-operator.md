Owner : Ops / Fondateur — Priorité : 🔴 — Semaine 1

> **Dépendances :** aucune. **Humain uniquement** — les agents ne doivent pas cocher `secrets_rotated` dans `status.json` sans rotation réelle (`secrets_rotated_policy`).

# Go-live sécurité — checklist opérateur

## Contexte (`docs/state/status.json`)

| Champ | Valeur actuelle | Signification |
|-------|-----------------|---------------|
| `secrets_rotated` | `false` | **INTENTIONAL** jusqu’à fin §1 |
| `secrets_detail` | DB password, NEXTAUTH_SECRET, ABACUSAI_API_KEY leakés ; + STRIPE_WEBHOOK_SECRET prod | Rotation obligatoire |

---

## §1 — Rotation secrets (P0)

| # | Secret | Où régénérer | Où mettre à jour | ☐ |
|---|--------|--------------|------------------|---|
| 1 | Database password | Hébergeur Postgres | `.env` prod — **opérateur local, jamais commit** | |
| 2 | `NEXTAUTH_SECRET` / better-auth secret | `openssl rand -base64 32` | env prod auth | |
| 3 | `ABACUSAI_API_KEY` | Console Abacus | env prod | |
| 4 | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → webhook endpoint prod | env prod | |
| 5 | Stripe **secret key** live | Stripe | env prod si passage live | |

**Après rotation réelle uniquement :** mettre `secrets_rotated: true` dans `status.json` + noter date dans `EXECUTION_LOG.md`.

---

## §2 — Stripe prod (P0 commercialisation)

| # | Action | ☐ |
|---|--------|---|
| 1 | Compte Stripe activé FR/EU + US | |
| 2 | Webhook prod pointe vers `POST /api/stripe/webhook` | |
| 3 | Tax / VAT digital goods configuré (voir FA payments doc) | |
| 4 | Test achat pack 100 crédits en live (carte test puis réelle) | |

---

## §3 — Avant annonce publique

| # | Action | ☐ |
|---|--------|---|
| 1 | Revoke anciennes clés leakées (vérifier logs accès) | |
| 2 | `.env` prod hors git ; CI secrets à jour | |
| 3 | Pas de clé API dans issues / PR / transcripts | |

---

## Sign-off

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Fondateur / Ops | | | |

---

## Critères done doc semaine 1

- [x] Checklist rédigée.
- [ ] §1 **100 %** coché par humain (métrique TODO).
- [ ] `secrets_rotated` passé à true **uniquement** après §1.
