Owner : Product — Priorité : 🔴 — Semaine 1

> **Dépendances :** lire `positioning-vocabulary.md` avant alignement copy.

# Audit — Kill narrative « v0 = PRD only »

## Objectif

Lister chaque surface où le fondateur lit encore « PRD only » ou équivalent, et proposer le **wording wedge** : **pitch → share → Cursor en 48h**.

---

## `docs/prd/PRD.md` (messages fondateur internes / futur site)

| Emplacement | Texte actuel (extrait) | Action | Wording cible |
|-------------|------------------------|--------|---------------|
| Product Overview L14 | « v0, the product delivers … PRD » ; post-PRD « under construction » | Réécrire overview public (PRD update séparé) | « v0 livre clarification + PRD versionné + share ; **v1 active** : handoff Cursor » |
| Global Product Picture L52 | « solo founder … share links » OK | Garder | Ajouter une phrase wedge en tête |
| Flow Inventory L110–114 | Express / import encore **Planned v0** | **Doc alignement** → `flow-inventory-work-queue-alignment-2026-06-04.md` | Marquer Shipped si WORK_QUEUE complete |
| MVP checklist L170 | « Non-PRD … under construction » | Remplacer narrative | « Post-PRD : disponible en mode standard ; grisé en express » |

**Note :** ne pas éditer `PRD.md` dans ce livrable — checklist pour `/prd update` humain.

---

## Signup / login (à aligner côté app)

| Surface | Fichier i18n / route | Texte actuel observé | Wording wedge proposé |
|---------|----------------------|----------------------|------------------------|
| Signup | `apps/web/app/signup/page.tsx` | *(vérifier titre page — souvent générique)* | H1 : « Ship your product truth in 48 hours » |
| Login | `apps/web/app/login/page.tsx` | Idem | Sous-titre : « Clarify, version, share, export to Cursor » |

---

## Dashboard

| Surface | Comportement actuel | Action |
|---------|-------------------|--------|
| Nav post-PRD (standard) | Badge « Coming in v1 » + modal roadmap | Remplacer par copy **« Débloquer après PRD »** ou lier CTA express → standard (voir `under-construction-dashboard-pass1.md`) |
| Nav post-PRD (express) | Grisé + `workspace.expressPostPrdNavHint` | **Garder** — message clair |
| Empty projects | « Start clarification flow » | « Start your 48h product truth sprint » |
| Credits nav | « Credits » / « Billing » | Billing OK ; éviter « buy credits » en hero dashboard |

---

## Checklist alignement (semaine 1)

- [ ] CEO valide wedge EN + FR (`positioning-vocabulary.md`).
- [ ] Product ouvre ticket copy : signup H1 + dashboard empty state.
- [ ] Product planifie `/prd update` Flow Inventory express/import/post-PRD.
- [ ] Growth n’utilise plus « PRD tool » dans posts semaine 1.

## Références

- `docs/gtm/landing-one-liner-variants.md`
- `docs/prd/flow-inventory-work-queue-alignment-2026-06-04.md`
