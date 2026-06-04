Owner : UX — Priorité : 🟠 — Trimestre 1

> **Dépendances :** `landing-one-liner-variants.md` (FR mirror), SEO slugs FR (`seo-playbooks-10-pages-outline.md`).

# Audit i18n FR — parcours prioritaires

## Objectif

Lister clés **à traduire / corriger** pour marché FR — express, pricing, share, onboarding.

**Fichier source :** `apps/web/public/messages/fr/common.json`  
**Référence EN :** `apps/web/public/messages/en/common.json`

---

## Parcours P0 (bloquent conversion FR)

| Clé | EN (réf) | FR actuel | Action |
|-----|----------|-----------|--------|
| `projects.journeyModeExpressHint` | Fast-track… | Vérifier ton urgent | OK / ajuster |
| `projects.journeyModeStandardHint` | Full guided… | Parcours complet… | OK |
| `projects.importPrdHint` | Paste or upload… | Traduire si EN restant | Vérifier |
| `prd.expressDisclaimer` | Express version… | Version express — à approfondir | **OK** |
| `clarify.expressModeBanner` | Express mode… | Traduire intégral | Vérifier |
| `workspace.expressPostPrdNavHint` | Not available express… | **Mix EN/FR?** | Uniformiser FR |
| `roadmap.*` | Coming v1… | Arrive en v1… | Remplacer par copy « Débloquer après PRD » (dashboard pass1) |

---

## Parcours P1 (monétisation)

| Zone | Clés à créer (pas en app) |
|------|---------------------------|
| Pricing page | `pricing.*` — **nouveau namespace** quand page live |
| Export gate | `export.upgradeTitle`, `export.upgradeBody` |
| Next action banner | `nextAction.*` — spec banner |

---

## Parcours P2

| Zone | Notes |
|------|-------|
| Credits / billing | `nav.billing`, packs |
| Delivery | `projectNav.delivery` |
| Members | Masquer PD-003 — pas traduire investissement |

---

## Clés à ajouter (FR + EN) — backlog

```json
{
  "nextAction.share.title": "Prochaine étape : partager votre livrable",
  "nextAction.export.title": "Exporter vers Cursor",
  "pricing.builder.title": "Builder",
  "onboarding.intent.urgent": "C'est urgent"
}
```

---

## QA checklist

| # | Test | ☐ |
|---|------|---|
| 1 | Création projet FR — 3 intentions lisibles | |
| 2 | Express disclaimer share FR | |
| 3 | Post-PRD grisé message FR | |
| 4 | Browser `fr` — pas de string EN résiduelle P0 | |

---

## Critères done

- [x] Audit P0/P1 + clés backlog listées.
- [ ] PR i18n après copy validée Product.
