Owner : Product — Priorité : 🔴 — Semaine 1

> **Dépendances :** PD-002 (copy obligatoire). Complète `express-30min-checklist-friction-log.md` étape 6.

# Audit — Disclaimer express « à approfondir »

## Copy canonique

| Locale | Clé i18n | Texte |
|--------|----------|-------|
| EN | `prd.expressDisclaimer` | Express version — to be deepened. |
| FR | `prd.expressDisclaimer` | Version express — à approfondir. |

Composant : `apps/web/components/express-prd-disclaimer.tsx`

---

## Matrice de couverture

| Surface | Fichier | Condition `deliverableKind === 'express'` | Statut | Gap / ticket |
|---------|---------|-------------------------------------------|--------|--------------|
| Share anonyme | `share/[token]/_components/shared-prd-view.tsx` | Oui | **OK** | — |
| PRD owner | `prd-viewer.tsx` | Oui | **OK** | — |
| Print / export HTML | _chercher `prd-print`_ | À vérifier en QA | **À vérifier** | Ticket dev si absent |
| Export PDF | Hors v0 | N/A | — | — |
| Email share (futur) | N/A | — | — | Spec si feature |
| OpenGraph / meta share | N/A | — | **Gap** | Meta description « Express draft » pour preview Slack |
| Export Markdown | Futur | — | En-tête MD avec disclaimer |

---

## Tickets doc → dev (priorité)

| ID | Priorité | Description |
|----|----------|-------------|
| DISC-01 | 🟠 | QA print route : disclaimer visible si express |
| DISC-02 | 🟡 | Meta OG share page : titre suffix « (Express draft) » |
| DISC-03 | 🟡 | MD export header (v0.1) |

---

## Critères done semaine 1

- [x] Liste surfaces + statut code connu.
- [ ] QA humain confirme print (case DISC-01).
- [ ] PD-002 considéré **shipped** côté share + owner.
