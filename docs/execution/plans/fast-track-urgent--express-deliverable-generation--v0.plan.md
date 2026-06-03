# Implementation Plan: Express deliverable generation (v0)

## Parent User Story

[Express deliverable generation (v0)](../user-stories/fast-track-urgent--express-deliverable-generation--v0.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Branch **clarify** and **generate-prd-stream** on `project.journeyMode === 'express'`:

1. **Minimum IA** — cap or shorten decision loop (product policy in prompt + server guard; not zero questions by default).
2. **Generation** — emit **12 sections** per PRD Configuration Matrix with lean content; persist `versionKind: express` (or equivalent) on PRD version.
3. **Credits** — reuse existing ledger hooks; same burn table as standard.

**Prerequisite:** [`fast-track-urgent--declare-express-mode`](../../product/scope-slices/fast-track-urgent--declare-express-mode.md) — plan/US **`executed`** ; slice file **`ready-for-user-stories`** (SS-11).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| AI inference | Abacus `gpt-4o-mini` (PRD Integration Boundaries) |
| Credits | Zedos ledger — pre-check grace gate |
| Transaction | Version insert after stream complete |

### Surface Blockers

- None

---

## Layers Affected

- [x] `application` — generation use case / flow guards
- [x] `infrastructure` — stream prompts, version persistence
- [x] `app` — route handlers for clarify/generate
- [x] `contracts` — express version flag on DTO if needed

---

## Touched Files (predicted)

| Path | Operation |
|------|-----------|
| Express generation prompt module | modify/add |
| `generate-prd-stream` flow | modify |
| Clarify stream flow | modify |
| PRD version schema / repository | modify |

---

## Tests

- Express project → 12 keys in stored JSON
- Standard project → 8 keys unchanged
- Credit pre-check on express generation start

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-03 | Draft plan | doc-sync |
