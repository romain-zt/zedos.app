# /pr — Open or update a Pull Request

## Usage

```txt
/pr                    (open or update PR for current branch)
/pr --base <branch>    (target a non-default base, e.g. for stacked PRs)
```

Lead agent: `implementer` (`.cursor/agents/execution/implementer.md`)
Pre-PR hook: `.cursor/hooks/pre-pr.sh`
Pre-PR checker: `.cursor/checkers/pr-readiness-checker.md`
Operational rule: `.cursor/rules/79-pr-sizing.mdc`

---

## Purpose

`/pr` opens (or updates) a GitHub Pull Request for the current branch. It does **not** edit code. It enforces the PR-readiness checker (`pr-readiness-checker.md`) and the description format defined in `.cursor/rules/79-pr-sizing.mdc` §5.

After opening, `/babysit` is the natural follow-up to keep the PR merge-ready.

---

## Pre-flight

1. Confirm there is at least one commit on the current branch beyond the base.
2. Read the active Implementation Plan, User Story, and Scope Slice (the PR description references all three).
3. Run `pr-readiness-checker.md`. Required: CLEAR. If BLOCKED, route per the failing check.
4. **SISO classification:** EXECUTION (mechanical PR creation; no code edits).

---

## Behavior

### Step 1 — Run `pr-readiness-checker.md`

Required CLEAR. If BLOCKED:

| First failing check | Route |
|---------------------|-------|
| PR-A1 / PR-A2 / PR-A3 (verifier / reviewer / Plan authority) | `/review` or `/implement` |
| PR-B1 — PR-B6 (sizing) | `/split` (with declared exemption only if applicable) |
| PR-C* (description) | The agent fills the description before `/pr` |
| PR-D1 — PR-D3 (no `as any`, no SDK in routes, no `lib/`) | `/fix` |
| PR-D4 (CI) | Wait for CI to settle, or fix per the failing job |
| PR-D5 (concurrency tests) | Add the test via `/fix` or revise the Plan |
| PR-D6 (coverage floors) | Add tests via `/fix` |
| XC-01 (protected paths touched) | Split the cross-domain PR |

### Step 2 — Push the branch

```bash
git push -u origin HEAD
```

If the branch is already pushed and there are new commits, push them. No force-push to `main` / `master`.

### Step 3 — Compose the PR description

Use the format from `.cursor/rules/79-pr-sizing.mdc` §5:

```md
## Summary
<1–3 sentences: what changed and why>

## Linked artifacts
- Scope Slice: docs/product/scope-slices/<...>.md
- User Story: docs/execution/user-stories/<...>.md
- Implementation Plan: docs/execution/plans/<...>.plan.md
- Decision references: PD-NNN (or "none")

## Test plan
- [x] Unit tests added/updated
- [x] Integration tests added/updated (persistence touched)
- [ ] E2E tests added (no new user-facing journey in this PR)
- [x] Manual verification: <steps>

## Out of scope (deliberate)
- <thing not in this PR but adjacent>
- <follow-up Plan or Slice that owns it>
```

### Step 4 — Open or update the PR

```bash
gh pr create --base <base> --title "<title>" --body "$(cat <<'EOF'
[description]
EOF
)"
```

For an existing PR (re-running `/pr`):

```bash
gh pr edit <number> --body "$(cat <<'EOF'
[updated description]
EOF
)"
```

### Step 5 — Output

```txt
PR opened: #<N> <title>
URL: <pr url>

Base: <base-branch>
Head: <head-branch> (<adds>+/<dels>- across <N> files)

Checks running:
- typecheck
- lint
- test
- build

Next recommended command:
/babysit  (keep the PR merge-ready until merge)
```

---

## Stacked PRs

When `/split` produces a stack, `/pr` opens each PR with the appropriate `--base`:

```bash
/pr --base main                     # foundation PR
/pr --base feature/foundation       # consumer PR
/pr --base feature/consumer         # leaf PR
```

Each PR independently passes `pr-readiness-checker.md`.

---

## Hard rules

- No PR opens on `pr-readiness-checker.md = BLOCKED`.
- No force-push to `main` / `master`.
- No skipping the pre-PR hook (`--no-verify` equivalent).
- The description includes the lineage chain (Slice / Story / Plan) and the test plan.
- Deliberate out-of-scope items are listed explicitly — reviewers can't infer intent from absence.

---

## Failure routing

| pr-readiness-checker first failing | Route |
|------------------------------------|-------|
| PR-A1 (verifier missing) | `/implement` to verify |
| PR-A2 (reviewer BLOCK) | `/fix` for Critical findings |
| PR-A3 (scope creep) | Plan revision or `/split` |
| PR-B* (sizing) | `/split` |
| PR-D* (quality gates) | `/fix` |
| XC-01 (protected paths touched) | Split the cross-domain PR |

---

→ /babysit
