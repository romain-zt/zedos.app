---
name: improve-from-review
description: Apply Reviewer findings back to the code via /fix-style iterations. Each finding becomes its own Plan-Lite + Patch Intent Summary. Severity-ordered; never bundle critical fixes with refactors.
disable-model-invocation: true
---

# Improve From Review

Use after a Review Report has been produced (verdict REVISE or BLOCK), when the user wants to act on findings.

## When to use

- Review Report contains findings (🔴 Critical, 🟡 Suggestion, 🟢 Nice-to-have).
- User wants to address some or all findings.

## Read first

- The Review Report in question.
- `.cursor/agents/execution/improver.md` (you operate under that agent's authority).
- `.cursor/agents/execution/bugfix.md` (the per-finding loop mirrors `/fix`).

## Recipe

### Step 1 — Sort findings by severity

🔴 Critical first. Critical findings block merge; address them before suggestions.

If multiple findings touch the same file or symbol, group them into a single iteration. If they touch unrelated code, separate iterations (per `.cursor/rules/79-pr-sizing.mdc` — never bundle).

### Step 2 — Per finding (or group), produce a Plan-Lite

```txt
Plan-Lite — Improvement from Review

Finding: <reviewer's text — quote it>
Severity: 🔴 | 🟡 | 🟢
Reviewer report: <chat-link or path if archived>

Fix shape:
- File: <path> — <change>

Tests added/updated:
- <path> — <new test if applicable>

Risks:
- <regression risk>

Out of scope (for this iteration):
- <other findings deliberately deferred>

Adversarial review:
- domain-guardian: PASS | REVISE | BLOCK
```

### Step 3 — Produce a Patch Intent Summary

Use `.cursor/templates/execution/patch-intent-summary.template.md`. Reference the Plan-Lite. Wait for user `approved`.

### Step 4 — Apply the fix; route to verifier

The verifier confirms typecheck / lint / test / build still PASS after the fix. Halt-on-first-FAIL applies.

### Step 5 — Re-route to reviewer

The reviewer confirms the finding is resolved AND no new findings have been introduced. If new findings appear, loop.

### Step 6 — Continue down the severity list

Address Critical first. Then Suggestions the user wants to act on. Skip Nice-to-have unless explicitly requested.

## Hard stops

- Refuse to bundle Critical fixes with Suggestions in a single PIS — split.
- Refuse to act on a Suggestion without user explicit selection. Suggestions are user-decision territory.
- Refuse to "improve" code outside the original Review Report's scope — that's scope creep; route to `/plan`.
- Refuse to disable a test to pass a fix — that's a 🔴 Critical violation in itself.

## Hard rules

- Same approval ladder as `/implement` and `/fix`.
- No `as any` introduced in fixing other findings.
- No frozen-violation contributions (per `72-hexagonal-boundaries.mdc` §7, `73-result-rop.mdc` §7).
- Each iteration has its own Plan-Lite + PIS. No "while I was there" fixes.
- After every iteration: verifier PASS + reviewer non-BLOCK before the next iteration starts.

## Output

```txt
Improvement Iteration <N> — <finding short title>

Finding addressed: <severity> <quote>
Files edited:
- <path> — <short change>

Verifier verdict: PASS | FAIL
Reviewer verdict: PASS | REVISE | BLOCK
Remaining findings: <count by severity>

Next iteration:
- <next finding> | done | hand back to user
```
