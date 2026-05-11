# User Story: Deferred roadmap labels (under-construction placeholders)

## Parent Scope Slice

[Under-construction placeholders](../../product/scope-slices/dashboard-shell--under-construction-placeholders.md)

## Status

`done`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want every deferred roadmap area on the dashboard to look clearly “under construction” and to never send me to a missing screen, so I trust what v0 includes versus what is still planned.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I have a valid session | I view `/dashboard` | I see all deferred roadmap areas (including services/feature split, Cursor packaging, user stories & delivery, test-first workflows, architecture analysis) with the same honest “under construction” visual language as other placeholders |
| AC-2 | I have a valid session | I view the dashboard sidebar | Deferred roadmap rows match that same visual language and do not read as normal navigation to shipped features |
| AC-3 | Any dashboard surface | I activate (hover, focus, or tap where supported) a deferred roadmap placeholder | I get a short confirmation that it is not available in v0, and I am not navigated to a non-existent route |
| AC-4 | Any dashboard surface | I interact with a deferred placeholder | No route change occurs for that interaction |

---

## Test Plan

- [ ] Manual: signed-in `/dashboard` shows the full deferred list with consistent styling (manual)
- [ ] Manual: sidebar “under construction” rows show tooltip / unavailable messaging without navigation (manual)
- [ ] `pnpm typecheck` + `pnpm build` pass (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/_lib/deferred-roadmap-placeholders.ts` | new | Shared copy + list for home and shell |
| `apps/web/app/dashboard/page.tsx` | modify | Home grid uses shared placeholders + tooltips |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Sidebar uses shared placeholders + tooltips |
| `docs/execution/plans/...` | new | Implementation plan |

---

## Out of Scope

- Building deferred pipeline features (only labeling)
- Waitlists, marketing animations, or operator toggles
- Changes to credits, projects, or PRD functionality

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | — | — | — |

---

## Decision References

- Parent Feature Area `docs/product/feature-areas/dashboard-shell.md`
- Scope Slice `docs/product/scope-slices/dashboard-shell--under-construction-placeholders.md`

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover UX states from the parent Scope Slice
- [x] Test plan names test type for each item
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] Open Questions empty or actionable
- [x] Decision references present

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial story for slice 2 orchestration step | cloud-agent |
