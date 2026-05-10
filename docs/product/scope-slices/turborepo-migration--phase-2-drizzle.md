<!--
  Scope Slice — Turborepo Migration Phase 2: Prisma → Drizzle
  Parent Feature Area: turborepo-migration
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Scope Slice: Turborepo Migration — Phase 2: Drizzle ORM

## Parent Feature Area

[Turborepo migration](../feature-areas/turborepo-migration.md)

## Status

`exploratory`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

The codebase uses Drizzle ORM for all database access — the locked-decision post-migration target — giving engineers a type-safe, zero-codegen persistence layer that works in both Node.js and edge runtimes, with explicit SQL migrations committed to version control, and a transaction pattern that directly prevents the credit-ledger double-spend documented in retro finding #24.

---

## Exact Boundary

### Included Behavior

- `packages/db/` re-structured for Drizzle: `drizzle.config.ts` added; `src/schema/` with per-context files (`auth.ts`, `credits.ts`, `projects.ts`, `share.ts`, `feedback.ts`, `purchases.ts`); Drizzle `db` client factory at `src/client.ts`; package exports updated
- Prisma schema at `packages/db/prisma/schema.prisma` converted to equivalent Drizzle schema (same tables, same columns, same constraints); the Prisma schema file and `@prisma/client` dependency are removed from `packages/db/`
- Drizzle migration baseline generated via `drizzle-kit generate`; `packages/db/src/migrations/0000_baseline.sql` committed; `drizzle-kit migrate` documents how to apply
- Repository adapters in `apps/web/src/infrastructure/persistence/` rewritten from Prisma to Drizzle: `UserRepository`, `ProjectRepository`, `PrdRepository`, `CreditRepository`, `ShareRepository`, `FeedbackRepository`
- The credit ledger `CreditRepository` uses a Drizzle `db.transaction(async (tx) => { … })` block with `tx.execute(sql\`SELECT … FOR UPDATE\`)` on the user row — directly fixing retro finding #24 (concurrency-unsafe ledger)
- `apps/web/lib/prisma.ts` deleted; all `import { prisma }` in `apps/web/src/` replaced with Drizzle `db` client via the composition root
- `drizzle-kit studio` documented in `packages/db/README.md`
- `@repo/db` package version bumped; changelog entry added via `changeset add`

### Excluded Behavior

- Migrating NextAuth → better-auth (Phase 3 — Drizzle adapter wiring for better-auth is Phase 3; this slice uses Drizzle with a manually constructed session query until better-auth lands)
- Changing any route handlers, use-case logic, or application contracts — only the persistence adapters change
- Moving `components/` to `packages/ui`
- Adding new Drizzle migrations beyond the baseline (new schema changes are new slices)
- Changing the `purchases` or `stripe_event_idempotency` tables (addressed in a separate credits/payments slice)

---

## UX States

No end-user UX. Engineering-facing states:

| State | When | What the engineer sees / experiences |
|-------|------|---------------------------------------|
| Drizzle schema matches Prisma | After conversion | Running `drizzle-kit check` against the database shows zero schema drift |
| Migration baseline applied | After `drizzle-kit migrate` | `packages/db/src/migrations/` contains `0000_baseline.sql`; schema matches existing database |
| Repositories compile | After rewrite | `tsc --noEmit` on `apps/web/` passes; no Prisma client imports remain in `src/` |
| Credit ledger safe | After `CreditRepository` rewrite | Integration test: two concurrent deductions from the same user balance produce exactly one deduction each (SELECT FOR UPDATE serializes them) |
| All unit tests pass | After all | Existing 9 unit tests pass; new `CreditRepository` integration test added |
| No Prisma runtime | After cleanup | `@prisma/client` removed from `packages/db/package.json`; `pnpm build` succeeds |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| `packages/db/` | Modified | Drizzle config + schema added; Prisma schema + client removed |
| `apps/web/src/infrastructure/persistence/*Repository.ts` | Modified (6 files) | Rewritten from Prisma to Drizzle adapters |
| `apps/web/lib/prisma.ts` | Deleted | Replaced by Drizzle `db` client from `@repo/db` |
| `packages/db/src/migrations/0000_baseline.sql` | Created | Drizzle migration baseline |
| `packages/db/drizzle.config.ts` | Created | Drizzle Kit config |

---

## Credit / Payment Impact

The credit deduction flow is structurally changed: `CreditRepository.deductCredits()` now wraps in a Drizzle transaction with `SELECT … FOR UPDATE`, preventing the double-spend race condition. The business logic (grace semantics, overage ceiling) is unchanged — only the persistence mechanism becomes safe.

---

## Sharing / Privacy Impact

None — no sharing or privacy boundary changes in this slice.

---

## Feedback / Instrumentation Impact

None — no feedback prompt or attribution in this slice.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Phase 0 scaffold complete | Scope Slice | pending | `apps/web/` must exist; pnpm workspace operational |
| Phase 1 package extraction complete | Scope Slice | pending | `@repo/db` package must exist; `packages/db/` must be the home of the Prisma schema before Drizzle conversion |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| Phase 1 not yet executed | All sub-steps | false |

---

## Acceptance-Level Outcome

The application starts with zero Prisma runtime code. All six persistence repositories use Drizzle. The credit deduction repository wraps its balance update in a Drizzle transaction with a row-level lock, and an integration test confirms that two concurrent deductions on the same user account produce correct serialized outcomes. `drizzle-kit check` exits 0 against the target database. `pnpm build` succeeds.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [ ] UX states enumerated (engineering-facing only — acceptable for migration slice)
- [x] Business objects named
- [x] Credit / payment impact assessed (concurrency fix scoped here)
- [x] Sharing / privacy surface assessed (none)
- [x] Feedback / instrumentation impact assessed (none)
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral

**Verdict:** NOT READY — depends on Phase 1 executing first. Promote to ready-for-user-stories after Phase 1 merges.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Initial scaffold from `docs/retro/zedos-monorepo-retro.md` §6 Phase 2 and `.cursor/rules/75-drizzle.mdc` | Cloud Agent |
