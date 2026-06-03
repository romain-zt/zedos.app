# User Story: Express deliverable generation (v0)

## Parent Scope Slice

[Express deliverable generation](../../product/scope-slices/fast-track-urgent--express-deliverable-generation.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder on an **express** project, I want **minimum IA** clarification and a **livrable express** (12 sections, lean content) so I can share a credible PRD the same day without completing the full standard loop.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Project `journeyMode = express` | I open clarify | I see the express / minimum IA path (fewer steps than standard) |
| AC-2 | Minimum IA complete (product rules) | I trigger generation | A new PRD version is created with **12 sections** + `title` / `version_summary` |
| AC-3 | Generation succeeds | I view the version | Content is **lean** per section; version is tagged **express** in workspace |
| AC-4 | Project is **standard** | I use clarify/generate | Standard **8-section** path unchanged (no express livrable) |
| AC-5 | Credits insufficient (post-grace) | I start a paid AI step | Operation blocked with recharge UX (same tiers as standard) |
| AC-6 | Projected first-circuit overage **> 20** | Pre-check runs | Operation does not start |
| AC-7 | Generation fails | I retry when credits allow | Error is visible; no corrupt partial version exposed as final |

---

## Test Plan

- [ ] Unit: express-only generation prompt/schema emits 12 sections
- [ ] Integration: clarify stream + generate stream on express project
- [ ] Contract: express version classification on DTO
- [ ] Credit: burn tiers 1/3/5/10/15 on express path

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web` clarify / generate stream flows | modify | Minimum IA + 12-section express output |
| PRD version model / DTO | modify | `express` classification |
| i18n dashboard copy | modify | Express generation states |

---

## Out of Scope

- Journey mode UI (`fast-track-urgent--declare-express-mode` — plan/US **executed** ; slice SS-11)
- Share disclaimer (`express-share-disclaimer`)
- Grayed post-PRD shell (`grayed-post-prd-shell`)

---

## Open Questions

_None — PD-002 and Q-025–Q-029 answered._

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US | doc-sync |
