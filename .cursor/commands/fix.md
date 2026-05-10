# /fix — Focused bug-fix loop

## Usage

```txt
/fix <issue-description>            (with reproducer)
/fix <pr-comment-url>               (acting on a PR comment)
/fix <reviewer-finding>             (from a Review Report)
```

Lead agent: `bugfix` (`.cursor/agents/execution/bugfix.md`)
Verification: `verifier`
Review: `reviewer` + `domain-guardian`
Operational rule: `.cursor/rules/70-execution-bridge.mdc`, `80-change-policy.mdc`
Templates: `.cursor/templates/execution/patch-intent-summary.template.md`

---

## Purpose

`/fix` is a smaller-scope alternative to `/implement` for bugs that don't justify a full Implementation Plan. It produces a **Plan-Lite** + Patch Intent Summary, then routes through verifier and reviewer.

`/fix` is the right command when:

- The fix touches ≤ 3 files.
- The fix touches ≤ 1 hexagonal layer.
- The fix is ≤ 100 net lines.
- The fix introduces no new contracts, no new migrations, no new dependencies.
- The bug is reproducible (test or manual repro available).

Larger or more architectural changes route to `/plan` + `/implement`.

---

## Pre-flight

1. Read the bug description / PR comment / Review Report finding.
2. Confirm a reproducer exists (failing test, error log, or steps).
3. Read the file(s) where the bug lives.
4. Read the applicable rules per the file's layer.
5. **SISO classification:** EXECUTION. Bugs in concurrency-critical code (credit / payment / quota) refuse `/fix` and route to `/plan` + `/implement` (they need full design + concurrency tests).

---

## Behavior

### Iteration loop

```
1. Confirm activation criteria (≤ 3 files, ≤ 1 layer, ≤ 100 lines, no new contracts/migrations/dependencies).
2. Produce a Plan-Lite (per `.cursor/agents/execution/bugfix.md`).
3. Wait for user `approved` on the Plan-Lite.
4. Produce a Patch Intent Summary using the standard template.
5. Wait for user `approved` on the PIS.
6. Apply edits restricted to PIS "Files to change".
7. Route to verifier — typecheck / lint / test / build.
8. On verifier PASS → route to reviewer + domain-guardian.
9. On reviewer PASS or REVISE-without-criticals → recommend /commit + /pr.
10. On verifier FAIL or reviewer BLOCK → fresh PIS targeting the failure; loop.
```

### Plan-Lite shape (chat artifact)

```txt
Plan-Lite — Bugfix

Bug: <one-sentence wrong-behavior statement>
Reproducer: <test path | error line | manual steps>

Root cause: <one-paragraph diagnosis grounded in code citations>

Fix shape:
- File: <path> — <change>

Tests added/updated:
- <path> — <new test asserting the bug does not return>

Risks:
- <regression risk>

Out of scope:
- <adjacent issues deliberately not fixed in this loop>

Adversarial review:
- domain-guardian: PASS | REVISE | BLOCK
- reviewer (preview): PASS | REVISE | BLOCK
```

The Plan-Lite is a chat artifact. Persist to `docs/execution/plans/` only when the user explicitly asks (rare for bugfixes).

---

## Hard rules

- Same source-tree authority bounds as `/implement`: only PIS-approved files.
- Same approval ladder: `approved` / `preview` / `cancel`; never `ok` or silence.
- The bugfix lands with at least one test that fails before the fix and passes after.
- No `as any` introduced.
- No frozen-violation contributions (per `72-hexagonal-boundaries.mdc` §7, `73-result-rop.mdc` §7).

---

## Failure routing

| Condition | Action |
|-----------|--------|
| Fix exceeds 3 files / 1 layer / 100 lines | Route to `/plan` + `/implement` |
| Fix introduces a new contract, migration, or dependency | Route to `/plan` + `/implement` |
| Bug is in credit / payment / quota path | Route to `/plan` + `/implement` (concurrency tests mandatory) |
| Reproducer missing | Stop; ask the user for a repro |
| Verifier FAIL | Fresh PIS targeting the failure |
| Reviewer BLOCK | Fresh PIS targeting the Critical findings |

---

→ /commit → /pr → /babysit
