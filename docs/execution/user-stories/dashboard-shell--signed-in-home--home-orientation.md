# User Story: Signed-in home orientation (v0 dashboard)

## Parent Scope Slice

[Signed-in home orientation](../../product/scope-slices/dashboard-shell--signed-in-home.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder, I want a clear home base after sign-in that routes me toward projects and PRD work and labels non-v0 areas as under construction, so I am not confused about what ships today versus later.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I have a valid session | I open the signed-in home (`/dashboard`) | I see orientation copy that states v0 is focused on the PRD path and see primary entry points toward projects / PRD workflow |
| AC-2 | I have projects | I view the home | I see a recent-projects summary with paths into project workspace |
| AC-3 | I have no projects yet | I view the home | I see an empty state that invites me to create a first project and links or buttons toward projects |
| AC-4 | Any surface | I view the home or the dashboard sidebar | Deferred roadmap items (e.g. services split, Cursor packaging, user stories, test-first delivery) are visibly marked as under construction or coming soon and are not presented as available features |
| AC-5 | I have no session | I request `/dashboard` | I am redirected to sign-in with a return path (handled by existing middleware; home does not break this) |

---

## Test Plan

- [ ] Manual: signed-in user sees v0 banner, stats, and under-construction section on `/dashboard` (manual)
- [ ] Manual: unauthenticated `/dashboard` redirects to `/sign-in?from=...` (manual)
- [ ] `pnpm typecheck` + `pnpm build` pass (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/page.tsx` | modify | Home orientation, stats, under-construction area |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | Sidebar labels aligned with slice; navigation |
| `apps/web/app/dashboard/layout.tsx` | modify | Optional: redirect query parity with middleware |
| `docs/execution/plans/...` | new | Implementation plan |

---

## Out of Scope

- Project CRUD UI beyond links and existing flows (Project Workspace FA)
- PRD editor / versioning UI (PRD Versioning FA)
- Credit balance as a hero metric on the home surface (Credit System FA owns dedicated surfaces; slice says no credit prompts on shell)
- New API routes or persistence changes

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | — | — | — |

---

## Decision References

- none (PRD v0 scope and Feature Area `dashboard-shell.md`)

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial story for FA dashboard shell slice 1 | cloud-agent |
