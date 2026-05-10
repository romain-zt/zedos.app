# Overnight Automation Checklist

Last updated: 2026-05-10 22:46 UTC+2 (local-agent pre-flight)

---

## What the pipeline will execute tonight

| Phase | Step | Plan / Scope file | Status | Expected PRs | Notes |
|-------|------|-------------------|--------|--------------|-------|
| 3 | P0 — Root scaffold | `docs/execution/plans/turborepo-migration--phase-0-scaffold.plan.md` | ✅ complete | PR #11 merged | `apps/web/` exists; pnpm workspace operational |
| 3 | P1 — Package extraction | `docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md` | 🔄 **NEXT** | 4 PRs (result → contracts → db → auth) | Pipeline fires this immediately |
| 3 | P2 — Drizzle ORM | `docs/execution/plans/turborepo-migration--phase-2-drizzle.plan.md` | ⏳ pending P1 | ~3 PRs (schema → repos → cleanup) | Fires when P1 complete |
| 3 | P3 — better-auth | `docs/execution/plans/turborepo-migration--phase-3-better-auth.plan.md` | ⏳ pending P2 | ~3 PRs (scaffold → wiring → cleanup) | Fires when P2 complete |
| 4 | FA-account-session S1 | `docs/product/scope-slices/account-session--sign-up-sign-in.md` | ⏳ pending P3 | ~2 PRs | Has NEED_HUMAN open items (Q-021, password-reset); agent will implement unambiguous ACs only |

**Total expected PRs tonight: ~12** (4 + 3 + 3 + 2)

---

## Pipeline control

### Kill switch

Set `ORCHESTRATOR_ENABLED=false` as a GitHub Actions variable to pause all autonomous phase advancement without touching any code. The orchestrator will exit 0 with a pause message on the next trigger.

To resume: set `ORCHESTRATOR_ENABLED=true` and push a commit to trigger the workflow.

### What triggers the orchestrator

`phase-orchestrator.yml` fires on every push to `main`. The orchestrator reads `docs/state/status.json` (keys `phase3.p0/p1/p2/p3` and `fa_account_session.slice1`) and fires the Cursor cloud agent for the first non-complete phase. It marks that phase as `in-progress` before firing (idempotency guard).

### What triggers PR un-drafting

`pr-cascade.yml` fires when a PR merges and un-drafts the next PR in the stack (detected by base-branch matching).

### What triggers PR merging

`pr-automation.yml` merges PRs that are: not draft, CI green, and not blocked by a human review request.

---

## If something goes wrong at 2am

1. Check `docs/state/status.json` — look at the `phase3.blocker` or `fa_account_session.blocker` field
2. Check `docs/state/HANDOFF.md` — the "Current Blocker" section will have a description of what failed
3. Check the GitHub Actions run log for the `phase-orchestrator.yml` workflow
4. Fix the blocker (this requires a human if the error is in source code or schema)
5. Clear the blocker field in `status.json`: set `phase3.p1 = "not-started"` (or whatever phase failed) and remove `phase3.blocker`
6. Commit + push to `main` to re-trigger the orchestrator
7. The orchestrator will re-fire the agent for that phase

**Alternative kill path:** Set `ORCHESTRATOR_ENABLED=false` → fix the blocker → set back to `true` → push.

---

## Morning review checklist

### Build health
- [ ] `pnpm -w run typecheck` passes with zero errors
- [ ] `pnpm -w run build` succeeds (Next.js build, all packages)
- [ ] `pnpm -w run test` — all tests green; no new test failures vs last night's baseline (83 tests)

### Code quality
- [ ] No new `as any` casts introduced by the overnight agents (grep: `grep -r 'as any' apps packages --include='*.ts' | wc -l` — should be ≤ 117, the known baseline)
- [ ] No `@prisma/client` imports in `apps/web/src/` after P2 (grep clean)
- [ ] No `next-auth` imports in `apps/web/src/` after P3 (grep clean)
- [ ] No `import { prisma } from` in any file after P2

### State file
- [ ] `docs/state/status.json` shows phases progressing correctly; `current_phase` reflects actual state
- [ ] No `blocked` status without a corresponding `blocker` message
- [ ] All PRs listed in status.json are findable on GitHub

### PRs
- [ ] All merged PRs have green CI history (no force-merge bypasses)
- [ ] No PR with >300 lines of diff that wasn't declared in a Plan (per `79-pr-sizing.mdc`)
- [ ] Draft PRs are un-drafted in the expected order (cascade is working)

### Architecture correctness
- [ ] `packages/result/` exists and exports `Result`, `ok`, `err` — no internal hand-rolled result
- [ ] `packages/contracts/` exists and `apps/web/src/contracts/` is deleted
- [ ] `packages/db/` exports Drizzle `db` client (after P2) — no `PrismaClient` in scope
- [ ] `packages/auth/` exports `auth`, `requireSession`, `requireUser` from better-auth (after P3)
- [ ] `packages/auth/src/plugins/api-key.ts` exists and is disabled (stub only)

### Human items that remain open after tonight
- [ ] Q-021: Is email verification required before first access? (blocks account-session S1 AC-11)
- [ ] Password reset scope: Included in sign-up-sign-in slice or separate? (blocks account-session S1 AC-12)
- [ ] Q-022: Session expiry + in-progress clarification data — preserved or lost? (blocks session-persistence slice)
- [ ] Phase 2b (credit/Stripe implementation): Still blocked on 5 PIS approval items — needs explicit `approved` from user

---

## Phase dependency map

```
Phase 0 (DONE)
    │
    ▼
Phase 1 — @repo/result, @repo/contracts, @repo/db, @repo/auth  [TONIGHT]
    │
    ▼
Phase 2 — Drizzle ORM (all 6 repos rewritten; SELECT FOR UPDATE on CreditRepo)  [TONIGHT]
    │
    ▼
Phase 3 — better-auth (NextAuth gone; API-key stub present)  [TONIGHT if P2 fast]
    │
    ▼
FA-account-session S1 — sign-up + sign-in via credentials  [TONIGHT if P3 fast]
    │
    ▼
FA-account-session S2 — session persistence + protected routes  [PENDING Q-022]
```

---

## Key file locations

| File | Purpose |
|------|---------|
| `docs/state/status.json` | Pipeline state machine — orchestrator reads this |
| `docs/state/HANDOFF.md` | Human-readable context + current blocker |
| `docs/state/overnight-checklist.md` | This file |
| `docs/execution/plans/turborepo-migration--phase-1-package-extraction.plan.md` | P1 exact file list |
| `docs/execution/plans/turborepo-migration--phase-2-drizzle.plan.md` | P2 Drizzle schema + repo rewrites |
| `docs/execution/plans/turborepo-migration--phase-3-better-auth.plan.md` | P3 better-auth setup |
| `docs/execution/user-stories/account-session--sign-up-sign-in--credentials-flow.md` | FA-account-session S1 ACs |
| `.github/scripts/phase-orchestrator.ts` | Orchestrator script (PHASE_PROMPTS live here) |
| `.github/workflows/phase-orchestrator.yml` | GH Actions trigger |
| `.github/workflows/pr-automation.yml` | Auto-merge workflow |
| `.github/workflows/pr-cascade.yml` | PR un-draft cascade |
