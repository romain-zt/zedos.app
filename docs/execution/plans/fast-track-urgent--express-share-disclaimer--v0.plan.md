# Implementation Plan: Express share disclaimer (v0)

## Parent User Story

[Express share disclaimer (v0)](../user-stories/fast-track-urgent--express-share-disclaimer--v0.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Read **PRD version classification** (`express` vs `standard`) on:

1. Anonymous share surface (existing read-only-sharing route/layout).
2. Owner in-app PRD reader.

Render persistent disclaimer component when `express`. Copy per PD-002 / PRD Configuration Matrix.

**Prerequisite:** express versions must be classified (`express-deliverable-generation`).

---

## Layers Affected

- [x] `ui` — share + owner PRD surfaces
- [ ] `contracts` — only if DTO missing express flag

---

## Touched Files (predicted)

| Path | Operation |
|------|-----------|
| Share read surface component | modify |
| Owner PRD view component | modify |
| `apps/web/public/messages/*/share.json` or equivalent | modify |

---

## Tests

- Fixture express version → disclaimer present
- Standard version → absent

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan | doc-sync |
