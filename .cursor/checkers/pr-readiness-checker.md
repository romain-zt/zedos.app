# PR Readiness Checker

Governed by: `.cursor/rules/70-execution-bridge.mdc`, `.cursor/rules/79-pr-sizing.mdc`

Run this checker before `/pr` opens or updates a pull request. The PR is allowed to open only on a **CLEAR** verdict.

This checker presupposes that:

- `implementation-readiness-checker.md` returned CLEAR.
- The verifier (`.cursor/agents/execution/verifier.md`) returned PASS.
- The reviewer (`.cursor/agents/execution/reviewer.md`) returned PASS or REVISE-without-criticals.

If any of those is missing, this checker returns BLOCKED with the missing prerequisite as the first failing check.

---

## How to use

For each check, answer **PASS**, **FAIL**, or **SKIP (with reason)**.

A single **FAIL** blocks `/pr`. Resolve it; re-run.

---

## Section A — Verification + review prerequisites

### PR-A1 · Verifier PASS in this iteration

> A Verification Report exists with verdict PASS for the current diff (HEAD).

**FAIL signals:** verifier was not run; verifier returned FAIL; verifier was run on a stale HEAD.

### PR-A2 · Reviewer not BLOCK

> A Review Report exists with verdict PASS or REVISE (no unresolved 🔴 Critical findings).

**FAIL signals:** reviewer returned BLOCK; reviewer's report contains a 🔴 Critical row that has not been addressed by a follow-up commit; no Review Report exists.

### PR-A3 · Implementation Plan still authoritative

> The diff's edited paths are a subset of the Implementation Plan's `Touched Files`. No paths edited that are not in the Plan.

**FAIL signals:** an edited file is absent from the Plan's `Touched Files`; this is a scope creep — `/split` or Plan revision required.

---

## Section B — PR sizing (per `79-pr-sizing.mdc` §2)

### PR-B1 · Net lines changed ≤ 400

**FAIL:** Net lines > 400 with no declared exemption.

### PR-B2 · Files touched ≤ 15

**FAIL:** Files > 15 with no declared exemption.

### PR-B3 · Hexagonal layers touched ≤ 3

**FAIL:** Layers > 3 with no declared exemption (count via the import matrix in `72-hexagonal-boundaries.mdc` §3).

### PR-B4 · Packages touched ≤ 3 (post-migration)

**FAIL:** Post-migration only — packages > 3 with no declared exemption.

### PR-B5 · Test files touched ≤ 5

**FAIL:** Test files > 5 with no declared exemption.

### PR-B6 · Schema migrations ≤ 1

**FAIL:** > 1 migration in this PR.

### PR-B7 · Exemption declared explicitly (when sizing exceeds limits)

> If any of PR-B1 — PR-B6 fail, the PR title prefix declares one of the four exemptions in `79-pr-sizing.mdc` §3 (`mechanical-refactor`, `generated`, migration phase ID, or `revert`).

**FAIL:** Sizing exceeded with no declared exemption.

---

## Section C — PR description

### PR-C1 · Linked artifacts present

> PR description includes the lineage chain: Scope Slice path, User Story path, Implementation Plan path. Optionally: Decision references (PD-NNN).

**FAIL:** Any of the three is missing.

### PR-C2 · Test plan checklist

> PR description includes the test plan checklist: unit, integration (if persistence/contracts touched), e2e (if a new user-facing journey ships), manual verification.

**FAIL:** Test plan section missing or empty.

### PR-C3 · Out of scope (deliberate) listed

> PR description names what was deliberately not included.

**FAIL:** Section missing — reviewers can't tell intent from "what's missing".

### PR-C4 · Summary 1–3 sentences

> PR description's Summary section is concise (1–3 sentences) and answers "what changed and why".

**FAIL:** Summary missing or > 5 sentences (probably mixing in implementation detail).

---

## Section D — Quality gates

### PR-D1 · No new `as any` casts

> Diff introduces zero new `as any` casts (per `73-result-rop.mdc` §3.1).

**FAIL:** Any new `as any` in added code.

### PR-D2 · No new vendor-SDK imports outside `infrastructure/`

> No new `import Stripe`, `bcrypt`, `bcryptjs`, raw `fetch` to LLM providers, raw `prisma` (other than within `infrastructure/persistence/`) outside the infrastructure layer.

**FAIL:** Any new violation in the diff.

### PR-D3 · No new files in `lib/` (pre-migration retirement zone)

> No new files added under `zedos/nextjs_space/lib/`.

**FAIL:** New `lib/<file>.ts` introduced.

### PR-D4 · CI pipeline green (when CI is configured)

> CI runs typecheck, lint, test, build per `78-testing.mdc` §6 and all four jobs PASS.

**FAIL:** Any CI job is red.
**SKIP (with reason):** CI not yet configured (Phase 0 of monorepo retro). Verifier-local PASS substitutes.

### PR-D5 · Concurrency tests present (when applicable)

> Diff touches credit / payment / quota paths and includes at least one concurrent integration test.

**FAIL:** Concurrency-critical diff without a concurrent integration test.
**SKIP:** Diff did not touch concurrency-critical paths.

### PR-D6 · Coverage floors hold (per `78-testing.mdc` §4)

> Per-package statement coverage in the diff stays at or above the floor for each touched layer.

**FAIL:** Coverage drops below floor for any touched package.

---

## Cross-cutting

### XC-01 · No protected paths touched without explicit governance

> Diff does not edit `docs/prd/**`, `docs/product/**`, `docs/product-decisions/**`, or `.cursor/rules/**` / `.cursor/checkers/**` outside the corresponding governance commands (`/prd update`, `/feature-area …`, `/improve-config`).

**FAIL:** Source-tree PR also edits PRD or rule files without an explicit cross-domain Plan.

### XC-02 · Branch base correct

> Branch base is the default branch unless this PR is part of a stack (per `79-pr-sizing.mdc` §4). Stacked PRs declare their base in the description.

**FAIL:** Branch from a stale base; base is an unrelated feature branch.

---

## Summary output

```txt
## PR Readiness Check — <PR title>

Plan: docs/execution/plans/<...>.plan.md
Diff: <base>...<head> (+<adds>/-<dels>, <files> files)

| Check | Result | Notes |
|-------|--------|-------|
| PR-A1 | PASS   |       |
| PR-A2 | PASS   |       |
| PR-A3 | PASS   |       |
| PR-B1 | PASS   | 312 lines |
| ...   |        |       |
| XC-02 | PASS   |       |

**Advancement verdict:** CLEAR | BLOCKED
**First failing check (if BLOCKED):** <ID> — <reason>

Next recommended command:
- CLEAR → /pr (open or update)
- BLOCKED, sizing → /split
- BLOCKED, code quality → /fix
- BLOCKED, scope creep → revise Implementation Plan
```

---

## Hard rules

- No file writes — checker output is chat-only.
- The PR cannot open or update on a BLOCKED verdict.
- Exemptions for sizing must be **declared in the PR title prefix**, not asserted in chat — the title is the audit trail.
- A REVISE verdict from `reviewer` does not block `/pr` if every 🔴 Critical row was addressed; a 🔴 Critical without a follow-up commit is BLOCK.
