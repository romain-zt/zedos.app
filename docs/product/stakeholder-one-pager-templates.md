Owner : Product — Priorité : 🟠 — Mois 1

> **Dépendances :** sections PRD express/standard. Export PDF hors scope — **Markdown** copiable.

# Stakeholder one-pagers — 3 templates

## Usage

Depuis une version PRD, fondateur copie le template, remplit les `{{placeholders}}` depuis les sections Zedos, exporte ou envoie par email.

---

## Template A — Investisseur (5 min read)

```markdown
# {{product_name}} — Investor snapshot
*Source: Zedos PRD v{{version}} · {{date}} · {{express_or_standard}}*

## TL;DR
{{executive_summary — 5 lines max}}

## Problem & insight
{{vision — problem paragraph}}

## Market & users
{{target_users — 1 persona}}

## Solution & MVP
{{core_features — 3 bullets}}

## Business model
{{business_model}}

## Why us
{{differentiation}}

## Traction & metrics
{{success_metrics}}

## 90-day plan
{{timeline}}

## Risks (honest)
{{risks — top 2}}

## Ask
{{fundraising_ask — e.g. €300k pre-seed}}

---
*Express livrable — sections marked "to be deepened" in full PRD.*
```

---

## Template B — Associé technique (build alignment)

```markdown
# {{product_name}} — Tech one-pager

## What we're building
{{vision — 3 sentences}}

## Users & core flows
{{user_journeys — 1 happy path}}

## MVP scope
{{core_features}}

## Stack & constraints
{{technical}}

## Explicitly NOT building (v1)
{{out_of_scope}}

## Open technical questions
{{risks — technical items}}

## Handoff
Cursor package: {{link_to_delivery_or_repo}}

## Next decision needed from you
- [ ] {{decision_1}}
- [ ] {{decision_2}}
```

---

## Template C — Associé business (GTM / ops)

```markdown
# {{product_name}} — Business one-pager

## Customer
{{target_users}}

## Value prop (one sentence)
{{vision — solution sentence}}

## Revenue
{{business_model}}

## Go-to-market (90 days)
{{timeline — GTM lines}}

## Success metrics
{{success_metrics}}

## Partnerships / risks
{{risks — market items}}

## What I need from you this week
1. {{ask_1}}
2. {{ask_2}}
```

---

## Mapping sections Zedos → template

| Section ID | Inv | Tech | Biz |
|------------|-----|------|-----|
| executive_summary | ✓ | | |
| vision | ✓ | ✓ | ✓ |
| target_users | ✓ | | ✓ |
| core_features | ✓ | ✓ | |
| user_journeys | | ✓ | |
| technical | | ✓ | |
| success_metrics | ✓ | | ✓ |
| business_model | ✓ | | ✓ |
| differentiation | ✓ | | |
| timeline | ✓ | | ✓ |
| out_of_scope | | ✓ | |
| risks | ✓ | ✓ | ✓ |

---

## Critères done

- [x] 3 templates MD.
- [ ] Bouton in-app « Copy investor one-pager » (backlog).
