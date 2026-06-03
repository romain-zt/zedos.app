# User Story: Express share disclaimer (v0)

## Parent Scope Slice

[Express share disclaimer](../../product/scope-slices/fast-track-urgent--express-share-disclaimer.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a founder or anonymous viewer, I want to see **version express — à approfondir** whenever an **express** PRD version is shown so that readers do not mistake it for a fully deepened PRD.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | Shared version is **express** | Anonymous opens read-only link | Banner (or equivalent) shows **version express — à approfondir** without scrolling past entire PRD |
| AC-2 | I am signed-in owner viewing **express** version | I open PRD in workspace | Same disclaimer visible (owner-appropriate tone allowed) |
| AC-3 | Version is **standard** | Share or owner view | No express disclaimer |
| AC-4 | Owner switches shared version to express | Visitor refreshes | Disclaimer appears for new shared express version |

---

## Test Plan

- [ ] UI: disclaimer on share page for express classification
- [ ] UI: disclaimer on owner PRD view
- [ ] Regression: standard share unchanged

---

## Touched Files (predicted)

| Path | Change type | Reason |
|------|-------------|--------|
| Anonymous share page component | modify | Disclaimer when `express` |
| Owner PRD view component | modify | Disclaimer |
| i18n messages EN (FR when locale ships) | modify | Copy PD-002 |

---

## Out of Scope

- Mint/revoke share links
- Express generation / classification logic (depends on `express-deliverable-generation`)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft US | doc-sync |
