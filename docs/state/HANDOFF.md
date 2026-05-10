---
type: state-handoff
date: 2026-05-10
author: local-agent (pre-cloud handoff)
workspace: /Users/romainpiveteau/Projects/ZedTech/zedos.app
status: handoff-ready
---

# Cloud Agent State Handoff

This document captures the **complete project state** so a Cursor Cloud Agent can resume execution autonomously. Read this file first, then read the files listed in §9 (Key File Inventory) to reconstruct full context.

---

## 1. Project Overview

**Zedos** is a web product for solo founders who use AI to ship and validate a market idea. v0 delivers: guided clarification, versioned in-app PRD, question history, credit-metered AI (Stripe), and read-only sharing. See `docs/prd/PRD.md` for the full product definition.

**Stack (current, pre-migration):** Next.js App Router, Prisma, NextAuth, Stripe, AbacusAI. Source code lives at `zedos/nextjs_space/`.

**Stack (post-Phase 3 target):** pnpm + Turborepo + Changesets, Drizzle ORM, better-auth, `apps/web/` + `packages/*`.

---

## 2. Phase Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **0 — Secret rotation** | `in-progress` (USER-OWNED) | 3 secrets leaked in `zedos/nextjs_space/.env`. User must rotate at providers. |
| **1 — Execution-side .cursor/** | `complete` | ~102 files: 16 rules, 23 agents, 22 skills, 15 commands, 14 templates, 4 checkers, 6 hook files, hooks.json, statusline.sh, README.md |
| **Rules merge** | `COMPLETE` | `zedos/.cursor/rules/` merged into root `.cursor/rules/72-74*.mdc` and deleted. Single source of truth at root. |
| **2a — Credit/Stripe planning** | `complete` | Scope Slice, User Story, Implementation Plan, and friction log all authored and on disk. |
| **2b — Implementation** | `blocked-on-pis-approval` | 4-PR stack (~38 files, ~900 lines). Blocked on 5 PIS approval items. See §4. |
| **3 — Turborepo migration** | `pending` | Move `zedos/nextjs_space/` → `apps/web/`, extract packages, migrate Prisma→Drizzle, NextAuth→better-auth. |
| **4 — Next Feature Areas** | `pending` | FA-account-session → FA-dashboard-shell → FA-prd-versioning → FA-guided-clarification → FA-credit-system (full). |

---

## 3. Rules Merge — COMPLETE

The `zedos/.cursor/rules/` directory has been merged and deleted. All architecture prose is now inline in the root `.cursor/rules/` files:

| Former file | Merged into |
|---|----|
| `01-architecture-layers.md` | `72-hexagonal-boundaries.mdc` §2 (layer definitions) |
| `02-result-type-rOP.md` | `73-result-rop.mdc` §2–§11 (full ROP pattern) |
| `03-sdk-wrapping-pattern.md` | `72-hexagonal-boundaries.mdc` §4 (SDK wrapping) |
| `04-no-business-logic-in-routes.md` | `72-hexagonal-boundaries.mdc` §5 (route constraints) |
| `05-contracts-zod-source-of-truth.md` | `74-contracts-zod.mdc` §3–§10 (full contracts pattern) |
| `index.md`, `README.md`, `.cursor-rules-manifest.json` | Deleted (no longer needed) |

Single source of truth: `.cursor/rules/` only. All cross-references in agents, skills, and commands updated.

---

## 4. Patch Intent Summary — PENDING APPROVAL (5 Blockers)

The PIS was delivered in chat but requires explicit `approved` from the user on each of these 5 items. **Do NOT start Phase 2b implementation until all 5 are approved.**

### Blocker 1: Parent FA `NEED_HUMAN` carve-out

`FA-credit-system` is `exploratory` + `NEED_HUMAN: true` because:
- **B-003** — Starter credit grant X is operator-tunable / TBD (Q-008)
- **B-004** — Directional burn-tier table is product assumption — commitment for launch UX / metering expectations undecided

**Both are commercially orthogonal** to the structural-safety fix (concurrency + webhook). This slice changes no product-visible behavior that depends on either blocker. The user must explicitly accept that this slice proceeds despite the parent FA `NEED_HUMAN: true`.

**Proposed default:** Proceed with carve-out. The fix is structural correctness only.

### Blocker 2: OQ-2 — Does reversal restore `graceUsed`?

When AI fails between deduct and stream completion, should `reverseCredits` also clear `User.graceUsed = false`? PRD Q-014/Q-019 are silent on the rollback case.

**Proposed default:** NO — grace consumed on attempt. Reversal restores credits but leaves `graceUsed = true`. Matches PRD anti-abuse intent ("grace applies once during the first PRD circuit only").

### Blocker 3: OQ-3 — Placeholder vs real Stripe sandbox fixtures

Contract tests need captured Stripe sandbox payloads. Does the user have a Stripe sandbox account ready, or should PR #1 ship placeholder fixtures?

**Proposed default:** Placeholder fixtures derived from Stripe API reference docs, with `TODO:` to swap for real captured payloads before the Foundation PR merges.

### Blocker 4: OQ-4 — `correlation_id` source

AI route refactor needs a deterministic correlation ID for idempotency.

**Proposed default:** Server-supplied — `<projectId>--<opType>--<crypto.randomUUID()>`. Returned in streamed response header. Client-supplied IDs deferred to better-auth API-key plan.

### Blocker 5: 4-PR stack shape

The work exceeds `79-pr-sizing.mdc` §2 limits in aggregate (~38 files / ~900 lines / 5 layers). Proposed split:

```
main
└── feature/credits-foundation              (PR #1 — schema + contracts + harness)
    └── feature/credits-concurrency         (PR #2 — lib + repo refactor + integration tests)
        └── feature/credits-stripe-webhook  (PR #3 — webhook route + verify decoupling)
            └── feature/credits-ai-deduct   (PR #4 — clarify + generate-prd refactor)
```

| PR | Files | Lines | Layers | Tests |
|----|------:|------:|-------:|------:|
| #1 Foundation | 14 | ~280 | 3 | 2 contract + harness |
| #2 Concurrency | 12 | ~340 | 3 | 4 unit + 1 concurrent integration |
| #3 Webhook | 8 | ~220 | 3 | 1 unit + 2 integration |
| #4 AI deduct | 4 | ~120 | 1 | 2 integration |

**Proposed default:** 4-PR stacked pattern per `79-pr-sizing.mdc` §4.

---

## 5. Secret Rotation — Phase 0 (USER-OWNED)

Three secrets were leaked in `zedos/nextjs_space/.env` (the file is tracked by git based on the `?? zedos/` untracked status in git):
1. **Database password** (Postgres connection string)
2. **NEXTAUTH_SECRET**
3. **ABACUSAI_API_KEY**

**Status:** User is responsible for rotation at providers. NOT confirmed complete.

**Cloud agent pre-push checklist:**
- Verify no `.env` file containing real secrets exists in the commit tree
- Verify `.env` is in `.gitignore`
- If `.env` exists and contains real values, do NOT push. Alert the user.
- The Implementation Plan creates `.env.example` (documenting required vars without real values) — this IS safe to commit.

Additionally, the Implementation Plan requires a NEW env var: `STRIPE_WEBHOOK_SECRET` (Stripe Dashboard → Developers → Webhooks → signing secret).

---

## 6. Locked Decisions (DO NOT re-litigate)

| Decision | Choice | Phase |
|----------|--------|-------|
| Auth framework | better-auth (NOT NextAuth, NOT Clerk). API keys in v2/v3. | Phase 3 migration |
| ORM | Drizzle (migration from Prisma) | Phase 3 migration |
| Monorepo tooling | pnpm + Turborepo + Changesets + syncpack | Phase 3 |
| Architecture | Hexagonal layers, Result<T,E> RoP, contracts-as-zod | All phases |
| Framework | Next.js App Router | All phases |
| Phase 2 stack | Stays on Prisma + NextAuth — migration is Phase 3 | Phase 2 |
| ESLint cleanup | Separate slice (not Phase 2) | TBD |
| 117 `as any` cleanup | Separate technical-debt slice | TBD |
| Dual credit implementation | Consolidation deferred per Implementation Plan | Post-Phase 2 |

---

## 7. Git State

**Uncommitted changes (as of handoff):**

Modified files (tracked):
- `.cursor/agents/feature-area/feature-area-lead.md`
- `.cursor/agents/feature-area/scope-critic.md`
- `.cursor/agents/prd/prd-challenger.md`
- `.cursor/agents/prd/prd-lead.md`
- `.cursor/agents/prd/prd-researcher.md`
- `.cursor/hooks.json`
- `.cursor/rules/00-siso.mdc`
- `.cursor/rules/execution-loop.mdc`
- `.cursor/skills/execution-loop/SKILL.md`
- `.cursor/skills/prd/prd-builder/SKILL.md`

Deleted files:
- `.cursor/hooks/before-submit-prompt.mdc`

New untracked files/directories:
- `.cursor/README.md`
- `.cursor/agents/execution/` (entire directory — 16 agents)
- `.cursor/checkers/` (4 checkers)
- `.cursor/commands/` (babysit, commit, explore, fix, implement, improve-config, plan, pr, review, split)
- `.cursor/hooks/` (5 new hook scripts + README)
- `.cursor/rules/70-80*.mdc` (11 new rules)
- `.cursor/skills/execution/` (14 skills)
- `.cursor/skills/prd/prd-builder/` (4 supporting files)
- `.cursor/statusline.sh`
- `.cursor/templates/execution/` (5 templates)
- `docs/execution/` (plan + user story)
- `docs/product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md`
- `docs/retro/` (3 retro files)
- `zedos/` (entire source directory — untracked)

---

## 8. Execution Governance Files

These files track the execution loop state:

| File | Purpose |
|------|---------|
| `docs/WORK_QUEUE.md` | Feature Area / Scope Slice work queue |
| `docs/BLOCKERS.md` | Active blockers with scope and resolution |
| `docs/EXECUTION_LOG.md` | Append-only execution log |
| `docs/EXECUTION_LOCK.md` | Current execution lock state |
| `docs/POINTS_OF_ATTENTION.md` | Items requiring attention |

---

## 9. Key File Inventory (read order)

**Read these files to reconstruct full context. Order matters.**

### Governance (read first)
1. `.cursor/rules/00-siso.mdc` — request quality + mode classification
2. `.cursor/rules/80-change-policy.mdc` — what each mode can write
3. `.cursor/rules/70-execution-bridge.mdc` — Scope Slice → code bridge
4. `.cursor/rules/feature-area-workflow.mdc` — discovery hierarchy
5. `.cursor/rules/execution-loop.mdc` — autonomous loop boundaries
6. `.cursor/rules/79-pr-sizing.mdc` — PR limits + stacked pattern

### Architecture rules
7. `.cursor/rules/71-monorepo-context.mdc` — layout in effect (pre- vs post-migration)
8. `.cursor/rules/72-hexagonal-boundaries.mdc` — layer boundaries
9. `.cursor/rules/73-result-rop.mdc` — Result<T,E> + frozen violations
10. `.cursor/rules/74-contracts-zod.mdc` — contracts-as-zod
11. `.cursor/rules/75-drizzle.mdc` — Drizzle (§7: Prisma transitional)
12. `.cursor/rules/76-better-auth.mdc` — better-auth (§7: NextAuth transitional)
13. `.cursor/rules/77-nextjs.mdc` — Next.js App Router conventions
14. `.cursor/rules/78-testing.mdc` — testing strategy + concurrent test mandate

### Product
15. `docs/prd/PRD.md` — active product definition
16. `docs/prd/state.md` — PRD version + direction
17. `docs/prd/questions/open-questions.md` — unresolved product questions
18. `docs/prd/history.md` — PRD version history

### Feature Areas (13 files)
19. `docs/product/feature-areas/account-session.md`
20. `docs/product/feature-areas/credit-system.md`
21. `docs/product/feature-areas/dashboard-shell.md`
22. `docs/product/feature-areas/guided-clarification.md`
23. `docs/product/feature-areas/owner-milestone-feedback.md`
24. `docs/product/feature-areas/payments.md`
25. `docs/product/feature-areas/prd-versioning.md`
26. `docs/product/feature-areas/project-workspace.md`
27. `docs/product/feature-areas/question-history.md`
28. `docs/product/feature-areas/read-only-sharing.md`

### Scope Slices (3 files)
29. `docs/product/scope-slices/credit-system--ledger-concurrency-and-stripe-webhook.md` — **ACTIVE SLICE**
30. `docs/product/scope-slices/account-session--signup-to-signed-in-dashboard.md`
31. `docs/product/scope-slices/account-session--returning-owner-sign-in.md`

### Execution artifacts (active)
32. `docs/execution/user-stories/credit-system--ledger-concurrency-and-stripe-webhook--phase-3-fixes.md` — User Story (status: `ready-for-implementation`)
33. `docs/execution/plans/credit-system--ledger-concurrency-and-stripe-webhook--phase-3-fixes.plan.md` — Implementation Plan (status: `proposed`)

### Retros
34. `docs/retro/zedos-monorepo-retro.md` — full codebase retro (52 findings)
35. `docs/retro/cursor-setup-retro.md` — .cursor/ infrastructure retro (42 findings)
36. `docs/retro/phase2a-friction-log.md` — 14 friction items from Phase 2a dogfood

### Execution loop state
37. `docs/WORK_QUEUE.md`
38. `docs/BLOCKERS.md`
39. `docs/EXECUTION_LOG.md`
40. `docs/EXECUTION_LOCK.md`
41. `docs/POINTS_OF_ATTENTION.md`

### Product decisions
42. `docs/product-decisions/README.md`

---

## 10. Full .cursor/ Artifact Inventory

### Rules (16 files)
- `.cursor/rules/00-siso.mdc`
- `.cursor/rules/10-prd-discovery.mdc`
- `.cursor/rules/11-prd-question-loop.mdc`
- `.cursor/rules/70-execution-bridge.mdc`
- `.cursor/rules/71-monorepo-context.mdc`
- `.cursor/rules/72-hexagonal-boundaries.mdc`
- `.cursor/rules/73-result-rop.mdc`
- `.cursor/rules/74-contracts-zod.mdc`
- `.cursor/rules/75-drizzle.mdc`
- `.cursor/rules/76-better-auth.mdc`
- `.cursor/rules/77-nextjs.mdc`
- `.cursor/rules/78-testing.mdc`
- `.cursor/rules/79-pr-sizing.mdc`
- `.cursor/rules/80-change-policy.mdc`
- `.cursor/rules/execution-loop.mdc`
- `.cursor/rules/feature-area-workflow.mdc`

### Agents (23 files)

**Execution agents (16):**
- `.cursor/agents/execution/README.md`
- `.cursor/agents/execution/architect.md`
- `.cursor/agents/execution/implementer.md`
- `.cursor/agents/execution/verifier.md`
- `.cursor/agents/execution/reviewer.md`
- `.cursor/agents/execution/domain-guardian.md`
- `.cursor/agents/execution/monorepo-explorer.md`
- `.cursor/agents/execution/monorepo-analyst.md`
- `.cursor/agents/execution/test-runner.md`
- `.cursor/agents/execution/bugfix.md`
- `.cursor/agents/execution/improver.md`
- `.cursor/agents/execution/drizzle-persistence.md`
- `.cursor/agents/execution/nextjs-routes.md`
- `.cursor/agents/execution/auth-better-auth.md`
- `.cursor/agents/execution/event-contracts.md`
- `.cursor/agents/execution/security-pii.md`

**Feature Area agents (3):**
- `.cursor/agents/feature-area/README.md`
- `.cursor/agents/feature-area/feature-area-lead.md`
- `.cursor/agents/feature-area/scope-critic.md`

**PRD agents (4):**
- `.cursor/agents/prd/README.md`
- `.cursor/agents/prd/prd-lead.md`
- `.cursor/agents/prd/prd-challenger.md`
- `.cursor/agents/prd/prd-researcher.md`

### Skills (22 files)

**Execution skills (15):**
- `.cursor/skills/execution/README.md`
- `.cursor/skills/execution/add-server-action/SKILL.md`
- `.cursor/skills/execution/add-route-handler/SKILL.md`
- `.cursor/skills/execution/add-page-route/SKILL.md`
- `.cursor/skills/execution/add-usecase/SKILL.md`
- `.cursor/skills/execution/add-driven-adapter/SKILL.md`
- `.cursor/skills/execution/add-driving-endpoint/SKILL.md`
- `.cursor/skills/execution/add-drizzle-migration/SKILL.md`
- `.cursor/skills/execution/add-better-auth-flow/SKILL.md`
- `.cursor/skills/execution/add-zod-contract/SKILL.md`
- `.cursor/skills/execution/add-test/SKILL.md`
- `.cursor/skills/execution/explore-monorepo/SKILL.md`
- `.cursor/skills/execution/improve-from-review/SKILL.md`
- `.cursor/skills/execution/improve-config/SKILL.md`
- `.cursor/skills/execution/split-technical-story/SKILL.md`

**PRD skills (5):**
- `.cursor/skills/prd/prd-builder/SKILL.md`
- `.cursor/skills/prd/prd-builder/persistence.md`
- `.cursor/skills/prd/prd-builder/ice-scoring.md`
- `.cursor/skills/prd/prd-builder/feature-group-template.md`
- `.cursor/skills/prd/prd-builder/surface-gate.md`

**Other skills (2):**
- `.cursor/skills/execution-loop/SKILL.md`
- `.cursor/skills/feature-area/feature-area-builder/SKILL.md`

### Commands (15 files)
- `.cursor/commands/execute-prd.md`
- `.cursor/commands/feature-area.md`
- `.cursor/commands/prd-init.md`
- `.cursor/commands/prd-questions.md`
- `.cursor/commands/prd.md`
- `.cursor/commands/plan.md`
- `.cursor/commands/implement.md`
- `.cursor/commands/explore.md`
- `.cursor/commands/review.md`
- `.cursor/commands/fix.md`
- `.cursor/commands/commit.md`
- `.cursor/commands/pr.md`
- `.cursor/commands/babysit.md`
- `.cursor/commands/split.md`
- `.cursor/commands/improve-config.md`

### Templates (14 files)

**PRD templates (7):**
- `.cursor/templates/prd/PRD.template.md`
- `.cursor/templates/prd/discovery-note.template.md`
- `.cursor/templates/prd/history.template.md`
- `.cursor/templates/prd/open-questions.template.md`
- `.cursor/templates/prd/product-decision.template.md`
- `.cursor/templates/prd/product-decisions-readme.template.md`
- `.cursor/templates/prd/state.template.md`

**Product templates (2):**
- `.cursor/templates/product/feature-area.template.md`
- `.cursor/templates/product/scope-slice.template.md`

**Execution templates (5):**
- `.cursor/templates/execution/user-story.template.md`
- `.cursor/templates/execution/implementation-plan.template.md`
- `.cursor/templates/execution/patch-intent-summary.template.md`
- `.cursor/templates/execution/verification-report.template.md`
- `.cursor/templates/execution/review-report.template.md`

### Checkers (4 files)
- `.cursor/checkers/scope-readiness-checker.md`
- `.cursor/checkers/implementation-readiness-checker.md`
- `.cursor/checkers/pr-readiness-checker.md`
- `.cursor/checkers/migration-readiness-checker.md`

### Hooks (7 files)
- `.cursor/hooks.json`
- `.cursor/hooks/README.md`
- `.cursor/hooks/guard-destructive-git.sh`
- `.cursor/hooks/guard-protected-paths.sh`
- `.cursor/hooks/post-edit-feedback.sh`
- `.cursor/hooks/pre-commit.sh`
- `.cursor/hooks/pre-pr.sh`

### Other
- `.cursor/README.md`
- `.cursor/statusline.sh`

### DELETED (rules merge complete)
_(All files from `zedos/.cursor/rules/` have been merged into root `.cursor/rules/72-74*.mdc` and deleted.)_

---

## 11. What the Cloud Agent Should Do Next

### ~~Step 1: Complete the rules merge~~ ✅ DONE
Rules merge completed. `zedos/.cursor/rules/` deleted. All cross-references updated.

### Step 2: Verify secret safety
1. Check that `zedos/nextjs_space/.env` does NOT contain real secrets (or does not exist)
2. Ensure `.gitignore` covers `.env`
3. If secrets are present, STOP and alert the user — do not push

### Step 3: Obtain PIS approval
Present the 5 approval blockers from §4 to the user. Each requires explicit `approved`:
1. Parent FA `NEED_HUMAN` carve-out
2. OQ-2: reversal does NOT restore `graceUsed`
3. OQ-3: placeholder Stripe fixtures with TODO
4. OQ-4: server-supplied correlation_id
5. 4-PR stack shape

Only `approved` counts — not `ok`, not silence.

### Step 4: Execute Phase 2b (blocked on Step 3)
Run the execution loop per `.cursor/commands/implement.md`:
1. For each PR in the stack (#1 → #2 → #3 → #4):
   - Produce a Patch Intent Summary (chat-only)
   - Get `approved` from user
   - Implement within the Plan's Touched Files allow-list
   - Run verifier (`/commit` pre-flight: typecheck + lint + test + build)
   - Run reviewer (adversarial diff review)
   - `/commit` with Conventional Commit message
   - `/pr` with stacked base branches
   - `/babysit` to keep the stack green

### Step 5: Phase 3 — Turborepo migration (after Phase 2 merges)
Full plan in `docs/retro/zedos-monorepo-retro.md` §6:
- Move `zedos/nextjs_space/` → `apps/web/`
- Root: `package.json`, `pnpm-workspace.yaml`, `turbo.jsonc`, `.changeset/`, `.npmrc`
- Extract: `@repo/contracts`, `@repo/result`, `@repo/db`, `@repo/auth`
- Migrate Prisma → Drizzle
- Migrate NextAuth → better-auth

### Step 6: Phase 4 — Next Feature Areas
Priority order per `execution-loop.mdc` §4:
1. `FA-account-session` (P0)
2. `FA-dashboard-shell` (P0)
3. `FA-prd-versioning` (P1)
4. `FA-guided-clarification` (P2)
5. `FA-credit-system` full (P4)

---

## 12. Feature Area Priority Bands

| Band | Feature Area | Status |
|------|-------------|--------|
| P0 | Account & session (`account-session`) | Has 2 scope slices: `signup-to-signed-in-dashboard`, `returning-owner-sign-in` |
| P0 | Dashboard shell (`dashboard-shell`) | exploratory |
| P1 | Project workspace (`project-workspace`) | exploratory |
| P1 | PRD versioning (`prd-versioning`) | exploratory |
| P2 | Guided clarification (`guided-clarification`) | exploratory |
| P2 | Question history (`question-history`) | exploratory |
| P3 | Read-only sharing (`read-only-sharing`) | exploratory |
| P3 | Owner milestone feedback (`owner-milestone-feedback`) | exploratory |
| P4 | Credit system (`credit-system`) | exploratory + NEED_HUMAN (B-003, B-004) |
| P4 | Payments (`payments`) | exploratory |

---

## 13. Known Friction Items

14 friction items logged in `docs/retro/phase2a-friction-log.md`. The most critical:

- **F-01 (CRITICAL):** No "safety-fix slice" path when parent FA has `NEED_HUMAN: true` on orthogonal blockers. Workaround: explicit carve-out in PIS.
- **F-02 (HIGH):** `forbidden_files` in `execution-loop.mdc` §8 unclear on writes-vs-describes distinction.
- **F-03 (HIGH):** PIS template lacks "Preconditions / Inherited approval blockers" section.
- **F-06 (MEDIUM):** No `vitest.integration.config.ts` or test-DB harness exists yet.

These are inputs to a future `/improve-config` pass — do not fix them during Phase 2b implementation.
