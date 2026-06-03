# Implementation Plan: Grayed post-PRD shell (v0)

## Parent User Story

[Grayed post-PRD shell (v0)](../user-stories/fast-track-urgent--grayed-post-prd-shell--v0.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

In **project workspace** navigation, when `journeyMode === 'express'`, render post-PRD targets (feature-split, user-stories, test-first, delivery) as **disabled** with tooltip or inline message referencing **Approfondir** (`JourneyModeControls` — already shipped).

No backend changes unless nav permissions are server-enforced (prefer UI + route guard returning 403 with message if deep-linked).

---

## Layers Affected

- [x] `ui` — workspace shell / nav
- [x] `app` — optional route guard for express deep links

---

## Touched Files (predicted)

| Path | Operation |
|------|-----------|
| `project-workspace.tsx` or nav module | modify |
| Post-PRD route layouts | modify guard |

---

## Tests

- Express → links `aria-disabled` / no navigation
- Standard → prior behavior

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan | doc-sync |
