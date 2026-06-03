# PostHog — annexe technique (implémentation)

> **Périmètre produit :** [Feature Area: Product analytics](../product/feature-areas/product-analytics.md) et ses [scope slices](../product/scope-slices/product-analytics--owner-product-journey-funnels.md).  
> Ce fichier est une **annexe** pour l’équipe dev/ops — pas le contrat produit.

Objectif : **tracker tous les utilisateurs authentifiés** (et le minimum sur partage anonyme) pour repérer **où le produit bloque** : crédits insuffisants, erreurs API, abandons entre étapes.

Référence officielle : [PostHog — Next.js](https://posthog.com/docs/libraries/next-js).

---

## 1. Principes

| Principe | Détail |
|---|---|
| Identité stable | `distinct_id` = `user.id` (better-auth) après login ; cookie anonyme avant auth |
| Pas de PII dans les propriétés | Email, mot de passe, contenu PRD/clarification **interdits** dans `capture()` |
| Événements = actions | Les pageviews peuvent être auto ; le catalogue ci-dessous privilégie les **actions métier** |
| Serveur + client | Les blocages critiques (crédits, webhooks Stripe, génération PRD stream) doivent aussi être capturés **côté serveur** |
| Opt-out environnements de test | Désactiver PostHog quand `E2E_MODE=true` ou en CI Playwright |
| RGPD | Analytics ≠ consentement marketing existant (`/api/account/consent`) — prévoir bannière / opt-in analytics si requis juridiquement |

---

## 2. Stack cible (apps/web)

- **Next.js** 14.2 — App Router (`apps/web/app/`).
- **Auth** : better-auth (`requireUser`, sessions).
- **SDK client** : `posthog-js` initialisé via `instrumentation-client.ts` à la racine de `apps/web` (convention Next.js).
- **SDK serveur** (optionnel mais recommandé) : `posthog-node` dans les route handlers et flows stream (`generate-prd-stream-flow`, `clarify`, crédits).
- **Proxy** (recommandé prod) : route rewrite `/ingest/*` → PostHog pour limiter les bloqueurs de pub ; voir doc PostHog « Next.js proxy ».

### Variables d’environnement

À ajouter dans `apps/web/.env.example` et sur Vercel :

```bash
# PostHog (EU Cloud recommandé pour utilisateurs FR/EU)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"

# Serveur uniquement (même projet)
POSTHOG_API_KEY="phc_..."   # ou clé serveur dédiée si configurée
POSTHOG_HOST="https://eu.i.posthog.com"

# Désactiver en E2E / CI
NEXT_PUBLIC_POSTHOG_DISABLED="false"
```

`NEXT_PUBLIC_*` requis pour le client. Ne jamais committer de clés réelles.

### Bootstrap minimal (référence)

```typescript
// apps/web/instrumentation-client.ts
import posthog from 'posthog-js'

if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED !== 'true' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true, // clics UI — compléter avec événements métier explicites
  })
}
```

Provider React (optionnel) : wrapper dans `apps/web/components/providers.tsx` pour exposer `usePostHog()` aux composants client.

---

## 3. Identification utilisateur

Appeler **`posthog.identify(userId)`** dès qu’une session better-auth est connue côté client (après sign-in / sign-up réussi, et au mount du dashboard si session déjà présente).

Propriétés person **autorisées** (non sensibles) :

| Propriété | Exemple | Usage |
|---|---|---|
| `account_created_at` | ISO date | cohortes ancienneté |
| `locale` | `fr` / `en` | i18n |
| `has_projects` | boolean | activation |
| `journey_mode` | `standard` / `express` | segment fast-track |

**Ne pas** envoyer : email, nom complet, description projet, texte PRD, réponses clarification.

Côté serveur : propager `X-POSTHOG-DISTINCT-ID` et `X-POSTHOG-SESSION-ID` depuis le client vers les API routes pour aligner client/serveur (doc PostHog « bootstrap server events »).

---

## 4. Catalogue d’événements

Convention de nommage : `snake_case`, verbe au passé ou présent cohérent (`project_created`, `clarify_message_sent`).

Propriétés communes sur **tous** les événements métier :

| Propriété | Type | Description |
|---|---|---|
| `project_id` | string (uuid) | Si dans un projet |
| `journey_mode` | `standard` \| `express` | Mode parcours |
| `phase` | string | Phase workspace (`intake`, etc.) |
| `error_code` | string | Code applicatif si échec |
| `http_status` | number | Si erreur HTTP |

### 4.1 Acquisition & session

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `sign_up_started` | formulaire sign-up, submit | `method` (credentials) |
| `sign_up_completed` | succès use-case sign-up | `starter_credits_granted` |
| `sign_up_failed` | erreur validation / serveur | `error_code` |
| `sign_in_completed` | sign-in réussi + `identify` | — |
| `sign_in_failed` | credentials invalides | `error_code` |
| `session_expired_redirect` | redirect vers `/sign-in` | `from_path` |

### 4.2 Dashboard & projets

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `dashboard_home_viewed` | `app/dashboard/page.tsx` (client boundary) | — |
| `projects_list_viewed` | `dashboard/projects/page.tsx` | `project_count` |
| `project_create_started` | modal / formulaire création | — |
| `project_created` | `POST /api/projects` succès | `project_id` |
| `project_create_failed` | `POST /api/projects` erreur | `error_code` |
| `project_opened` | navigation vers `[id]` | `project_id` |
| `project_settings_saved` | workspace settings dialog | `project_id` |
| `journey_mode_change_requested` | `JourneyModeControls` confirmation | `from_mode`, `to_mode` |
| `journey_mode_changed` | `PATCH .../journey-mode` succès | `from_mode`, `to_mode` |

### 4.3 Workspace projet (onglets)

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `workspace_tab_selected` | `ProjectWorkspace` `onValueChange` tabs | `tab` : `clarify` \| `prd` \| `architecture` \| `history` |
| `prd_version_selected` | `PrdViewer` | `version_number` |
| `workspace_score_loaded` | `WorkspaceScorePanel` succès / échec | `score` si dispo |

### 4.4 Clarification guidée

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `clarify_message_sent` | `ClarificationChat` envoi | `project_id`, `has_prd_version` |
| `clarify_stream_completed` | fin stream clarify | `credits_spent`, `duration_ms` |
| `clarify_blocked_insufficient_credits` | réponse API `insufficient_credits` | `project_id`, `action` : `clarification` |
| `clarify_failed` | erreur stream / timeout | `error_code` |
| `contextual_refinement_opened` | `openRefinement` | `label` |
| `contextual_refinement_completed` | panel refinement succès | — |

### 4.5 PRD

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `prd_generation_started` | début génération (UI + serveur) | `project_id` |
| `prd_generation_completed` | `generate-prd-stream-flow` succès | `version_number`, `duration_ms` |
| `prd_generation_blocked_insufficient_credits` | erreur `insufficient_credits` | `project_id` |
| `prd_generation_failed` | erreur provider / timeout | `error_code` |
| `prd_version_created` | capture version API | `version_number` |
| `prd_shared` | milestone feedback / partage | `surface` |

### 4.6 Feature split, user stories, task split, delivery

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `feature_split_page_viewed` | `feature-split/page.tsx` | `project_id` |
| `feature_split_proposed` | API propose succès | — |
| `feature_split_confirmed` | API confirm succès | `cluster_count` |
| `feature_split_failed` | erreur / crédits | `error_code` |
| `user_stories_page_viewed` | `user-stories/page.tsx` | — |
| `user_story_batch_generated` | génération batch | `story_count` |
| `task_split_page_viewed` | `task-split/page.tsx` | — |
| `delivery_page_viewed` | `delivery/page.tsx` | — |
| `delivery_preview_requested` | export workspace preview | — |
| `delivery_export_downloaded` | téléchargement package | `format` |

### 4.7 Crédits & paiements (blocages fréquents)

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `credits_page_viewed` | `dashboard/credits/page.tsx` | `balance` (nombre uniquement) |
| `credits_depleted_surface_shown` | toast / modal manque crédits | `surface`, `action` |
| `credit_pack_checkout_started` | checkout Stripe manuel | `pack_id` |
| `credit_pack_checkout_completed` | webhook `checkout.session.completed` | `pack_id`, `amount_cents` |
| `auto_reload_enabled` | préférence auto-reload | — |
| `billing_page_viewed` | `dashboard/billing/page.tsx` | — |

### 4.8 Partage lecture seule

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `share_link_created` | mint link API | — |
| `share_link_revoked` | revoke API | — |
| `share_anonymous_viewed` | `share/[token]/page.tsx` | **pas** de `token` en propriété — hash ou rien |

### 4.9 Erreurs & friction

| Événement | Où instrumenter | Propriétés clés |
|---|---|---|
| `api_error` | helper HTTP client / route wrapper | `route`, `http_status`, `error_code` |
| `client_exception` | `posthog.captureException` + Error Boundary | `component` |
| `chunk_load_error` | `ChunkLoadErrorHandler` | — |

Activer **PostHog Error Tracking** en parallèle des événements `*_failed` pour stack traces (avec source maps uploadées au build Vercel).

---

## 5. Funnels PostHog à créer (dashboard)

Configurer dans l’UI PostHog une fois les événements en production.

### Funnel A — Activation propriétaire

1. `sign_up_completed`
2. `project_created`
3. `clarify_message_sent`
4. `prd_generation_completed`
5. `feature_split_confirmed` *(optionnel v0)*

**Question métier** : à quelle étape les fondateurs abandonnent-ils avant un PRD utilisable ?

### Funnel B — Monétisation crédits

1. `clarify_blocked_insufficient_credits` **ou** `prd_generation_blocked_insufficient_credits`
2. `credits_page_viewed`
3. `credit_pack_checkout_started`
4. `credit_pack_checkout_completed`

**Question métier** : le blocage crédits convertit-il vers l’achat ?

### Funnel C — Parcours express (fast-track)

1. `journey_mode_changed` avec `to_mode=express`
2. `prd_generation_completed`
3. `delivery_export_downloaded`

Comparer cohortes `journey_mode=express` vs `standard` sur la rétention J7.

### Funnel D — Partage & viralité

1. `prd_shared`
2. `share_link_created`
3. `share_anonymous_viewed`

---

## 6. Session replay

Activer dans PostHog Project Settings :

- **Enregistrer** les sessions avec erreurs JS (`$exception`).
- **Sample rate** prod : commencer à 20–30 % pour maîtriser le volume ; monter si besoin en debug.
- **Masquer** les champs sensibles : `input[type=password]`, textareas clarification/PRD (CSS class `ph-no-capture` sur les conteneurs de chat).

Utilisation typique :

1. Filtrer les sessions avec `clarify_blocked_insufficient_credits` ou `prd_generation_failed`.
2. Ouvrir le replay → voir si l’utilisateur a compris le message, cliqué crédits, ou quitté.

---

## 7. Feature flags (phase 2)

PostHog peut piloter des rollouts (ex. fast-track, nouveau score workspace). Convention :

- Nom : `ff_<feature>_<variant>` (ex. `ff_express_delivery_v1`).
- Toujours évaluer côté **serveur** pour les actions facturées en crédits.

Non requis pour la v0 analytics ; documenter ici pour éviter un second outil de flags.

---

## 8. Garde-fous & conformité

| Sujet | Action |
|---|---|
| E2E / CI | `NEXT_PUBLIC_POSTHOG_DISABLED=true` quand `E2E_MODE=true` |
| Employés / seed | Exclure emails `*@zedos.test` via filtre interne PostHog ou `posthog.opt_out_capturing()` en dev local |
| Export données compte | `/api/account/export` — documenter PostHog comme sous-traitant dans la politique confidentialité |
| Droit à l’effacement | Process manuel : supprimer personne dans PostHog + DB Zedos |
| Consentement | Le consentement marketing (`marketingConsent`) **ne couvre pas** forcément l’analytics — valider avec juridique ; si requis, n’appeler `posthog.init` qu’après opt-in |

---

## 9. Plan d’implémentation (ordre recommandé)

| Phase | Livrable | Fichiers touchés (indicatif) |
|---|---|---|
| **P0** | SDK + identify + pageviews | `instrumentation-client.ts`, `providers.tsx`, `apps/web/.env.example` |
| **P1** | Événements auth + projets + workspace tabs | `sign-in`, `sign-up`, `projects/page.tsx`, `project-workspace.tsx` |
| **P2** | Blocages crédits + clarify + PRD | `clarify/route.ts`, `clarification-chat.tsx`, `generate-prd-stream-flow.ts` |
| **P3** | Paiements + delivery + partage | routes Stripe webhook, `delivery-export-workspace.tsx`, share routes |
| **P4** | Error tracking + source maps + replays | build Vercel, `ChunkLoadErrorHandler`, Error Boundary dashboard |
| **P5** | Dashboards PostHog (funnels A–D) + alertes | config UI PostHog, doc runbook |

Critères de done v0 :

- [ ] 100 % des utilisateurs authentifiés ont un `distinct_id` stable après login
- [ ] Funnel A visible avec données réelles sur 7 jours
- [ ] Au moins un replay lié à `insufficient_credits` analysé en équipe
- [ ] Aucun événement ne contient de PII (audit grep `email`, `password`, `prd` dans `posthog.capture`)

---

## 10. Runbook — « Où ça bloque ? »

Procédure hebdomadaire (5 min) :

1. **Trends** : volume des événements `*_blocked_insufficient_credits` vs `*_completed` par `action`.
2. **Funnel A** : étape avec la plus forte chute ; croiser avec `workspace_tab_selected` (onglet jamais ouvert ?).
3. **Error tracking** : top 3 issues nouvelles ; ouvrir un replay par issue.
4. **Rétention** : utilisateurs ayant `prd_generation_completed` — reviennent-ils J7 ?

Alertes suggérées (PostHog) :

- Spike `prd_generation_failed` > 2× baseline 1 h
- Chute `sign_up_completed` > 30 % jour/jour
- Zéro `credit_pack_checkout_completed` pendant 48 h en prod (si trafic attendu)

---

## 11. Liens internes

| Ressource | Chemin |
|---|---|
| Blocages exécution (docs produit) | [../BLOCKERS.md](../BLOCKERS.md) |
| Friction phase 2a | [../retro/phase2a-friction-log.md](../retro/phase2a-friction-log.md) |
| Feature areas | [../product/feature-areas/](../product/feature-areas/) |
| Coûts crédits (env) | `apps/web/.env.example` |

---

## 12. Historique

| Date | Changement |
|---|---|
| 2026-06-03 | Création spec initiale — intégration code non démarrée |
