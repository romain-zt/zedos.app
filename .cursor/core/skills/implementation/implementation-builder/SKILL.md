---
name: implementation-builder
description: Drives `/implement` — the governed Spec → Test → Implementation phase. plan (Manager) produces a thin traced plan; test (Executor) writes failing tests from the Spec ACs; run (Executor) implements the smallest green change; verify confirms AC coverage; review gates merge (Vision for high-risk). Test-first, traced to ACs, minimizes e2e. Only operates when the implementation phase is enabled and the Spec/FA gates pass.
disable-model-invocation: true
---

# Implementation Builder

Operational skill for `/implement`. Read first: `.cursor/core/rules/implementation-workflow.mdc`.
Align with `.cursor/core/rules/30-test-strategy.mdc`, `.cursor/core/rules/40-architecture-baseline.mdc`, `.cursor/core/rules/20-model-routing.mdc`.

## 1. Activation gate

Activate on `/implement <mode>`. Before any mode, verify the §2 gate of
`implementation-workflow.mdc`:

```
- docs/project.config.md → Implementation governance enabled: yes
- approved PD authorizing implementation exists
- Spec is ready-for-implementation
- grandparent Feature Area is delivery-ready
- no NEED_HUMAN on the chain
```

Any failure → stop, name the gate, recommend the unblocking command, write nothing.

## 2. Reads (every mode)

1. The target Spec (and Task if a task path was given)
2. The parent User Story (for AC wording)
3. `docs/project.config.md` — stack overrides + forbidden paths
4. `40-architecture-baseline.mdc`, `30-test-strategy.mdc`
5. Existing tests/code for the same surface (avoid duplication)

## 3. Tier routing (per `20-model-routing.mdc`)

| Mode | Runs as | Delegate to |
|------|---------|-------------|
| plan | Manager (`implementation-lead`) | — |
| test | Executor (`executor`) | — |
| run | Executor (`executor`) | — |
| verify | Manager | — |
| review | Manager; **Vision** for high-risk (`implementation-reviewer`) | — |

A Manager planning a multi-surface Spec splits it into Tasks (`/task`) and hands each Task to one Executor.

## 4. Mode: plan

Produce: files to touch · contract surface · **test list, each row traced to an AC or named contract** · architecture notes (and any baseline deviation) · subdivision decision. No file writes. Recommend `/task propose` (multi-surface) or `/implement test`.

## 5. Mode: test (test-first)

1. From the Spec `## Tests` + `## Contract` + `## Acceptance Criteria Trace`, write tests **before** implementation.
2. Layer per `30-test-strategy.mdc`: focused unit, contract (both sides of each boundary), integration (real local Postgres/MinIO via docker-compose). E2E only if the Spec names a journey.
3. Cover every Contract `Errors` row.
4. Run tests — they must fail for the right reason (not import/syntax errors).
5. Output: created files + red summary + `→ /implement run`.

## 6. Mode: run

1. Smallest change to make the traced tests green.
2. Follow the architecture baseline; record deviations in the Spec Implementation notes.
3. Spec gap discovered → stop, set `NEED_HUMAN: true` on the Spec, surface it; do not improvise the decision.
4. Stay inside the Spec's scope and allowed paths; obey `EXECUTION_LOCK` and `forbidden_files`.
5. Output: changed files + green summary + `→ /implement verify`.

## 7. Mode: verify

Run full traced tests + lints. Emit a coverage map (AC → test, Contract error → test). Any uncovered AC/error → back to `test`.

## 8. Mode: review

Routine: Manager checks scope, traceability, doctrine adherence, test quality. High-risk (auth, money, migration, external contract, security): escalate to Vision (`implementation-reviewer`, `claude-opus-4-6`). Verdict APPROVE/CHANGES. On APPROVE → `/task promote` (Task) or note Spec implemented.

## 9. Anti-patterns

| Wrong | Right |
|-------|-------|
| Code before tests | Tests first, must fail meaningfully |
| E2E for unit-testable logic | Push down to unit/contract |
| Asserting DOM/impl details | Assert Spec behavior / contract |
| Inventing a missing decision in code | Set `NEED_HUMAN` on the Spec, stop |
| New stack/dep not in baseline/PD | Record a deviation or open a PD first |
| Promoting from `/implement` | `/task promote` after CLEAR |
| One Executor on a multi-surface plan | Manager splits into Tasks first |
