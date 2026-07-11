# /commit — Stage and commit with a Conventional Commit message

## Usage

```txt
/commit
```

Lead agent: `implementer` (`.cursor/agents/execution/implementer.md`)
Pre-commit hook: `.cursor/hooks/pre-commit.sh`
Operational rule: `.cursor/rules/79-pr-sizing.mdc`, `80-change-policy.mdc`

---

## Purpose

`/commit` stages files produced by `/implement` or `/fix` and writes a Conventional Commit message that links the active Implementation Plan, User Story, Scope Slice, and any Decision IDs. It does **not** edit files.

---

## Pre-flight

1. Confirm a verifier PASS exists for the current diff. If not, route to `/implement` to verify first.
2. Confirm a reviewer non-BLOCK verdict exists. If reviewer returned BLOCK, route to `/fix` for the Critical findings first.
3. Read the active Implementation Plan to extract the artifact lineage (Plan, User Story, Scope Slice, Decision references).
4. **SISO classification:** EXECUTION (mechanical commit; no code edits).

---

## Behavior

### Step 1 — Stage only files in the most recent approved PIS

```bash
git add <path-1> <path-2> ...     # named files only — never `git add .` / `git add -A`
```

This bounds the commit to the PIS — accidental file additions don't get committed.

### Step 2 — Compose the Conventional Commit message

Format:

```
<type>(<scope>): <short description>

<body — 2–4 sentences explaining the why; reference the User Story>

Refs:
- Plan: docs/execution/plans/<...>.plan.md
- Story: docs/execution/user-stories/<...>.md
- Slice: docs/product/scope-slices/<...>.md
- Decisions: PD-NNN, PD-NNN (or "none")
```

Type values:

| Type | When |
|------|------|
| `feat` | New user-visible capability |
| `fix` | Bug fix |
| `refactor` | Behavior unchanged; structure improved |
| `test` | Tests-only change |
| `docs` | Documentation only |
| `chore` | Build, config, dependency, scripts (no behavior change) |
| `perf` | Performance improvement |
| `style` | Code formatting, no logic change |

Scope is the touched layer / package / context (`credits`, `payments`, `auth`, `ui`, `infra`, …).

Example:

```
feat(credits): add Stripe Checkout session creation

Routes purchase requests through `createPurchaseCheckoutUseCase` and
returns a Stripe-hosted Checkout URL. Idempotency keys derive from the
purchase id; webhook handling lands in a follow-up.

Refs:
- Plan: docs/execution/plans/credit-system--purchase-credits--checkout.plan.md
- Story: docs/execution/user-stories/credit-system--purchase-credits--checkout.md
- Slice: docs/product/scope-slices/credit-system--purchase-credits.md
- Decisions: none
```

### Step 3 — Commit (with HEREDOC for safe formatting)

```bash
git commit -m "$(cat <<'EOF'
feat(credits): add Stripe Checkout session creation

[body]

Refs:
[references]
EOF
)"
```

Never `--amend` an already-pushed commit unless the user explicitly approves a force-push (which they won't for `main`/`master`).

### Step 4 — `pre-commit` hook runs

`.cursor/hooks/pre-commit.sh` runs the verifier's quality gates one more time. On hook FAIL, the commit is blocked. Fix the issue; re-run `/commit`.

### Step 5 — Output

```txt
Committed: <short-sha> <type>(<scope>): <short description>

Files committed:
- <path>

Verifier: PASS (re-run by pre-commit hook)
Branch: <branch-name>
Status: ahead of <base> by <N> commits

Next recommended command:
/pr  (when the branch is ready to open as a PR)
```

---

## Hard rules

- Stage only named files / hunks. **No `git add .`. No `git add -A`.**
- The message references Plan + Story + Slice (or "none" only when explicitly out-of-process — e.g. `chore` for `.cursor/` changes).
- Type matches the change. `feat` for behavior-changing commits; `chore` for `.cursor/` config.
- No `--amend` on pushed commits without explicit user approval.
- No bypassing the pre-commit hook (`--no-verify`).
- Pre-commit hook FAIL → fix the issue, do not skip.

---

## Failure routing

| Condition | Action |
|-----------|--------|
| Verifier PASS missing | Route to `/implement` to verify |
| Reviewer BLOCK pending | Route to `/fix` for the Critical findings |
| Pre-commit hook FAIL | Fix the underlying issue (typecheck / lint / test failure); re-run `/commit` |
| Untracked files in working tree that aren't in the PIS | Refuse to commit; ask the user (might be debug files left behind) |

---

→ /pr → /babysit
