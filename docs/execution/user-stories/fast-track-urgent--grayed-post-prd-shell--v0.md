# User Story: Grayed post-PRD shell (v0)

## Parent Scope Slice

[Grayed post-PRD shell](../../product/scope-slices/fast-track-urgent--grayed-post-prd-shell.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a founder on an **express** project, I want post-PRD destinations (feature split, user stories, test-first, delivery) to stay **visible but disabled** with clear copy so I know what comes later and how to **Approfondir** into standard mode.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Project `journeyMode = express` | I view project shell / nav | Feature split, user stories, test-first, delivery entries are **visible** and **not clickable** |
| AC-2 | AC-1 | I focus a grayed entry | Copy explains express deferral and points to **Approfondir** / standard |
| AC-3 | I switch project to **standard** | Shell reloads | Grayed treatment **removed** (enabled/under-construction per global rules) |
| AC-4 | Project is **standard** | I view shell | This slice’s grayed rules do **not** apply |
| AC-5 | Express project, no PRD yet | I open shell | Post-PRD still grayed (no shortcut) |

---

## Test Plan

- [ ] Component: express mode → disabled nav items + message
- [ ] Component: standard mode → no express grayed class
- [ ] E2E: switch Approfondir → post-PRD items become navigable per product rules

---

## Touched Files (predicted)

| Path | Change type | Reason |
|------|-------------|--------|
| `project-workspace` nav / tabs | modify | Grayed state from `journeyMode` |
| i18n copy | modify | PD-002 messages |

---

## Out of Scope

- Implementing post-PRD pipeline outputs (FG-POST-PRD-V1 behavior)
- Hiding nav items in express mode

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US | doc-sync |
