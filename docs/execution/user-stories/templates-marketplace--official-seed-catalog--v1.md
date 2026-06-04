# User Story: Official Seed Catalog (v1)

## Parent Scope Slice

[templates-marketplace--official-seed-catalog](../../product/scope-slices/templates-marketplace--official-seed-catalog.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a **signed-in founder**, I want to **choose from official PRD templates** so that **I start from a credible structure instead of a blank doc**.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I meet prerequisites in the scope slice | I perform the primary action | The success outcome in the slice occurs |
| AC-2 | I am not authorized | I attempt the action | I receive a clear error without data leakage |
| AC-3 | A dependency in the slice is unmet | I attempt the action | I see a blocked or prerequisite message |

---

## Test Plan

- [ ] Unit tests for application use case (happy path)
- [ ] Contract tests for new zod schemas if any
- [ ] E2E or integration test for primary owner journey

---

## Out of Scope

See parent scope slice excluded behaviors.

---

## Blueprint

- Feature Area: **Templates marketplace**
- Generated: 2026-06-04 from blueprint backlog
