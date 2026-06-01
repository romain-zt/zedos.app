# /implement — Execute an approved Implementation Plan

## Usage

```txt
/implement <plan-path>
```

Lead agent: `implementer` (`.cursor/agents/execution/implementer.md`)
Verification: `verifier` (`.cursor/agents/execution/verifier.md`) — hard-stop on FAIL
Review: `reviewer` (`.cursor/agents/execution/reviewer.md`) + `domain-guardian` + `security-pii`
Operational rule: `.cursor/rules/70-execution-bridge.mdc`, `80-change-policy.mdc`
Templates: `.cursor/templates/execution/patch-intent-summary.template.md`, `verification-report.template.md`, `review-report.template.md`, `iteration-synthesis.template.md`
Checker: `.cursor/checkers/implementation-readiness-checker.md`

---

## Purpose

`/implement` executes an approved Implementation Plan by editing source code under the Plan's `Touched Files` allow-list, gated by Patch Intent Summary approval and verifier PASS at every iteration.

`/implement` is the only command (other than `/fix`) that may write to `zedos/nextjs_space/**`, `apps/**`, `packages/**`, or `services/**`.

---

## Pre-flight

1. Read the Implementation Plan at `<plan-path>`. Confirm `Status: approved`.
2. Read the Plan's parent User Story.
3. Read the parent Scope Slice.
4. Read `.cursor/rules/70-execution-bridge.mdc`, `72-hexagonal-boundaries.mdc`, `73-result-rop.mdc`, `74-contracts-zod.mdc`, `80-change-policy.mdc` always.
5. Read specialist rules per the Plan's `Layers Affected`: `75-drizzle.mdc`, `76-better-auth.mdc`, `77-nextjs.mdc`, `78-testing.mdc`.
6. Run `implementation-readiness-checker.md` against the Plan. Required: CLEAR. If BLOCKED, route to `/plan <plan-path> --revise`.
7. **SISO classification:** `/implement` is EXECUTION. SISO blocks if INPUT_QUALITY = ORANGE or RED.

---

## Behavior

### Iteration loop

```
1. Confirm Plan Status = approved.
2. Confirm implementation-readiness-checker = CLEAR.
3. Produce a Patch Intent Summary using `.cursor/templates/execution/patch-intent-summary.template.md`.
4. Wait for user `approved`.
5. Apply edits restricted to PIS "Files to change".
6. Route to verifier — typecheck / lint / test / build.
7. On verifier PASS:
   - Route to reviewer (+ domain-guardian + security-pii).
   - On reviewer PASS or REVISE-without-criticals → recommend /commit.
   - On reviewer BLOCK → loop with a fresh PIS targeting the critical findings.
8. On verifier FAIL:
   - Halt the loop. Surface first failing line.
   - Loop with a fresh PIS targeting the failure.
```

### Approval ladder (mirrors /prd update)

- `approved` → apply
- `preview` → produce the exact diff before applying
- `cancel` → stop
- `ok` / silence → **NOT approval; refuse to apply**

This is the same ladder as `/prd update` — same discipline.

### After every iteration (in-loop)

Output:

```txt
Iteration <N> — <commit-style summary>

Files edited:
- <path> — <short change>

Verifier verdict: PASS | FAIL — <first failing line if FAIL>
Reviewer verdict: PASS | REVISE | BLOCK — <count of findings>

Next step:
- PASS / PASS → produce Iteration Synthesis (see below), then /commit, then /pr
- FAIL or BLOCK → fresh Patch Intent Summary targeting <issue>
```

### After loop completion (verifier PASS + reviewer PASS or REVISE-without-criticals)

Before recommending `/commit`, produce an **Iteration Synthesis** using `.cursor/templates/execution/iteration-synthesis.template.md`. This is cumulative across all iterations in the loop — not a repeat of the last iteration summary.

Required sections:

| Section | Content |
|---|---|
| **What shipped** | User-visible behavior mapped to acceptance criteria; cumulative files changed; tests added; items deliberately deferred (Plan Out of Scope) |
| **How to QA** | Automated commands + manual steps a human can run locally; edge cases worth spot-checking — sourced from User Story Test Plan and Plan Tests |
| **Next steps** | Immediate PR actions; follow-up User Stories / Scope Slices / bugs with priority; recommended story/slice status update; suggested next command |

The synthesis closes the loop. Do not skip it in favor of jumping straight to `/commit`.

---

## Hard rules

- No source-tree write outside the most recent approved PIS.
- No PIS produced for a Plan that is not `approved`.
- No edit to a path not in the Plan's `Touched Files` — that's scope creep; revise the Plan instead.
- No new dependency installation outside the Plan's `Dependencies Added`.
- No `as any` introduced.
- No `throw new Error` outside `domain/` or `app/error.tsx`.
- No vendor SDK construction outside `infrastructure/<vendor>/`.
- No new files in `zedos/nextjs_space/lib/` (retirement zone).
- No skipping verifier or reviewer.
- No bypass of `pre-edit` / `pre-commit` / `pre-pr` hooks.

---

## Failure routing

| Verdict | Action |
|---------|--------|
| `implementation-readiness-checker` = BLOCKED | Route to `/plan <plan-path> --revise` |
| Verifier FAIL on typecheck / lint | Iteration: produce fresh PIS targeting the failure |
| Verifier FAIL on test | Iteration: produce fresh PIS targeting the failure (do not disable the test) |
| Verifier FAIL on build | Iteration: produce fresh PIS targeting the failure |
| Reviewer BLOCK (Critical findings) | Iteration: produce fresh PIS targeting the findings |
| Reviewer REVISE (no Critical) | User decides; if user wants to act, route to `/improve-from-review`; otherwise `/commit` |
| Diff exceeds `79-pr-sizing.mdc` limits | Route to `/split` |
| Plan invalidated by migration phase advance | Halt; route to `/plan <plan-path> --revise` |

---

→ /review → /commit → /pr → /babysit
