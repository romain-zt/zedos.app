Owner : UX + Product — Priorité : 🔴 — Semaine 1

> **Dépendances :** `landing-one-liner-variants.md` (même 3 cartes hero + création projet).

# Onboarding — 3 intentions (spec copy + routing)

## Objectif

À la **création projet** (ou post-signup), le fondateur choisit une intention en **une carte** — pas un formulaire long.

---

## Les 3 cartes

| ID | Titre EN | Titre FR | Sous-titre | Route / paramètres existants |
|----|----------|----------|------------|------------------------------|
| **I1 — Explorer** | Explore my idea | Explorer mon idée | Full guided path to a rich PRD. | `journeyMode=standard`, pas d’import |
| **I2 — Urgent** | I need it today | C’est urgent | Express livrable in ~30 min, share same day. | `journeyMode=express` |
| **I3 — Import** | I already have a doc | J’ai déjà un document | Paste or upload → version 1 in-app. | `importPrd=true` (+ optionnel express) |

**Combinable (doc) :** I3 + I2 = import puis raffiner en express — toggle « Also fast-track » sur carte I3.

---

## Wire copy — écran « New project »

```
[Header] What do you need right now?

[Card I2 — highlighted par défaut si ?utm=express]
  I need it today
  Minimum questions → shareable 12-section livrable
  [ CTA: Start express ]

[Card I1]
  Explore my idea
  Full clarification → standard PRD
  [ CTA: Start standard ]

[Card I3]
  I already have a document
  Paste .md / .txt — no credits for import alone
  [ ] Also mark as urgent (express)
  [ CTA: Import & continue ]
```

---

## Mapping technique (déjà en prod — pas d’impl ici)

| Champ UI actuel | `projects/page.tsx` |
|-----------------|---------------------|
| Journey radio | `standard` / `express` |
| Import toggle | `importPrd` + paste/upload |

**Gap UX :** intention en 3 cartes vs radio + toggle — **refonte layout** backlog dev.

---

## Empty state post-signup (dashboard)

| Avant | Après |
|-------|-------|
| « Create your first project » | « Pick your path: urgent, explore, or import » + 3 liens deep-link `?intent=express` etc. |

---

## Métriques

| Event | Cible semaine 1 |
|-------|-----------------|
| % projets créés en express | Baseline notée manuellement (5 tests) |
| % import | Idem |

---

## Critères done

- [x] Copy EN + routing documentés.
- [ ] UX maquette statique (Figma ou markdown wire) — optionnel semaine 1.
- [ ] Eng ticket : 3-card layout création projet.
