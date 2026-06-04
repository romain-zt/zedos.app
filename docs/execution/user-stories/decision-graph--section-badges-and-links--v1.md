# User Story: Section Badges And Links (v1)

## Parent Scope Slice

[decision-graph--section-badges-and-links](../../product/scope-slices/decision-graph--section-badges-and-links.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a **signed-in founder**, I want to **see which PRD sections are backed by recorded decisions** so that **I know where the document is evidence-backed vs assumed**.

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

- Feature Area: **Decision graph**
- Generated: 2026-06-04 from blueprint backlog
