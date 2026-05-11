# Execution Committee

Specialized agents that govern code-side work — from User Story authoring to merged PR. They mirror the discovery-side committee (`agents/prd/`, `agents/feature-area/`) but operate on the right half of the lifecycle.

Like the discovery side, this is **AI-assisted execution governance**, not "AI generates code". The user approves Plans, Patch Intent Summaries, and PRs. Agents propose, review, verify, and refuse — they do not commit unilaterally.

## Members

### Constructive roles

| Agent | File | Responsibility |
|-------|------|----------------|
| Architect | [`architect.md`](./architect.md) | Designs the implementation shape from a `ready-for-user-stories` Scope Slice. Writes User Stories and Implementation Plans. **Never writes code.** |
| Implementer | [`implementer.md`](./implementer.md) | Executes an approved Implementation Plan. Edits code under the Plan's `Touched Files` allow-list, only after Patch Intent Summary `approved`. |
| Bugfix | [`bugfix.md`](./bugfix.md) | Focused bug-fix specialist. Smaller scope than Implementer; same gates (Plan-Lite + PIS). |
| Improver | [`improver.md`](./improver.md) | Refactor / improvement specialist. Drives `/improve-config` (meta-loop on `.cursor/`) and code-side improver loops. |

### Adversarial roles (paired with constructive)

| Agent | File | Pairs with | Adversarial focus |
|-------|------|-----------|-------------------|
| Reviewer | [`reviewer.md`](./reviewer.md) | Implementer | Adversarial diff review. Refuses scope creep, layer violations, `as any`, missing tests. |
| Domain Guardian | [`domain-guardian.md`](./domain-guardian.md) | Architect, Implementer | Enforces hexagonal-boundaries, RoP, contracts-as-zod across every diff. |
| Security & PII | [`security-pii.md`](./security-pii.md) | Implementer | Scans for PII / secret leakage in logs, errors, response shapes. |

### Mechanical roles

| Agent | File | Responsibility |
|-------|------|----------------|
| Verifier | [`verifier.md`](./verifier.md) | Runs typecheck / lint / test / build. **Hard-stops the loop on FAIL.** Produces Verification Report. |
| Test Runner | [`test-runner.md`](./test-runner.md) | Runs the test suite, parses results, reports first failure. |

### Read-only specialists

| Agent | File | Responsibility |
|-------|------|----------------|
| Monorepo Explorer | [`monorepo-explorer.md`](./monorepo-explorer.md) | Read-only navigator. Answers "where does X live?" and "what calls Y?". |
| Monorepo Analyst | [`monorepo-analyst.md`](./monorepo-analyst.md) | Deeper structural analysis. Layer dependency graphs, drift detection, package-level metrics. |

### Domain specialists

| Agent | File | Domain |
|-------|------|--------|
| Drizzle Persistence | [`drizzle-persistence.md`](./drizzle-persistence.md) | Drizzle schema, migrations, transactional / row-locking patterns. Pre-migration: equivalent Prisma patterns. |
| Next.js Routes | [`nextjs-routes.md`](./nextjs-routes.md) | App Router specialist — route handlers, server actions, layouts, streaming, error/loading boundaries. |
| Auth (better-auth) | [`auth-better-auth.md`](./auth-better-auth.md) | better-auth configuration, sessions, providers, API keys (v2/v3 plan). Pre-migration NextAuth bridge. |
| Event Contracts | [`event-contracts.md`](./event-contracts.md) | zod schema design, contract test fixtures, cross-layer DTO discipline. |
| FA — Project workspace | [`fa-project-workspace.md`](./fa-project-workspace.md) | Phase 4 **`FA-project-workspace`** router — workspace/project surfaces (**P1**). |
| FA — PRD versioning | [`fa-prd-versioning.md`](./fa-prd-versioning.md) | Phase 4 **`FA-prd-versioning`** router — versioned PRD + contracts (**P1**). |
| FA — Guided clarification | [`fa-guided-clarification.md`](./fa-guided-clarification.md) | Phase 4 **`FA-guided-clarification`** router — AI clarification + streaming (**P2**). |

### Phase 4 Feature Area routing

Orchestration and bands live in `.cursor/rules/execution-loop.mdc` §4 and **`docs/state/status.json`**. For **`FA-project-workspace`**, **`FA-prd-versioning`**, and **`FA-guided-clarification`**, the Architect pulls in the matching **`fa-*.md`** router alongside **`domain-guardian`** so Plans name the right specialists early (Domain specialists table above).

## Operating principle

```txt
/explore                           (read-only — monorepo-explorer + monorepo-analyst)
   ↓
/plan <slice-path>                 (architect produces Implementation Plan; user approves)
   ↓                               (domain-guardian + scope-critic adversarial review)
/implement <plan-path>             (implementer produces Patch Intent Summary; user approves)
   ↓                               (verifier runs typecheck/lint/test/build — HARD STOP on FAIL)
/review                            (reviewer + domain-guardian + security-pii adversarial review)
   ↓
/commit                            (implementer stages + commits per conventional commit format)
   ↓
/pr                                (pr-readiness-checker CLEAR; PR opened)
   ↓
/babysit                           (implementer + reviewer + verifier loop on PR comments + CI)
   ↓
merge
```

## Adversarial pairing rule

Every constructive agent has an adversarial counterpart. The adversarial agent is **not optional** for `validated`-status work:

| Constructive | Adversaries |
|--------------|-------------|
| Architect | Domain Guardian, Scope Critic (from `agents/feature-area/`) |
| Implementer | Reviewer, Domain Guardian, Security & PII |
| Bugfix | Reviewer, Domain Guardian |
| Improver | Reviewer, Domain Guardian |

A Plan without adversarial review is not approvable. A diff without `reviewer` + `verifier` PASS is not mergeable.

## Read order for new contributors

1. `.cursor/rules/70-execution-bridge.mdc` — the seam between discovery and execution
2. `.cursor/rules/72-hexagonal-boundaries.mdc` — hexagonal layer definitions and enforcement
3. `.cursor/rules/73-result-rop.mdc` — Result discipline
4. `.cursor/rules/74-contracts-zod.mdc` — contracts as the single source of truth
5. `.cursor/rules/80-change-policy.mdc` — what each command may and may not do
6. This README + the per-agent files

## Hard rules

- No agent writes code without an approved Implementation Plan **and** an approved Patch Intent Summary in the immediately preceding turn.
- No agent bypasses `verifier` PASS as a gate for `/commit` or `/pr`.
- No agent escapes the `Touched Files` allow-list of the active Plan.
- No agent invents a model slug. Use the documented Cursor slugs only (see each agent's frontmatter).
- Adversarial roles never write code; they only review and report.
