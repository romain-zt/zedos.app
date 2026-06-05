# Implementation Plan: Signed-in home orientation (v0 dashboard)

## Parent User Story

[Signed-in home orientation (v0 dashboard)](../user-stories/dashboard-shell--signed-in-home--home-orientation.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Session protection for `/dashboard/**` already exists via `middleware.ts` and a server layout guard. This slice only adjusts **presentation** in the dashboard shell and home page: copy that frames v0 as the PRD path, quick navigation toward `/dashboard/projects`, a concise “under construction” grid for deferred roadmap items per the Scope Slice, and removal of a prominent credit-balance stat from the home hero stats (credits remain reachable via sidebar and header per existing Credit FA surfaces). No new use cases, contracts, or API behavior. Client components stay in `app/dashboard/**`; types for project rows use read-only `import type` from the domain port interface where needed.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (existing) |
| Auth source-of-truth | better-auth |
| Async/sync boundary | synchronous per request |
| Transaction boundary | n/a |
| External dependencies | none added |
| Payment shape (if money) | n/a |

### Surface Blockers

- none

---

## Layers Affected

- [ ] `domain` — none
- [ ] `application` — none
- [ ] `contracts` — none
- [ ] `infrastructure` — none
- [x] `app` (routes, server components) — dashboard home + shell components (middleware/layout session guard unchanged)
- [x] `ui` — dashboard shell + home page (as client components under `app/`)
- [ ] `shared` — none

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/dashboard/page.tsx` | modify | v0 banner, stats without credit hero tile, under-construction section; typed project list |
| `apps/web/app/dashboard/_components/dashboard-shell.tsx` | modify | “Coming soon” labels aligned with slice; remove unused imports if any |
| `apps/web/package.json` | modify | Run `prisma generate` before `next build` so route collection succeeds in CI |
| `docs/execution/user-stories/dashboard-shell--signed-in-home--home-orientation.md` | add | Governance |
| `docs/execution/plans/dashboard-shell--signed-in-home--home-orientation.plan.md` | add | Governance |
| `docs/state/status.json` | modify | Orchestration step complete |
| `docs/state/HANDOFF.md` | modify | Phase / next action |

---

## Contracts Changed

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
| n/a | — | — |

---

## Migrations

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
| n/a | — | — |

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| Manual steps in User Story | e2e / manual | AC-1–AC-5 |
| `pnpm typecheck` | integration | Workspace compiles |
| `pnpm build` | integration | Next.js production build |

---

## Dependencies Added

- none

---

## Rollback

Revert the listed `apps/web` files and docs/state commits; no migrations or data changes.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users miss credit count on home | low | low | Credits remain in nav + `CreditBadge` |

---

## Out of Scope (deliberate)

- New project or PRD features
- Middleware matcher changes
- Credit system behavior changes

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Presentation-only; no boundary crossings |
| scope-critic | PASS | Matches Scope Slice included/excluded lists |

---

## Approval

- [x] User reviewed and approved this Plan (orchestrator cloud-agent mandate)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan | cloud-agent |
