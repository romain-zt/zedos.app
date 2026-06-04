Owner : UX — Priorité : 🟠 — Semaine 1

> **Dépendances :** `under-construction-inventory.md` (tableau master).

# Under construction — Pass 1 (5 écrans les plus vus)

## Périmètre

Appliquer les actions inventaire sur les **5 surfaces à plus fort trafic** (ordre priorité fondateur actif).

---

## Écran 1 — Workspace shell / nav projet

| Champ | Valeur |
|-------|--------|
| Fichier | `apps/web/app/dashboard/_components/dashboard-shell.tsx` |
| Message actuel | `roadmap.comingV1` sur Feature split, User stories, Task split, Delivery |
| Problème | FA **complete** — message faux |
| **Copy cible (standard, PRD ready)** | Nav active ; label « Feature split » sans badge v1 |
| **Copy cible (PRD pas ready)** | Badge « After PRD v1 » + tooltip « Generate your first PRD version » |
| **Copy cible (express)** | Inchangé grisé + `workspace.expressPostPrdNavHint` |
| Ticket dev | Retirer `comingV1` si `project.phase >= prd_ready` |

---

## Écran 2 — Liste projets

| Champ | Valeur |
|-------|--------|
| Fichier | `apps/web/app/dashboard/projects/page.tsx` |
| Message actuel | Empty : « Start clarification flow » |
| Copy cible | « Start a 48h product truth sprint » + lien 3 intentions |
| Ticket dev | i18n `projects.emptyDescription` |

---

## Écran 3 — Clarify (express banner)

| Champ | Valeur |
|-------|--------|
| Fichier | i18n `clarify.expressModeBanner` |
| Message actuel | OK technique |
| Action | **Garder** ; ajouter ETA « ~N questions » quand data dispo (mois 1) |

---

## Écran 4 — PRD viewer (owner)

| Champ | Valeur |
|-------|--------|
| Fichier | `prd-viewer.tsx` + `ExpressPrdDisclaimer` |
| Message actuel | Disclaimer express OK |
| Action | **Garder** ; CTA secondaire « Deepen in standard mode » (copy doc only) |

---

## Écran 5 — Credits / Billing

| Champ | Valeur |
|-------|--------|
| Fichier | `apps/web/app/dashboard/credits/page.tsx` |
| Message actuel | Packs 100/200/1000 |
| Action | Titre page → « Usage & plan » ; packs sous section « Top up » (aligné `pricing-narrative-target.md`) |
| Ticket dev | Copy + lien « View plans » fake door |

---

## Synthèse tickets (priorité dev)

| P0 | P1 |
|----|-----|
| Nav : enlever coming v1 si post-PRD shipped | Empty state 3 intentions |
| Masquer members panel (PD-003) | Credits page rename |

---

## Critères done doc

- [x] 5 écrans documentés avec copy cible.
- [ ] Fondateur valide en walkthrough 15 min.
