# `.cursor/` — Zedos AI Infrastructure

This directory is the workspace's AI governance layer. It covers the full lifecycle from product idea to merged PR:

```
/prd → /feature-area → /execute-prd → /plan → /implement → /review → /commit → /pr → /babysit
```

The **discovery side** (`/prd`, `/feature-area`, `/execute-prd`) was built first and is best-in-class. The **execution side** (`/plan`, `/implement`, `/review`, `/commit`, `/pr`, `/babysit`, plus `/explore`, `/fix`, `/split`, `/improve-config`) was built second and closes the seam.

## Anti-governance principle

> If governance overhead exceeds the product clarity gained, the governance system is failing.
> A PRD is a coordination tool, not a ritual artifact. The goal is faster correct decisions, not more process. When the system starts feeling like work, cut a section — don't add one.

(Lifted from `.cursor/skills/prd/prd-builder/SKILL.md` §11. The same principle applies to execution.)

---

## Top-level flow

### Discovery (left half)

| Command | Owns | Output |
|---------|------|--------|
| `/prd init` | Bootstrap `docs/prd/` workspace | Scaffold files |
| `/prd discover` / `/prd note` / `/prd questions` | Capture loop | `docs/prd/notes/`, `docs/prd/questions/open-questions.md` |
| `/prd converge` | Synthesize discovery | Chat artifact (no writes) |
| `/prd challenge` | Adversarial review | Chat artifact (no writes) |
| `/prd prioritize` | ICE rerank | Chat artifact (no writes) |
| `/prd update` | Persist PRD changes | `docs/prd/PRD.md`, `docs/prd/state.md`, `docs/prd/history.md`, `docs/prd/archive/` |
| `/feature-area map` / `slice` | Decomposition proposals | Chat artifact |
| `/feature-area scaffold` / `scaffold-slices` | Persist new artifacts | `docs/product/feature-areas/**`, `docs/product/scope-slices/**` |
| `/feature-area validate` / `check` | Run scope-readiness checker | Chat artifact (verdict) |
| `/feature-area refine-slice` | Edit product-level slice sections | Existing slice file |
| `/feature-area promote` / `promote-slice` | Narrow status transitions | Existing FA / slice file |
| `/execute-prd init` / `scan` / `next` / `run-one` / `loop` | Autonomous governance loop | `docs/WORK_QUEUE.md`, `docs/BLOCKERS.md`, `docs/EXECUTION_LOG.md`, `docs/EXECUTION_LOCK.md`, `docs/POINTS_OF_ATTENTION.md` |

### Bridge

A `ready-for-user-stories` Scope Slice is the discovery side's terminal artifact. It's the input to the execution side.

The bridge is governed by `.cursor/rules/70-execution-bridge.mdc` — the single point of contact between the two halves.

### Execution (right half)

| Command | Owns | Output |
|---------|------|--------|
| `/explore <question>` | Read-only codebase research | Chat artifact (no writes) |
| `/plan <slice-or-story-path>` | Implementation Plan proposal | `docs/execution/user-stories/**`, `docs/execution/plans/**` (after approval) |
| `/implement <plan-path>` | Execute approved Plan | Source code under the Plan's `Touched Files` |
| `/fix <issue>` | Focused bug-fix loop | Source code (smaller scope than `/implement`) |
| `/review` | Adversarial diff review | Chat artifact (Review Report) |
| `/commit` | Stage + commit with Conventional Commit | Git commit |
| `/pr` | Open or update a PR | GitHub PR |
| `/babysit` | Keep PR merge-ready | PR comments triaged, conflicts resolved, CI fixed |
| `/split` | Reorganize oversized work | Multiple PRs |
| `/evol` / `/bug` | Product evolution / bug intake | Queue + logs after approval (`80-change-policy.mdc`) |
| `/improve-config` | Improve `.cursor/` itself | `.cursor/**` |

---

## Directory structure

```
.cursor/
├── README.md                           ← this file
├── agents/
│   ├── prd/                            (discovery agents — Lead, Challenger, Researcher)
│   ├── feature-area/                   (decomposition agents — Lead, Scope Critic)
│   └── execution/                      (execution agents — Architect, Implementer, Verifier, Reviewer, …)
├── checkers/
│   ├── scope-readiness-checker.md      (FA + Scope Slice gates — discovery)
│   ├── implementation-readiness-checker.md (User Story + Plan gates — execution)
│   ├── pr-readiness-checker.md         (PR gate — execution)
│   └── migration-readiness-checker.md  (Turborepo migration phase gates)
├── commands/
│   ├── prd.md, prd-init.md, prd-questions.md   (discovery commands)
│   ├── feature-area.md, execute-prd.md         (decomposition commands)
│   └── plan.md, implement.md, review.md, fix.md, commit.md, pr.md, babysit.md, split.md, explore.md, evol.md, bug.md, improve-config.md  (execution commands)
├── hooks.json
├── hooks/
│   ├── README.md                       (hook contract documentation)
│   ├── guard-destructive-git.sh        (refuses force-push, reset --hard, --no-verify, etc.)
│   ├── guard-protected-paths.sh        (warns on edits to governance paths)
│   ├── post-edit-feedback.sh           (fast tsc feedback after every TS edit)
│   ├── pre-commit.sh                   (verifier gates invoked by /commit)
│   └── pre-pr.sh                       (full verification + sizing invoked by /pr)
├── rules/
│   ├── 00-siso.mdc                     (SISO — request-quality gate)
│   ├── 10-prd-discovery.mdc, 11-prd-question-loop.mdc, feature-area-workflow.mdc, execution-loop.mdc  (discovery rules)
│   └── 70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc, 73-result-rop.mdc, 74-contracts-zod.mdc, 75-drizzle.mdc, 76-better-auth.mdc, 77-nextjs.mdc, 78-testing.mdc, 79-pr-sizing.mdc, 80-change-policy.mdc, 81-critical-flow-extraction.mdc  (execution rules)
├── skills/
│   ├── prd/prd-builder/                (PRD construction skill — supporting docs split out)
│   ├── feature-area/feature-area-builder/  (decomposition skill)
│   ├── execution-loop/                 (autonomous governance loop)
│   └── execution/                      (execution skills — add-route-handler, add-usecase, …)
├── statusline.sh                       (CLI status line — surface PRD / FA / Slice context)
└── templates/
    ├── prd/                            (PRD, state, history, discovery-note, open-questions, product-decision)
    ├── product/                        (feature-area, scope-slice)
    └── execution/                      (user-story, implementation-plan, patch-intent-summary, verification-report, review-report)
```

---

## Reading order for new contributors

### To understand the system

1. `00-siso.mdc` — when does the system block, when does it pass
2. `feature-area-workflow.mdc` — the discovery hierarchy
3. `70-execution-bridge.mdc` — the seam to execution
4. `80-change-policy.mdc` — what each command may and may not do
5. The agent README files: `agents/prd/README.md`, `agents/feature-area/README.md`, `agents/execution/README.md`

### To run a feature end-to-end

1. `/prd discover` — capture the idea
2. `/prd questions` — answer one question at a time
3. `/prd converge` → `/prd update` — persist the PRD
4. `/feature-area map` → `/feature-area scaffold` → `/feature-area validate` → `/feature-area promote` — create + validate Feature Areas
5. `/feature-area slice` → `/feature-area scaffold-slices` → `/feature-area refine-slice` → `/feature-area promote-slice` — create + advance Scope Slices
6. `/explore` — read the existing code
7. `/plan` — design the implementation
8. `/implement` — write the code, gated by Patch Intent Summary
9. `/review` — adversarial diff review
10. `/commit` → `/pr` → `/babysit` — ship it

### To improve the system itself

`/improve-config <artifact-or-path>` — meta-loop over `.cursor/`.

---

## The five "amplify-don't-replace" patterns

The discovery side built five high-leverage patterns. The execution side amplifies each:

| Discovery pattern | Execution analogue |
|-------------------|--------------------|
| Surface Gate (`prd-builder/surface-gate.md`) — UNKNOWN is a valid answer; cap Confidence at 4 | Architecture Surface Block (`70-execution-bridge.mdc` §8) — UNKNOWN downgrades Plan to `proposed-with-open-surface`; `/implement` blocked |
| Patch Intent Summary approval ladder (`/prd update`) | Patch Intent Summary approval ladder (`/implement`) — same `approved` / `preview` / `cancel`; same refusal of `ok` |
| Adversarial roles factored from builders (`prd-challenger`, `scope-critic`) | `reviewer`, `domain-guardian`, `security-pii` — adversarial to `architect` and `implementer` |
| Lead-style context-reconstruction agents (`prd-lead`, `feature-area-lead`) | `architect` Architect-Lead pre-flight (`agents/execution/architect.md`) |
| Current truth resolution for Answered queue (PRD wins post-persistence; explicit `SUPERSEDED by` annotations) | Plan-as-authority (Plans supersede PIS authority; revisions explicit; never silent) |

---

## Models in use

Per the documented Cursor model slugs:

- `claude-opus-4-7-thinking-xhigh` — Lead-style multi-file synthesis (`prd-lead`, `feature-area-lead`, `architect`, `implementer`, `monorepo-analyst`)
- `claude-4.6-opus-high-thinking` — Researcher (`prd-researcher`)
- `claude-4.6-sonnet-medium-thinking` — Domain specialists (`bugfix`, `improver`, `drizzle-persistence`, `nextjs-routes`, `auth-better-auth`, `event-contracts`, `fa-project-workspace`, `fa-prd-versioning`, `fa-guided-clarification`)
- `gpt-4o-mini` — Adversarial pattern matchers (`prd-challenger`, `scope-critic`, `reviewer`, `domain-guardian`, `security-pii`)
- `composer-2-fast` — Fast deterministic checks (`verifier`, `test-runner`, `monorepo-explorer`)

Update one place when the slug list changes.
