# /implement — Spec → Test → Implementation

> **Tier Enforcement (MANDATORY):** Read `.cursor/core/skills/tier-enforcement/SKILL.md` before proceeding.
> 
> This command drives implementation. **You MUST NOT write application code inline in this conversation.** The flow is:
> 1. **Plan** — Manager tier: decompose the Spec into Executor-sized bricks.
> 2. **Delegate** — fire one `Task(subagent_type: "executor", model: "composer-2.5-fast")` per brick.
> 3. **Verify** — Manager tier: confirm bricks assembled correctly, tests green.
>
> Any inline `StrReplace`/`Write` on `.ts`/`.tsx`/`.py`/etc. is a SISO ORANGE violation. Use `Task` instead.


## Usage

```txt
/implement <mode> [spec-or-task-path]
```

Drives governed implementation of a `ready-for-implementation` Spec (or a Task carved from it). Test-first, traced to ACs, tier-routed.

Governed by: `.cursor/core/rules/implementation-workflow.mdc`
Doctrine: `.cursor/core/rules/30-test-strategy.mdc`, `.cursor/core/rules/40-architecture-baseline.mdc`, `.cursor/core/rules/20-model-routing.mdc`
Skill: `.cursor/core/skills/implementation/implementation-builder/SKILL.md`
Agents: `.cursor/core/agents/implementation/{implementation-lead,executor,implementation-reviewer}.md`

## Modes

| Mode | Tier | Purpose |
|------|------|---------|
| `plan <spec-path>` | Manager | Read the Spec; produce a thin implementation plan (files, contract surface, test list traced to ACs). Split into Tasks via `/task` if multi-commit. No code. |
| `test <spec-or-task-path>` | Executor | Write the tests named in the Spec `## Tests` — **before** implementation. They must fail for the right reason. |
| `run <spec-or-task-path>` | Executor | Implement the smallest change that turns the traced tests green. Follow the architecture baseline. |
| `verify <spec-or-task-path>` | Manager | Run tests + lints; confirm every Spec AC and Contract error row is covered. |
| `review <spec-or-task-path>` | Manager / **Vision** | Review the change. High-risk (auth, money, migration, external contract, security) escalates to `claude-opus-4-6`. |

## Pre-flight (all modes) — hard gate

Per `implementation-workflow.mdc` §2, before any mode verify **all**:

1. `docs/project.config.md` → Implementation governance enabled: **yes**.
2. An approved PD authorizing the implementation phase exists.
3. Target Spec is `ready-for-implementation`.
4. Grandparent Feature Area is `delivery-ready`.
5. No `NEED_HUMAN: true` on the chain (Spec → User Story → Scope Slice → Feature Area).

If any fails: stop, name the gate, recommend the unblocking command, write nothing.

Also read: the Spec, its parent User Story, `30-test-strategy.mdc`, `40-architecture-baseline.mdc`, and `docs/project.config.md` (stack overrides + forbidden paths).

## Mode: plan

1. Manager (`implementation-lead`) reads the Spec + chain.
2. Output a plan: files to touch · the contract surface · the test list, each row traced to an AC or a named contract · architecture notes/deviations · whether `/task` subdivision is needed.
3. No code, no test files. Recommend `/task propose` if multi-surface, else `/implement test`.

## Mode: test

1. Executor writes the tests from the Spec `## Tests` section, **before** implementation.
2. Layers: unit + contract + integration. E2E only for a Spec-named journey.
3. Each test references the AC / contract it proves. Run them — they must fail meaningfully.
4. Output: files created, the red test summary, next step `/implement run`.

## Mode: run

1. Executor implements the smallest change to turn the traced tests green.
2. Follow `40-architecture-baseline.mdc`; record any deviation in the Spec Implementation notes.
3. If implementation reveals a Spec gap → stop, set `NEED_HUMAN: true` on the Spec, surface it. Do not invent the missing decision.
4. Output: files changed, green test summary, next step `/implement verify`.

## Mode: verify

1. Run the full traced test set + lints.
2. Confirm each parent AC is exercised and each Contract `Errors` row has a test.
3. Output a coverage map AC → test, and any gap. If gaps: back to `/implement test`.

## Mode: review

1. Routine → Manager review against the Spec + doctrine.
2. **High-risk → Vision** (`claude-opus-4-6`) via `implementation-reviewer`.
3. Output: blocking issues, suggestions, verdict (APPROVE / CHANGES). On APPROVE recommend `/task promote` (if Task) or note the Spec is implemented.

## Hard rules

- No code or test writes unless the §2 gate passes.
- Tests before implementation — always.
- One Executor handles one brick (one Task / one coherent commit). Split first if larger.
- Never promote from `/implement` — promotion is `/task promote` after tests pass + checks CLEAR.
- Never bypass `NEED_HUMAN`. Never add unjustified e2e.
- Respect `forbidden_files` from `docs/project.config.md` and any active `EXECUTION_LOCK`.
