---
description: "/quality-sweep — run a bounded code-health pass: quality checks, then one small safe batch of refactor/cleanup/missing-test fixes, opened as a draft PR."
---

# /quality-sweep — periodic code-health pass

On a regular basis, step back and improve the codebase itself (not just ship features): quality checks, refactor where it pays, cleanup, and plan hygiene. Scheduled in CI by `.github/workflows/quality-sweep.yml`; runnable on demand here.

Agent: `.cursor/core/agents/maintenance/quality-sweep-lead.md` (Manager tier). Governed by `50-code-quality.mdc`, `51-backend-code.mdc`, `52-frontend-code.mdc`, `30-test-strategy.mdc`.

## What it does

1. **Drain the input queue** — fold open `/btw` quality/refactor/cleanup items (priority 0 first), resolve the ones it actions.
2. **Assess** — run the real checks; catalog the top issues by impact (code smells vs `50-code-quality.mdc` thresholds, markup/div-soup vs `52`, backend layering vs `51`, missing tests, stale plan/state).
3. **Improve one small batch** — the highest-impact, lowest-risk cluster that fits one reviewable PR. Behavior-preserving refactors + cleanup + clearly-missing tests; delegate typing to a composer Executor; escalate risky changes to a Vision review.
4. **Report** — open a **draft** PR: what changed this run + a ranked backlog checklist so nothing is lost.

## Limits

- One focused batch per run; never a sweeping rewrite.
- No scope/architecture/dependency changes; no merging; never weaken a check or test to go green.
- Anything risky or ambiguous → leave it as a written recommendation in the PR body, don't force it.
