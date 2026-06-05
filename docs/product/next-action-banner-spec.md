Owner : UX — Priorité : 🟠 — Mois 1

> **Dépendances :** `docs/product/onboarding-three-intentions-spec.md`, `docs/product/under-construction-dashboard-pass1.md` (remplace modals « coming v1 »).

# Bandeau « Prochaine action » — spec UX

## Objectif

Répondre au **H3 diagnostic** : « Où j’en suis ? » — **une** bannière persistante en haut du workspace projet (et dashboard si 0 projet).

---

## Emplacement

| Contexte | Position |
|----------|----------|
| Dashboard (0 projet) | Sous header — carte unique 3 intentions |
| Dashboard (≥1 projet) | Optionnel : « Resume [Project X] » |
| Workspace projet | **Sticky** sous project nav — pleine largeur |

---

## Machine à états

| État ID | Condition (données) | Titre bandeau | CTA primaire | CTA secondaire |
|---------|---------------------|---------------|--------------|----------------|
| `S0` | Aucun projet | Start your product truth sprint | Create project | See examples |
| `S1` | Projet sans PRD version | Clarify your idea | Open Clarify | Switch intention |
| `S2` | Clarify in progress (session ouverte) | Continue clarification | Resume Clarify | — |
| `S3` | PRD v1 exists, no share link active | Share your livrable | Create share link | Refine PRD |
| `S4` | Share created, no Cursor export (standard, phase ok) | Hand off to Cursor | Open Delivery | Copy share again |
| `S5` | Express + post-PRD locked | Deepen when ready | Switch to standard | Keep express share |
| `S6` | Builder export done | Iterate or new project | View PRD versions | New project |

**Priorité affichage :** premier état non satisfait dans l’ordre S1→S6 (S5 override si `journeyMode=express`).

---

## Copy EN (exemples)

| État | Titre |
|------|-------|
| S3 | **Next:** get a read-only link before tomorrow’s meeting. |
| S4 | **Next:** export your Cursor package and start building. |
| S5 | **Express mode:** post-PRD steps unlock in standard mode. [Approfondir] |

---

## Règles express

- Ne pas afficher S4 « Delivery » si post-PRD grisé — rester S5 ou S3 (share first).
- Disclaimer express **non** dans le bandeau (reste sur PRD / share).

---

## Métriques

| Event | Usage |
|-------|--------|
| `next_action_banner_shown` | state_id |
| `next_action_cta_click` | state_id, cta |

---

## Hors scope v1 bandeau

- ML prédiction « meilleure action »
- Notifications email (mois 2)

---

## Critères doc done

- [x] États + copy + placement.
- [ ] Maquette Figma optionnelle.
- [ ] Ticket dev : composant `NextActionBanner`.
