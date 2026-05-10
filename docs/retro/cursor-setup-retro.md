---
type: retro
scope: workspace .cursor/ AI infrastructure
status: discovery — not approved for action
date: 2026-05-10
author: Cursor agent (analysis only)
inputs:
  - /Users/romainpiveteau/Projects/ZedTech/zedos.app/.cursor/
  - /Users/romainpiveteau/Projects/ZedTech/zedos.app/zedos/.cursor/
  - /Users/romainpiveteau/Projects/ZedTech/zedos.app/docs/
  - /Users/romainpiveteau/Projects/ZedTech/zedos.app/tree.md (ZedOS reference)
  - /Users/romainpiveteau/.cursor/skills-cursor/* (Cursor first-party skill conventions)
constraints:
  - read-only audit; no source files were modified
  - no /prd, /feature-area, or /execute-prd modes were invoked
  - no SISO approval flow was triggered
---

# Retro — `.cursor/` Workspace AI Infrastructure

## 1. TL;DR (executive summary + severity tally)

The workspace `.cursor/` setup is **already in the top 5–10%** for AI-assisted product discovery and decomposition governance. The PRD Builder skill, Feature Area Workflow, scope-readiness checker, surface gate, and SISO rule are an unusually rigorous, internally consistent system.

It is **far from "top 1%"** for one structural reason: it covers **only the left half** of the product → execution lifecycle. There is **no execution-side counterpart** — no implementer agent, no `/implement`, `/review`, `/pr`, `/commit`, `/explore`, `/fix`, `/plan` commands, no test/lint/typecheck/build governance, no integration with the `zedos/.cursor/rules/` architecture rules, no monorepo or hex-boundary guardian, no PR babysit/split workflow. The `/execute-prd` "loop" is a *governance choreographer* (rebuilds queues, surfaces blockers) — it explicitly **stops before any code is written**. Today, the moment a Scope Slice reaches `ready-for-user-stories`, the workspace falls off a cliff.

Secondary issues that are real but recoverable: (a) the `model:` slugs declared in agent frontmatter do **not** match Cursor's documented subagent model slugs and will break if the parent ever delegates to them via Task; (b) the workspace has two parallel and disconnected `.cursor/` trees (`/.cursor/` workspace-level vs `/zedos/.cursor/rules/` code-level) with no cross-reference; (c) several skills are **2–4× the recommended 500-line ceiling** for SKILL.md files and rely on cross-document references that drift; (d) `hooks.json` is empty and the only hook file is a tombstone; (e) no canvas, statusline, babysit, or split-to-prs integration despite those Cursor-first-party skills being available.

### Severity tally

| Severity | Count | Examples |
|---|---:|---|
| **CRITICAL** | 7 | Missing execution-side `.cursor/` half; agent model slugs invalid; two disconnected `.cursor/` trees; no link between Scope Slice → User Story authoring; PRD blocker scan can loop on cycles; `is_background` non-standard frontmatter; `forbidden_files` defaults assume monorepo paths Zedos doesn't have |
| **HIGH** | 14 | SKILL.md files exceed 500 lines (prd-builder 741, feature-area-builder 344); checker has 359 lines and is referenced from many places (drift risk); no hooks for governance enforcement; no canvas / statusline; no test/typecheck/lint/build agent loop; PRD Lead doesn't write *anything* (pure context brief) — verbose for what it returns; templates use `{{PLACEHOLDER}}` style but commands also use HTML comments — inconsistent; "Feature Group" vs "Feature Area" terminology drift surfaces in multiple files; `/feature-area scaffold` cannot create files outside `<kebab>.md` schema but skips emit-time validation; legacy `before-submit-prompt.mdc` tombstone is dead weight; `tree.md` is 26603 lines committed at repo root (analysis artifact, not workspace content); no observability/audit beyond `EXECUTION_LOG.md`; no chat transcript ↔ PRD persistence pattern; no multi-model orchestration |
| **MEDIUM** | 12 | README.md files in `agents/prd/` and `agents/feature-area/` partially duplicate `commands/*.md`; no AGENTS.md root file; `hooks.json: {"version": 1, "hooks": {}}` should either be deleted or used; templates lack frontmatter `globs` even where helpful; SISO rule has no example for `/feature-area` modes; the same conceptual rule about "no implementation" is restated in 9+ places (rules/skills/commands/agents); the discovery-note template uses `{{TIMESTAMP_OR_SEQUENCE}}` but the question-loop rule prescribes an exact ISO format (drift); ICE staleness defaults differ between PRD Builder skill and Challenger; `forbidden_files` in EXECUTION_LOCK uses globs the actual repo doesn't have (`packages/**`, `lib/**`); product-decisions has a README template but no PD-001 example; no contributor docs for how to extend the framework; user-facing `/help` style command absent |
| **LOW** | 9 | Cosmetic: pipe-row whitespace inconsistencies in some tables; some files use `---` separators, some don't; PRD template `{{PRIMARY_MARKET_LANGUAGE}}` placeholder differs from actual filled value style; trailing newlines inconsistent; skill descriptions partially exceed the recommended single-paragraph idiom; `.gitkeep` is referenced but I didn't verify presence; spelling style varies (PRD vs prd vs Prd); links use both relative and absolute paths in different files; some emoji use in author rules (✅/❌) — workspace rule says no emojis unless requested |

**Total findings: 42** (7 CRITICAL, 14 HIGH, 12 MEDIUM, 9 LOW)

### Top 5 critical gaps

1. **No execution-side counterpart exists.** There is no symmetric `/implement`, `/review`, `/pr`, `/commit`, `/fix`, `/explore`, `/plan` workflow analogous to `/prd` and `/feature-area`. The `/execute-prd loop` explicitly stops at the Scope Slice → User Story boundary by design (see `.cursor/rules/execution-loop.mdc` §11.1). Once a Scope Slice is `ready-for-user-stories` there is **zero workspace governance for what happens next**. ZedOS's `.cursor/` shows the right shape: `architect`, `bugfix`, `domain-guardian`, `drizzle-persistence`, `event-contracts`, `improver`, `monorepo-analyst`, `monorepo-explorer`, `nest-integration`, `security-pii`, `test-runner`, `verifier` agents + `add-driven-adapter`, `add-driving-endpoint`, `add-usecase`, `split-technical-story` skills.

2. **Agent model slugs are not valid Cursor model identifiers.** Per the Task tool's documented model list (the only valid slugs are `claude-4.6-opus-high-thinking`, `claude-4.6-sonnet-medium-thinking`, `claude-opus-4-7-thinking-xhigh`, `composer-2-fast`, `gpt-5.4-medium`, `gpt-5.5-medium`), the workspace agents declare:
   - `prd-lead.md`: `model: claude-opus-4-7` (close to but not equal to `claude-opus-4-7-thinking-xhigh`)
   - `prd-challenger.md`: `model: gpt-5.5` (should be `gpt-5.5-medium`)
   - `prd-researcher.md`: `model: claude-opus-4-6` + `is_background: true` (should be `claude-4.6-opus-high-thinking`; `is_background` is not a documented agent frontmatter field)
   - `feature-area-lead.md`, `scope-critic.md`: `model: claude-opus-4-7` (same issue)
   
   If any of these is ever invoked through the Task tool with the declared slug, the call will fail or be silently rerouted. This bug is hidden today because the parent agent appears to inline the agent prompts, but it is a CRITICAL latent failure for autonomous use, parallel sub-agent runs, or any future SDK-driven pipeline.

3. **Two parallel, disconnected `.cursor/` trees.** The workspace `.cursor/` is product-discovery focused. `zedos/.cursor/rules/` contains the architecture rules that actually govern code (hexagonal layers, Result/RoP, SDK wrapping, no business logic in routes, contracts as zod source of truth). They use plain `.md` (no `.mdc` frontmatter, no `globs`, no `alwaysApply`). They are also stored in `.docx` and `.pdf` alongside the `.md` (which is wasteful and means "edit one update three"). **Neither tree references the other**. The PRD/Feature Area workflow has no way to surface "this Scope Slice will land in `src/domain/credits/` and must obey `01-architecture-layers.md`". The execution-loop rule's `forbidden_files` whitelist (`src/**`, `app/**`, `packages/**`, `lib/**`) doesn't even mention `zedos/nextjs_space/**`, where the actual code lives.

4. **The Scope Slice → User Story handoff is a documented dead-end.** Multiple skills explicitly say "user story authoring is out of scope for this skill" and "refer to the user story workflow for next steps" — but no such workflow exists in the repo. `feature-area-builder/SKILL.md` §12 hands off to a workflow that is not authored. `execution-loop.mdc` §11.1 hard-stops "before these queue artifacts are materialized". This is the **single biggest correctness/coherence issue**: the entire system is designed around an unbuilt next stage.

5. **`/prd questions` PRD blocker scan can loop and re-emit duplicates on edge cases.** The mandatory PRD blocker scan (`commands/prd-questions.md` § "Empty Active queue — PRD blocker scan") deduplicates by "wording / intent" but with no canonical comparison key. If the user answers a synthesized blocker question and the scan reruns, the deduplication is heuristic (same intent? slightly different phrasing?) and silently underspecified. There is no test fixture, no example of the dedup criterion in action, and no escape hatch besides "human edits the queue". This compounds into long-running auto-loops if the PRD has many soft blockers.

### Top single highest-leverage "top 1%" addition

**Build the execution-side `.cursor/` half — and bind it to both halves of the workspace.** A new skill family + agents + commands organized as:

- **Agents**: `architect` (system + module design), `implementer` (code-level changes), `verifier` (typecheck + lint + test + build loop), `reviewer` (PR-level review), `domain-guardian` (enforces `zedos/.cursor/rules/`), `security-and-data` (NextAuth, Stripe webhooks, PII), `migration-architect` (specifically for the upcoming Turborepo migration).
- **Commands**: `/explore` (read-only codebase research), `/plan` (technical plan from a `ready-for-user-stories` Scope Slice), `/implement` (drives the implementation loop with verifier feedback), `/fix` (targeted bug fix), `/review` (PR review), `/pr` (open PR with babysit-style hygiene), `/commit` (well-formed conventional commit).
- **Skills**: `add-usecase`, `add-driven-adapter`, `add-driving-endpoint`, `add-prisma-migration`, `add-stripe-webhook`, `wire-nextauth-flow`, `verify-architecture-boundaries`, `split-technical-story` (mirrors ZedOS), and `migrate-to-turborepo` (the user's stated upcoming initiative).
- **Glue**: a new top-level `AGENTS.md` (or `AGENTS.mdc` rule) that explicitly reuses and **promotes** `zedos/.cursor/rules/01..05` into `.mdc` form with proper `globs`, plus a new rule `70-execution-bridge.mdc` that says: "User Story authoring takes a `ready-for-user-stories` Scope Slice as input; the User Story file template lives at `.cursor/templates/execution/user-story.template.md`; once a User Story is written, `/implement` runs against it under SISO EXECUTION mode."

The single highest-leverage addition is **the `/implement` command + `verifier` agent + the `70-execution-bridge.mdc` rule**, because they close the open seam between governance and code with a contract that is already prepared for it (Scope Slices have `Acceptance-Level Outcome`, `UX States`, `Data Touched` — these are *already* a perfect input shape for an `/implement` loop).

### Doc location

`/Users/romainpiveteau/Projects/ZedTech/zedos.app/docs/retro/cursor-setup-retro.md`

---

## 2. Inventory: what's currently in `.cursor/`

Source: `find /Users/romainpiveteau/Projects/ZedTech/zedos.app/.cursor/ -type f` returned **31 files / 5006 lines**.

### 2.1 Agents

| File | Lines | Frontmatter `model` | Purpose | Completeness |
|---|---:|---|---|---|
| `agents/prd/prd-lead.md` | 86 | `claude-opus-4-7` *(invalid slug)* | Pre-flight context brief for `/prd converge|challenge|prioritize|update`. Reads PRD/state/notes/questions/decisions; produces a 8-section brief. **No file writes.** | High substance; fails on slug, no example brief output. |
| `agents/prd/prd-challenger.md` | 152 | `gpt-5.5` *(invalid slug)* | Adversarial agent. False-convergence checks (8 surface-dimension probes), drift detection, mandatory 8 default checks, materiality filter, staleness enforcement. | Strong content — among the best artifacts in the repo. Slug invalid. |
| `agents/prd/prd-researcher.md` | 71 | `claude-opus-4-6` *(invalid slug)* + `is_background: true` *(undocumented)* | Brings outside-the-room context, evidence tagging `[VALIDATED]/[INFERRED]/[ASSUMED]/[UNKNOWN]`. | Reasonable; `is_background` not in any Cursor agent frontmatter docs I can find. |
| `agents/prd/README.md` | 45 | n/a | Operating principle and committee map. | Useful but partially duplicates `commands/prd.md`. |
| `agents/feature-area/feature-area-lead.md` | 99 | `claude-opus-4-7` *(invalid)* | Decomposition coherence brief. Reads PRD + open-questions + product-decisions + all FA + all SS. **No file writes.** | High substance; same slug bug. |
| `agents/feature-area/scope-critic.md` | 144 | `claude-opus-4-7` *(invalid)* | Adversarial agent for FA/SS. Premature decomposition, architectural language detection, v0 boundary violations, hidden blockers, sizing problems, scope overlap, terminology drift. | Excellent content. Same slug bug. |
| `agents/feature-area/README.md` | 92 | n/a | Operating principle for `map → scaffold → validate → promote → slice → scaffold-slices → refine-slice → promote-slice → check`. | Best of the README.mds; partially redundant with command. |

**Notable absences:**
- No `architect`, `implementer`, `verifier`, `reviewer`, `domain-guardian`, `security`, `migration-architect`, `monorepo-explorer`, `test-runner` (all of which ZedOS has and Zedos will need).
- No `prd-summarizer` / `prd-historian` — the system relies on `prd-lead` to read everything every time, which is wasteful and brittle as PRD grows.
- No `cost-and-pricing` agent (despite Zedos having a Stripe + credit ledger product where pricing is a first-class concern).

### 2.2 Commands

| File | Lines | Purpose | Completeness |
|---|---:|---|---|
| `commands/prd.md` | 450 | Master `/prd <mode>` orchestrator: `init / discover / questions / note / converge / challenge / prioritize / update`. Defines 8 default challenge checks, full Patch Intent Summary + PRD Delta Proposal contract, approval semantics. | **Outstanding** — the strongest single artifact in the workspace. Long but earned. |
| `commands/prd-init.md` | 83 | Bootstrap empty `docs/prd/` workspace from `.cursor/templates/prd/`. Placeholder replacement, safety rules. | Clean and complete. |
| `commands/prd-questions.md` | 167 | Human-first one-question-at-a-time loop with PRD blocker scan, Current truth resolution, supersession annotations. | Solid; has the dedup risk noted in §1. |
| `commands/feature-area.md` | 583 | Master `/feature-area <mode>`: `map / scaffold / validate / promote / slice / scaffold-slices / refine-slice / promote-slice / check`. | **Excellent** content but biggest single command file in the repo — hard to scan. |
| `commands/execute-prd.md` | 63 | `init / scan / next / run-one / loop` for the autonomous governance loop. | Spartan vs. its weight; defers to skill + rule. |

**Notable absences:**
- No `/explore` (codebase research; ZedOS has it).
- No `/plan` (technical planning from a Scope Slice).
- No `/implement` (code execution loop).
- No `/review` (PR / change review).
- No `/pr` (open / update a PR).
- No `/commit` (well-formed commit message + atomic stage).
- No `/fix` (targeted bug fix loop).
- No `/improve` / `/improve-config` (ZedOS pattern for self-improvement).
- No `/help` or `/list` for the human to discover modes.

### 2.3 Skills

| File | Lines | `disable-model-invocation` | Purpose |
|---|---:|---|---|
| `skills/prd/prd-builder/SKILL.md` | **741** | `true` | The operational engine of `/prd`. PRD Completeness Model, Surface Gate, Convergence Loop, Feature Group Template, ICE scoring, Convergence Checks, Persistence (Patch Intent vs Delta Proposal), Drift signals, anti-patterns. |
| `skills/feature-area/feature-area-builder/SKILL.md` | **344** | `true` | Drives `/feature-area`. Map / scaffold / validate / promote / slice / scaffold-slices / refine-slice / promote-slice / check. |
| `skills/execution-loop/SKILL.md` | 125 | `true` | Drives `/execute-prd`. Schema-bound queue rebuild + selection. |

**SKILL.md compliance vs Cursor's `create-skill` skill:**
- `prd-builder/SKILL.md` is **741 lines** — Cursor's own create-skill skill says "Keep SKILL.md Under 500 Lines" and "use progressive disclosure for detailed content" (`/Users/romainpiveteau/.cursor/skills-cursor/create-skill/SKILL.md` §"2. Keep SKILL.md Under 500 Lines"). The PRD Builder content is excellent but should be split into `SKILL.md` (under 200 lines, the loop) + `convergence.md` + `surface-gate.md` + `ice.md` + `persistence.md`.
- `feature-area-builder/SKILL.md` is **344 lines** — under the cap but pushing it; large overlap with `commands/feature-area.md`.
- `execution-loop/SKILL.md` is fine sizewise but is mostly a re-statement of `rules/execution-loop.mdc` with mode wiring.
- All three correctly set `disable-model-invocation: true` (good — skills only load when named explicitly).
- All three skill descriptions include WHAT and WHEN — that part is solid.

**Notable absences:**
- No code-side skills at all (no `add-usecase`, `add-route`, `add-prisma-migration`, `add-stripe-webhook`, `wire-nextauth-flow`, `add-canvas`, `add-react-component`).
- No `explore-codebase` or `monorepo-explorer` skill.
- No `verify-architecture-boundaries` skill that consumes `zedos/.cursor/rules/01-architecture-layers.md`.

### 2.4 Templates

| File | Lines | Purpose |
|---|---:|---|
| `templates/prd/PRD.template.md` | 89 | Canonical PRD scaffold with `{{PLACEHOLDER}}` markers. |
| `templates/prd/state.template.md` | 12 | Tracker (`VERSION`, `DIRECTION`, `LAST_MAJOR_CHANGE`). |
| `templates/prd/history.template.md` | 12 | Version log. |
| `templates/prd/discovery-note.template.md` | 29 | Per-note format for `docs/prd/notes/`. |
| `templates/prd/open-questions.template.md` | 20 | Active + Answered queue tables. |
| `templates/prd/product-decision.template.md` | 25 | PD-NNN scaffold (id, status, date, related_prd_version, context, decision, consequences, links). |
| `templates/prd/product-decisions-readme.template.md` | 9 | Folder readme for `docs/product-decisions/`. |
| `templates/product/feature-area.template.md` | 142 | FA template (Status, NEED_HUMAN/UPDATE, PRD Source, Product Intent, In/Out Scope, Business Objects, Journeys, Dependencies, Risks, Open Blockers, Candidate Scope Slices, Readiness Verdict, Changelog). |
| `templates/product/scope-slice.template.md` | 155 | SS template with all the cross-cutting impact sections (credit, sharing, feedback, UX states, data, dependencies, blockers, acceptance, readiness checklist). |

**Coverage:** Solid for product discovery and decomposition. **Total absence** of execution templates: no `user-story.template.md`, no `spec.template.md`, no `task.template.md`, no `architecture-decision-record.template.md` (though `product-decision.template.md` exists, ADRs for the code base are different), no `change-summary.template.md` for PRs.

**Internal coherence:** Two placeholder styles are mixed (`{{UPPER_SNAKE}}` for PRD templates, HTML comments `<!-- ... -->` for product templates). The discovery-note template's `{{TIMESTAMP_OR_SEQUENCE}}` placeholder is at odds with the prescriptive ISO format in `rules/11-prd-question-loop.mdc`.

### 2.5 Checkers

| File | Lines | Purpose |
|---|---:|---|
| `checkers/scope-readiness-checker.md` | 359 | FA-01..FA-09 + SS-01..SS-11 + CC-01..CC-05 + Allowed product-level terms + Summary Output Format. |

**Strengths:** Mechanical, citable, used as the only source of CLEAR/BLOCKED verdicts. ZedOS has nothing equivalent at this granularity.

**Weaknesses:**
- 359 lines is heavy for a single checker. Would benefit from splitting into `feature-area-checks.md`, `scope-slice-checks.md`, `cross-cutting-checks.md` with a thin index — same progressive-disclosure principle as for SKILL.md.
- No code-execution-side equivalent (no architecture-readiness checker, no PR-readiness checker, no production-readiness checker).
- No machine-readable schema. The check IDs (FA-01, SS-03, CC-04) are stable but never declared in JSON/YAML for scripted querying.

### 2.6 Rules

| File | `alwaysApply` | Lines | Purpose |
|---|---|---:|---|
| `rules/00-siso.mdc` | **true** | 91 | SISO — request-quality gate; CHAT/DISCOVERY/EXECUTION classification; PRD Discovery Exception. |
| `rules/10-prd-discovery.mdc` | (no globs / no alwaysApply per file inspection) | 146 | PRD Governance — delta principle, surface discipline, canonical templates, persistence vs capture, version bumps. |
| `rules/11-prd-question-loop.mdc` | (no globs) | 166 | One-question loop, discovery note format, supersession, empty-queue invariant. |
| `rules/feature-area-workflow.mdc` | `globs: docs/product/**, docs/prd/**, .cursor/templates/product/**, .cursor/checkers/**` | 283 | The decomposition contract: terminology, forbidden actions per layer, readiness gates, decomposition rules, blocker rules, anti-patterns. |
| `rules/execution-loop.mdc` | `globs: docs/WORK_QUEUE.md, docs/BLOCKERS.md, docs/EXECUTION_LOG.md, docs/EXECUTION_LOCK.md, docs/POINTS_OF_ATTENTION.md, docs/product/**, docs/prd/**` | 209 | Queue/blocker/lock/log schema; selection priority a–j; safety invariants; v0 implementation stop. |

**Notable absences:**
- No `20-stack.mdc` (Next.js 14, Prisma, NextAuth, Stripe, Tailwind, React Query, Vitest specifics).
- No `30-hex-boundaries.mdc` (the `zedos/.cursor/rules/01-architecture-layers.md` content lifted into a real `.mdc` rule with `globs: zedos/nextjs_space/src/**`).
- No `40-database.mdc` for Prisma schema/migrations.
- No `50-testing.mdc` (Vitest conventions; existing tests show colocation pattern but it's not codified).
- No `60-pr-sizing.mdc` (ZedOS has it; useful for split-to-prs alignment).
- No `70-security-pii.mdc` for NextAuth/Stripe/PII.
- No `80-i18n.mdc` even though the PRD explicitly says "i18n-ready without multi-language UI in v0".
- No `90-change-policy.mdc` (ZedOS has it).

### 2.7 Hooks

| File | Notes |
|---|---|
| `hooks.json` | `{"version": 1, "hooks": {}}` — empty. |
| `hooks/before-submit-prompt.mdc` | Tombstone explaining the deprecated PRD routing hook. |

**Net:** zero active hooks. No safety nets (e.g. block `git push --force`, block writes to `docs/prd/PRD.md` outside `/prd update`, format-on-save, secret scanning, link-check after PRD writes).

### 2.8 Notable absences across the whole tree

- No `AGENTS.md` (or `agents.md`) at workspace root — the modern Cursor convention for top-level agent context.
- No `.cursor/cli-config.json` / no statusline config.
- No canvas usage anywhere despite the canvas skill being available.
- No babysit/PR loop integration despite the babysit skill being available.
- No split-to-prs integration despite the skill being available.
- No `.cursor/transcripts/` retention or chat ↔ PRD bridge.
- No `.cursor/scripts/` for hook scripts, validation tools, or CLI helpers.
- No `.cursor/templates/execution/` (the entire execution side).
- No `.cursor/checkers/` analogs for code (architecture-readiness, PR-readiness).

---

## 3. Conceptual architecture review

### 3.1 The flow today

```
user idea
  → /prd init                                (bootstrap docs/prd/, docs/product-decisions/)
  → /prd discover, /prd note, /prd questions (capture loop, no PRD writes)
  → /prd converge                            (synthesize, propose; no writes)
  → /prd challenge                           (adversarial; no writes)
  → /prd prioritize                          (ICE rerank; no writes)
  → /prd update                              (Patch Intent or Delta Proposal → approved → write PRD.md)

  → /feature-area map                        (PRD → FA map proposal; no writes)
  → /feature-area scaffold                   (writes docs/product/feature-areas/*.md)
  → /feature-area validate <name>            (FA-01..FA-09 + CC; no writes)
  → /feature-area promote <name>             (narrow validated transition; writes)
  → /feature-area slice <name>               (proposes Scope Slices; no writes)
  → /feature-area scaffold-slices <name>     (writes docs/product/scope-slices/*.md)
  → /feature-area refine-slice <path>        (edits product-level body)
  → /feature-area promote-slice <path>       (narrow ready-for-user-stories transition)
  → /feature-area check <path>               (FA or SS checker run)

  → /execute-prd init / scan / next / run-one / loop
       └── orchestrates the above; never writes code.

  → ???  (User Story / Spec / Task / code — no workspace governance)
```

This flow is **rigorously gated, traceable, and adversarially reviewed up to and including `/feature-area promote-slice`**. Then it stops.

### 3.2 Where the workspace `.cursor/` excels

- **Surface discipline** (`prd-builder` §3.0.5 + Challenger false-convergence checks). This is the single best idea in the system. Most AI PRD tools generate clean prose that *looks* converged but smuggles surface decisions silently. The Surface Block + UNKNOWN-as-valid-answer + Confidence cap at 4 is unusually rigorous.
- **Patch Intent Summary vs full PRD Delta Proposal** — the "approval ladder" with explicit `approved / preview / cancel` semantics, refusal of `ok` as approval, and the rule that scaffolding doesn't auto-archive. This is best-in-class.
- **`validated-with-open-surface` status** — recognizing that "we agree on user value but the surface is unknown" is its own state, distinct from `validated`. Most PRD frameworks have only "draft / approved" or "exploratory / committed".
- **PRD Lead pre-flight as a non-writing context-reconstruction agent** before every PRD action. Forces "read the world before acting" without conflating reading with writing.
- **Scope Critic as a separate persona from the FA Builder** — adversarial review explicitly factored out so the builder doesn't grade its own work.
- **Current truth resolution** for Answered queue (PRD wins post-persistence; later answers win otherwise; explicit `SUPERSEDED by` annotations). This is a real solution to a real problem (queue drift).
- **Hard separation of CHAT / DISCOVERY / EXECUTION** in SISO with the PRD Discovery Exception so rough founder input is never blocked. Matches the user's working style.

### 3.3 Where the abstraction breaks down

- **The Scope Slice → User Story handoff is unimplemented.** Every skill says "next layer is owned by a separate workflow" — that workflow does not exist. `EXECUTION_LOG.md` shows two rows total (init + one scan); there is no record of any artifact ever advancing past `/feature-area scaffold-slices`. The system as built can run forever on the left half without producing a single line of code.
- **`/execute-prd` is a queue manager, not an execution engine.** Its name is misleading. It doesn't execute a PRD; it choreographs governance ops on FA/SS markdown files. A more honest name: `/governance-loop` or `/scope-loop`.
- **No bridge between `docs/product/scope-slices/*.md` and `zedos/nextjs_space/src/**`.** The Scope Slice's `Data Touched` and `Acceptance-Level Outcome` sections are perfect inputs for an `/implement` agent — but no such agent reads them.
- **No bridge between `zedos/.cursor/rules/*.md` and the workspace `.cursor/rules/*.mdc`.** The architecture rules exist (and are actually quite good), but they're plain `.md` and live in a sibling tree the workspace governance never references.
- **Verification loops are absent.** No "after each Patch Intent Summary writes PRD.md, run a sanity check that no required sections are now empty" hook. No "after `/feature-area promote-slice`, verify the parent FA still passes its own checker". No CI integration.
- **No memory / context persistence pattern.** Chat transcripts are stored under `~/.cursor/projects/.../agent-transcripts/` (visible to this very analysis), but there is no rule that says "before `/prd converge`, scan the most recent N transcripts for unresolved threads". The system relies entirely on `docs/prd/notes/` as the only memory — fine for human-driven discovery, fragile for autonomous mode.
- **No multi-model orchestration.** Different agents *declare* different models (good intent), but there is no rule about which model to use for which task, no fallback, no cost/latency consideration, no Composer-2-Fast for low-stakes capture.

### 3.4 Comparison to ZedOS's execution-side `.cursor/`

From `tree.md` lines ~152–201, ZedOS's `.cursor/` has:

| Layer | ZedOS | Zedos (workspace) | Gap |
|---|---|---|---|
| **Agents** | architect, bugfix, domain-guardian, drizzle-persistence, event-contracts, improver, monorepo-analyst, monorepo-explorer, nest-integration, security-pii, test-runner, verifier (12) | prd-lead, prd-challenger, prd-researcher, feature-area-lead, scope-critic (5) | Zedos has 0 execution agents. |
| **Commands** | ask, commit, explore, fix, implement, improve-config, improve, plan, pr, prompt, rebase, review (12) | prd, prd-init, prd-questions, feature-area, execute-prd (5) | Zedos has 0 code commands. |
| **Rules** | 00-project-context, 05-monorepo-context, 10-hexagonal-boundaries, 20-eventing, 30-nest-wiring, 40-drizzle, 50-testing, 60-pr-sizing, 90-change-policy (9) | 00-siso, 10-prd-discovery, 11-prd-question-loop, feature-area-workflow, execution-loop (5) | Different shape entirely; ZedOS's are stack-aware, Zedos's are workflow-aware. The two should **coexist** — Zedos workspace rules are not redundant with ZedOS-style rules; they're orthogonal. |
| **Skills** | add-driven-adapter, add-driving-endpoint, add-drizzle-migration, add-eventbridge-dispatch, add-sqs-consumer, add-usecase, explore-monorepo, improve-config, improve-from-review, split-technical-story, sync-contracts (11) | prd-builder, feature-area-builder, execution-loop (3) | Zedos has 0 code-pattern skills. |
| **Plans** | `.cursor/plans/` directory present | n/a | Zedos has no equivalent plan persistence directory. |

**Philosophy difference (read carefully):** ZedOS is execution-mature and product-light. Zedos workspace is product-mature and execution-light. Neither is wrong; they each correctly reflect what their team needed first. The "top 1%" goal means **adopting ZedOS's execution shape without dropping Zedos's product rigor** — and explicitly designing the seam between them.

### 3.5 The "missing half"

To make this concrete, the missing half includes:

```
.cursor/
├── agents/
│   └── execution/
│       ├── architect.md
│       ├── implementer.md
│       ├── verifier.md
│       ├── reviewer.md
│       ├── domain-guardian.md
│       ├── security-and-data.md
│       └── migration-architect.md       (specifically for Turborepo migration)
├── commands/
│   ├── explore.md
│   ├── plan.md
│   ├── implement.md
│   ├── review.md
│   ├── pr.md
│   ├── commit.md
│   ├── fix.md
│   ├── improve.md
│   └── help.md
├── skills/
│   └── execution/
│       ├── add-usecase/SKILL.md
│       ├── add-driving-route/SKILL.md
│       ├── add-driven-adapter/SKILL.md
│       ├── add-prisma-migration/SKILL.md
│       ├── add-stripe-webhook/SKILL.md
│       ├── wire-nextauth-flow/SKILL.md
│       ├── add-react-component/SKILL.md
│       ├── verify-architecture-boundaries/SKILL.md
│       ├── explore-codebase/SKILL.md
│       └── migrate-to-turborepo/SKILL.md  (for the upcoming initiative)
├── templates/
│   └── execution/
│       ├── user-story.template.md
│       ├── spec.template.md
│       ├── task.template.md
│       ├── architecture-decision-record.template.md
│       └── pr-description.template.md
├── checkers/
│   ├── architecture-readiness-checker.md
│   ├── pr-readiness-checker.md
│   └── production-readiness-checker.md
├── rules/
│   ├── 20-stack.mdc                      (Next.js / React / Tailwind specifics)
│   ├── 30-hex-boundaries.mdc             (lifts zedos/.cursor/rules/01)
│   ├── 40-database.mdc                   (Prisma + migrations)
│   ├── 50-testing.mdc                    (Vitest conventions)
│   ├── 60-pr-sizing.mdc                  (per-PR delta budget)
│   ├── 70-security-pii.mdc               (NextAuth + Stripe + PII)
│   ├── 80-i18n.mdc                       (i18n-ready stance from PRD)
│   └── 90-change-policy.mdc              (cross-cutting policy)
├── hooks.json                             (real entries; see §6)
└── AGENTS.md                              (top-level agent context, replaces the README scattering)
```

---

## 4. Per-artifact gap analysis (severity + concrete improvement)

### 4.1 Agents

#### CRITICAL — agent `model:` slugs are not valid

- `agents/prd/prd-lead.md:3` `model: claude-opus-4-7`
- `agents/prd/prd-challenger.md:3` `model: gpt-5.5`
- `agents/prd/prd-researcher.md:3` `model: claude-opus-4-6` + `is_background: true`
- `agents/feature-area/feature-area-lead.md:3` `model: claude-opus-4-7`
- `agents/feature-area/scope-critic.md:3` `model: claude-opus-4-7`

**Improvement:** Replace with documented slugs. Concrete mapping (subject to user confirmation — do not silently choose):

| Agent | Current | Proposed | Rationale |
|---|---|---|---|
| prd-lead | `claude-opus-4-7` | `claude-opus-4-7-thinking-xhigh` | Reads many files, produces structured brief — high reasoning, high context. |
| prd-challenger | `gpt-5.5` | `gpt-5.5-medium` | Adversarial, lots of pattern matching — `gpt-5.5-medium` is an explicit valid slug. |
| prd-researcher | `claude-opus-4-6` + `is_background: true` | `claude-4.6-opus-high-thinking` (drop `is_background`) | `is_background` is not in any documented agent frontmatter spec; if the user wants background execution that's controlled by `Task.run_in_background` at invocation time. |
| feature-area-lead | `claude-opus-4-7` | `claude-opus-4-7-thinking-xhigh` | Same as prd-lead. |
| scope-critic | `claude-opus-4-7` | `claude-4.6-opus-high-thinking` (or `claude-opus-4-7-thinking-xhigh`) | Diversification — having Critic on a different model than Lead reduces correlated blind spots. |

#### HIGH — README.md files duplicate command content

- `agents/prd/README.md` re-explains the operating principle that already lives in `commands/prd.md` Pre-flight + Modes.
- `agents/feature-area/README.md` re-explains the workflow that already lives in `commands/feature-area.md` Pre-flight + Modes.

**Improvement:** Delete or shrink to a 10-line index that links to the command. Single source of truth.

#### HIGH — no example brief output for either Lead

Neither `prd-lead.md` nor `feature-area-lead.md` includes a worked example brief. The output template is provided but a reader cannot tell whether the agent's actual outputs match.

**Improvement:** Add `examples.md` next to each Lead with one realistic brief, anchored to the current `docs/prd/PRD.md`.

#### MEDIUM — no agent for PR / change review

There is a `prd-challenger` (adversarial on PRD) and a `scope-critic` (adversarial on FA/SS) but no equivalent `change-reviewer` for PRs or commits. This is symmetric drift: adversarial review only on the left half.

**Improvement:** Add `agents/execution/reviewer.md` and `agents/execution/verifier.md` (see §6).

### 4.2 Commands

#### CRITICAL — no `/explore`, `/implement`, `/plan`, `/review`, `/pr`, `/commit`, `/fix`

Already covered. Single biggest gap.

#### HIGH — `commands/feature-area.md` is 583 lines, hard to navigate

The 9 modes are exhaustively specified in one file. Each mode has Pre-conditions, Behavior, Output format, Hard rules — readable but not scannable.

**Improvement:** Split into `commands/feature-area.md` (top-level orchestrator + Pre-flight + Hard rules, ~150 lines) and `commands/feature-area/<mode>.md` per mode. Ditto `commands/prd.md` (450 lines → orchestrator + per-mode files).

#### HIGH — `commands/execute-prd.md` defers everything to skill + rule

The 63-line command file is mostly a router to the skill. That's fine in isolation but creates a "where is the truth" problem (3 files: command, skill, rule) where the rule file is 209 lines, the skill 125 lines, and the command 63 lines. Reading order is not obvious.

**Improvement:** Make `execute-prd.md` the canonical mode reference, `execution-loop.mdc` the persistent contract, and `execution-loop/SKILL.md` strictly the operational pseudo-code. Top each file with a one-line "Owner of: …" so the reader knows which to consult.

#### HIGH — no `/help` for humans

A founder running this for the first time has no `/help` command listing modes. The README files help, but a slash command is the natural surface.

**Improvement:** Add `commands/help.md` that prints a one-screen menu of all modes with one-line summaries.

#### MEDIUM — `/prd update` is a hot file (450 lines of orchestration)

The Patch Intent Summary, Delta Proposal, approval semantics, and post-write format are repeated **and slightly differ** between `commands/prd.md` Mode: update and `skills/prd/prd-builder/SKILL.md` §8.

**Improvement:** Move the canonical `Patch Intent Summary` and `PRD Delta Proposal` formats into a single artifact (`templates/prd/persistence.md`) referenced by both. Today the two copies are subtly different (one is named "Files to change", the other "Files to change:" with trailing colon and slightly different bullet structure).

#### MEDIUM — `commands/prd.md` and `rules/10-prd-discovery.mdc` have overlapping persistence rules

Same content restated. Drift risk.

**Improvement:** Have the rule define invariants and the command define operations. Each invariant lives once.

### 4.3 Skills

#### HIGH — `prd-builder/SKILL.md` is 741 lines

Cursor's own `create-skill` skill explicitly says: "For optimal performance, the main SKILL.md file should be concise. Use progressive disclosure for detailed content" and "Keep SKILL.md Under 500 Lines". The PRD Builder content is excellent but it loads a lot of tokens every time the skill is referenced.

**Improvement:** Restructure as:

```
skills/prd/prd-builder/
  SKILL.md                       (~150 lines — activation, references, the loop)
  surface-gate.md                (the §3.0.5 content — the most-cited reference)
  convergence.md                 (the §3 loop)
  feature-group-template.md      (§4)
  ice-scoring.md                 (§5)
  persistence.md                 (§8)
  drift-and-staleness.md         (§§ from 5/6/staleness)
  anti-patterns.md               (§10 with examples)
```

Cursor's skill convention says references are read on demand only — keeps SKILL.md scannable.

#### HIGH — `feature-area-builder/SKILL.md` overlaps heavily with `commands/feature-area.md`

Both files describe each mode's behavior. The skill is supposed to be operational pseudo-code; the command is supposed to be the user surface. Today both contain the full algorithmic description.

**Improvement:** Skill contains "for each mode, do these steps". Command contains "modes available + I/O contract". Cross-reference — don't duplicate.

#### HIGH — no code-stack skills exist

Already covered. `add-usecase`, `add-route`, `add-prisma-migration`, etc., are absent.

#### MEDIUM — `execution-loop/SKILL.md` is essentially restated rule content

Lines 1–125 mostly repeat what's in `rules/execution-loop.mdc`. The skill should be the *how* and the rule the *contract*; today the skill is mostly the contract.

**Improvement:** Skill becomes "1) for `init` do X, 2) for `scan` do Y, …" with the contract in the rule.

### 4.4 Templates

#### HIGH — placeholder style is inconsistent

- `templates/prd/*.md` uses `{{UPPER_SNAKE}}`.
- `templates/product/*.md` uses HTML comments `<!-- ... -->`.

**Improvement:** Pick one. `{{PLACEHOLDER}}` is more agent-friendly (clear lex, easy to grep). Apply across all templates. Then update `commands/prd-init.md` § "Placeholder replacement" to reflect the unified convention for all templates, not just PRD.

#### HIGH — discovery-note template's `{{TIMESTAMP_OR_SEQUENCE}}` contradicts the rule

`rules/11-prd-question-loop.mdc` § "Discovery note format" prescribes:
```
## <YYYY-MM-DD HH:mm> — <short title>
```
The template has a generic `{{TIMESTAMP_OR_SEQUENCE}}` placeholder that allows non-conforming notes.

**Improvement:** Tighten template placeholder to `{{ISO_TIMESTAMP}}` and document the format inline.

#### HIGH — no execution templates

No `user-story.template.md`, `spec.template.md`, `task.template.md`, `pr-description.template.md`. The PRD-side has every template you'd want; the execution side has zero.

**Improvement:** Add `.cursor/templates/execution/` with at minimum:
- `user-story.template.md` (with Acceptance, Definition of Done, parent Scope Slice link, NEED_HUMAN flags).
- `spec.template.md` (behavioral spec — observable behavior, not implementation).
- `task.template.md` (small unit, parent Spec link).
- `pr-description.template.md` (linked artifacts, change scope, verification, deliberate omissions).
- `architecture-decision-record.template.md` (proper ADR format — the existing `product-decision.template.md` is product, not architecture).

#### MEDIUM — `product-decision.template.md` is named ambiguously

It is a *product* decision template (PD-NNN). An ADR is an *architecture* decision (different audience). The current naming risks one being used for the other.

**Improvement:** Keep `product-decision.template.md` as is. Add `architecture-decision-record.template.md` separately. Document the distinction in `templates/README.md` (which doesn't exist yet — add it).

### 4.5 Checkers

#### HIGH — `scope-readiness-checker.md` is 359 lines, cited from many places

`commands/feature-area.md`, `skills/feature-area/feature-area-builder/SKILL.md`, `rules/feature-area-workflow.mdc`, `rules/execution-loop.mdc`, and both committee READMEs reference this file. Any change becomes a multi-edit migration.

**Improvement:** Split:
- `checkers/feature-area-checker.md` (FA-01..FA-09)
- `checkers/scope-slice-checker.md` (SS-01..SS-11)
- `checkers/cross-cutting-checker.md` (CC-01..CC-05)
- `checkers/allowed-product-terms.md`
- `checkers/index.md` (citation surface)

Citations point at `checkers/index.md` which routes to the leaf file. One-edit-per-change.

#### HIGH — no machine-readable check schema

Check IDs are stable (FA-01 etc.) but not declared as data. Future automation cannot enumerate or diff them programmatically.

**Improvement:** Add `checkers/checks.json` listing every check with id, scope, severity, depends_on. Lets an `/execute-prd next` step compute "this artifact will block on these checks" without re-reading prose.

#### CRITICAL — no execution-side checkers

Already covered — no architecture-readiness, no PR-readiness, no production-readiness.

### 4.6 Rules

#### CRITICAL — `rules/execution-loop.mdc` `forbidden_files` defaults are wrong for Zedos

The rule (§8) says `forbidden_files` defaults to `src/**, app/**, packages/**, lib/**`. The actual Zedos code lives at `zedos/nextjs_space/src/**` and `zedos/nextjs_space/app/**`. Globs against `src/**` from repo root will not match.

This is a CRITICAL safety hole: an autonomous loop could write to `zedos/nextjs_space/src/**` because `src/**` from repo root doesn't match it.

**Improvement:**

```
forbidden_files:
  - src/**
  - app/**
  - packages/**
  - lib/**
  - zedos/**/src/**
  - zedos/**/app/**
  - zedos/**/prisma/**
  - zedos/**/public/**
  - zedos/**/scripts/**
  - zedos/.cursor/**            (architecture rules — protected)
```

And — more importantly — invert the model: `allowed_files` should be a positive whitelist (the docs/governance paths), and any file outside the whitelist is forbidden by default. This is the "default deny" the rule already aspires to but doesn't enforce because the whitelist of forbidden paths is incomplete.

#### HIGH — no stack-aware rules

No `20-stack.mdc`, `30-hex-boundaries.mdc`, `40-database.mdc`, `50-testing.mdc`, `60-pr-sizing.mdc`, `70-security-pii.mdc`, `80-i18n.mdc`, `90-change-policy.mdc`. These are exactly what the upcoming "next feature area" + Turborepo migration will need.

**Improvement:** Author them iteratively — start with `30-hex-boundaries.mdc` because the user already has `zedos/.cursor/rules/01-architecture-layers.md` content to lift.

#### HIGH — `00-siso.mdc` doesn't classify `/feature-area` modes

It explicitly enumerates PRD modes and execution behavior, but `/feature-area scaffold`, `/feature-area scaffold-slices`, `/feature-area refine-slice`, `/feature-area promote-slice`, `/feature-area promote` are file-writing operations that arguably need their own SISO classification (DISCOVERY-with-write or a new mode). Today they slip in via the general "feature-area workflow" category.

**Improvement:** Add a § to SISO covering `/feature-area` writes: they are DISCOVERY-with-explicit-approval (matching `/prd update` semantics), and the approval is the prior `/feature-area map` / `/feature-area slice` proposal.

#### MEDIUM — overlap between `10-prd-discovery.mdc` and `commands/prd.md`

Same content — version bumps, persistence rules, real-time capture vs persisted PRD. Maintaining both is fragile.

**Improvement:** Rule defines invariants, command defines flow. Apply the same separation as for `feature-area-workflow.mdc` ↔ `commands/feature-area.md` (which is cleaner).

### 4.7 Hooks

#### HIGH — `hooks.json` is empty

`{"version": 1, "hooks": {}}`. The framework is set up, the file exists, but no hook is wired. The `before-submit-prompt.mdc` is a tombstone explaining that hooks are *not* the right place for PRD routing.

**Improvement (concrete hook entries to add):**

| Event | Matcher | Purpose | Fail mode |
|---|---|---|---|
| `beforeShellExecution` | `git push.*--force\|push -f\|reset --hard\|clean -fdx` | Block destructive git commands without explicit approval. | `failClosed: true` |
| `beforeShellExecution` | `rm -rf docs/\|rm -rf \.cursor/` | Block destructive doc/cursor deletions. | `failClosed: true` |
| `afterFileEdit` | `Write\|TabWrite` | If file is `docs/prd/PRD.md`, `docs/prd/state.md`, `docs/prd/history.md`, `docs/prd/archive/**`, **and** the recent assistant turn does not contain `approved` for a Patch Intent Summary or Delta Proposal — block. | `failClosed: true` |
| `afterFileEdit` | `Write\|TabWrite` | If file is `docs/product/feature-areas/**` or `docs/product/scope-slices/**` and the conversation does not contain an approved map / slice proposal — block. | `failClosed: true` |
| `beforeReadFile` | `Read` | If reading `tree.md` and the user is not explicitly asking for a tree dump, warn (file is 26 603 lines, costs context). | `failClosed: false` |
| `afterFileEdit` | `Write\|TabWrite` | If file is `.cursor/rules/*.mdc` or `.cursor/checkers/*.md`, append `EXECUTION_LOG.md` row noting the rule edit (governance audit). | `failClosed: false` |
| `subagentStart` | `prd-lead\|prd-challenger\|prd-researcher\|feature-area-lead\|scope-critic` | Verify the agent's `model:` slug is in the documented list before allowing the spawn (catches the slug bug). | `failClosed: true` |
| `beforeSubmitPrompt` | n/a | If the user prompt contains a `/prd update`, `/feature-area scaffold(-slices)?`, `/feature-area promote(-slice)?` and the SISO classification is unset, inject a one-line reminder of the approval contract. | `failClosed: false` |

These hooks are not optional polish — they are the only way to *enforce* the governance contract that the rules merely *describe*.

---

## 5. SISO rule audit

### 5.1 Is SISO correctly classifying DISCOVERY vs EXECUTION across all current commands?

| Command / mode | What SISO says today | Audit |
|---|---|---|
| `/prd discover`, `/prd note`, `/prd questions` | Always DISCOVERY, never blocked, even rough founder input. | ✅ Correct. The PRD Discovery Exception is the right call. |
| `/prd converge`, `/prd challenge`, `/prd prioritize` | Synthesis; no writes. Implicitly DISCOVERY. | ✅ Correct, but SISO doesn't say so explicitly — it should. |
| `/prd update` | Explicitly carved out: persistence workflow, not implementation; not blocked by SISO. Approval required via Patch Intent Summary / Delta Proposal. | ✅ Correct and well-scoped. |
| `/feature-area map`, `/feature-area slice` | Synthesis; no writes. Should be DISCOVERY. | ⚠️ SISO doesn't mention `/feature-area` modes at all. Gap. |
| `/feature-area scaffold`, `/feature-area scaffold-slices` | Writes after explicit user approval of a prior proposal. Effectively the same shape as `/prd update`. | ⚠️ Not classified by SISO. Gap. |
| `/feature-area refine-slice`, `/feature-area promote-slice`, `/feature-area promote` | Narrow, governed writes. | ⚠️ Not classified by SISO. Gap. |
| `/feature-area validate`, `/feature-area check` | Read-only checker runs. | ⚠️ Not classified by SISO; should be CHAT-equivalent. |
| `/execute-prd init` | Bootstrap, file writes. | ⚠️ Not classified. |
| `/execute-prd scan` | Rebuilds queue from existing artifacts. | ⚠️ Not classified. |
| `/execute-prd next`, `/execute-prd run-one`, `/execute-prd loop` | Recommends next action; `run-one` may invoke a `/feature-area` write mode. | ⚠️ Not classified — biggest gap. The autonomous `loop` mode is exactly the place SISO matters most. |

### 5.2 Edge cases not handled

- **Ambiguous user input mid-`/feature-area scaffold`.** If during a scaffold pass the agent encounters an artifact that the approved map didn't cover, SISO doesn't say what to do. The current behavior (skip) is reasonable but not explicit in the rule.
- **`/execute-prd loop` running for 10 iterations autonomously.** SISO says "the more autonomous the system, the stricter SISO must be" but the loop iteration cap (10) is in `execute-prd.md`, not in SISO. The two should reference each other.
- **Mixed-intent prompts.** A prompt like "let's discover X and also implement Y" is not handled. SISO requires classification *of the request*, not per-segment.
- **Hook-triggered actions.** When a hook fires (e.g. format-on-save) it bypasses the request classification entirely. SISO doesn't address hook actions.
- **MCP tool calls.** SISO doesn't cover MCP tool invocation as EXECUTION (e.g. a Stripe MCP tool call writes data to Stripe).

### 5.3 Drift risk vs evolving workflow

- The `00-siso.mdc` PRD Discovery Exception lists exactly 4 modes (`/prd discover`, `/prd note`, `/prd questions`, "informal PRD discussion"). When a new mode is added (e.g. `/prd retrospect`), SISO will not auto-cover it.
- SISO relies on the agent inferring intent. There is no machine-checkable manifest of "which command IDs are DISCOVERY vs EXECUTION".

**Improvement:** Add `.cursor/manifests/siso-classification.json`:

```json
{
  "version": 1,
  "DISCOVERY": ["/prd discover", "/prd note", "/prd questions",
                "/prd converge", "/prd challenge", "/prd prioritize",
                "/feature-area map", "/feature-area slice",
                "/feature-area validate", "/feature-area check",
                "/execute-prd scan", "/execute-prd next"],
  "DISCOVERY_WITH_APPROVAL": ["/prd update", "/prd init",
                              "/feature-area scaffold", "/feature-area scaffold-slices",
                              "/feature-area refine-slice",
                              "/feature-area promote", "/feature-area promote-slice",
                              "/execute-prd init"],
  "EXECUTION_GATED": ["/execute-prd run-one", "/execute-prd loop"],
  "EXECUTION": ["/implement", "/fix", "/review", "/pr", "/commit", "/migrate"]
}
```

The rule cites the manifest; new modes are added once.

---

## 6. The "top 1%" delta — what's missing entirely

For each missing capability, name + intent + a one-line shape.

### 6.1 Execution-side agents

| Agent | Intent | Triggered by |
|---|---|---|
| `architect` | Designs the implementation shape for a `ready-for-user-stories` Scope Slice. Reads the slice + `zedos/.cursor/rules/*` + nearby code. Produces a technical plan as a chat artifact (no writes). | `/plan` |
| `implementer` | Writes code in `zedos/nextjs_space/**` against an approved technical plan. Bounded by allowed_files. | `/implement` |
| `verifier` | Runs `next lint`, `tsc --noEmit`, `vitest run`, `next build`. Returns PASS/FAIL with first failure. | post-`implement`, pre-PR |
| `reviewer` | Reads a diff + linked artifacts (Slice → Story → Spec → Task). Returns review comments. | `/review` |
| `domain-guardian` | Enforces `zedos/.cursor/rules/01-architecture-layers.md` and `02-result-type-rOP.md` (no infrastructure imports in domain, no business logic in routes). | hook + `/review` |
| `security-and-data` | Reviews changes touching NextAuth, Stripe webhooks, PII columns in Prisma schema, share-link surfaces. | hook on `prisma/schema.prisma` + Stripe paths |
| `migration-architect` | Specifically scoped to the upcoming Turborepo migration. Knows the current single-app shape (`zedos/nextjs_space/`) and can produce a phased, reversible plan. | `/plan turborepo` |

### 6.2 Execution-side commands

| Command | Intent |
|---|---|
| `/explore <question>` | Read-only codebase research; explores a question, returns a structured answer with file citations. |
| `/plan <slice-path>` | From a Scope Slice, produce a technical plan (architect) as a chat artifact. Approval required before `/implement`. |
| `/implement <plan-id>` | Drives the implement → verify loop. SISO EXECUTION mode. Bounded `allowed_files` (passed by user or scoped by Slice's `Data Touched`). |
| `/fix <issue>` | Targeted bug fix loop. Smaller scope than `/implement`. |
| `/review <branch-or-pr>` | Diff review, posts comments locally or to GitHub. |
| `/pr` | Opens or updates PR with babysit-style hygiene; consumes the babysit skill. |
| `/commit` | Atomic, well-formed commit with conventional commits message; honors `60-pr-sizing.mdc`. |
| `/improve` / `/improve-config` | Self-improvement loops (ZedOS patterns) — improve code from review feedback; improve `.cursor/` setup itself. |
| `/help` | Discovery surface listing all modes, briefly, in one screen. |

### 6.3 Code-quality skills tied to the actual zedos/ stack

Reading `zedos/nextjs_space/package.json` confirms the stack: Next.js 14, Prisma 6.7, NextAuth 4, Stripe 22, React Query, Tailwind, Vitest, Zod. Concrete skills:

| Skill | What it teaches |
|---|---|
| `add-usecase` | Where to put a new use case in the `application/` layer; conventions; tests colocated; Result type. |
| `add-driving-route` | Add a Next.js App Router route handler that delegates to a use case; no business logic in route. |
| `add-driven-adapter` | Add a Prisma adapter implementing a domain port. |
| `add-prisma-migration` | Generate + apply a Prisma migration safely (no breaking changes mid-flight). |
| `add-stripe-webhook` | NextAuth-aware Stripe webhook with idempotency, signature verification, and replay safety. |
| `wire-nextauth-flow` | Add a NextAuth provider, session callback, route protection. |
| `add-react-component` | Mobile-first Tailwind component using Radix primitives + cva, with Vitest snapshot. |
| `verify-architecture-boundaries` | Enforces the hexagonal layering by running ESLint with `eslint-plugin-boundaries` (already in `package.json`) and `tsc`. |
| `explore-codebase` | Mirrors ZedOS's `explore-monorepo` skill — read-first investigation. |
| `migrate-to-turborepo` | Step-by-step phased migration of `zedos/nextjs_space/` into a Turborepo with `apps/web`, `packages/{domain,application,infrastructure,contracts,shared}`. (Direct support for the user's upcoming initiative.) |

### 6.4 Cross-link between PRD/feature-area artifacts and execution artifacts

A new rule `70-execution-bridge.mdc` defines:

- A Scope Slice's `Data Touched` and `Acceptance-Level Outcome` are the canonical inputs to `/plan`.
- A Scope Slice's parent Feature Area's `Business Objects Touched` is the canonical input to `/explore` for "where does this object live in code today".
- Every User Story file under `docs/execution/user-stories/` MUST link back to its parent Scope Slice path.
- Every Spec file MUST link back to its parent User Story.
- A PR description MUST cite the originating Scope Slice + User Story + Spec.

This is the seam ZedOS has via `split-technical-story` and `improve-from-review`. Zedos can do better by *grounding it in the surface-aware Scope Slice* — ZedOS doesn't have surface discipline.

### 6.5 Hooks (pre/post-edit) for governance

See §4.7 above.

### 6.6 Status line / statusline integration

The `statusline` skill (`/Users/romainpiveteau/.cursor/skills-cursor/statusline/SKILL.md`) supports a custom CLI status line with model, ctx %, worktree, etc. None of this is set up.

**Improvement:** Add `~/.cursor/cli-config.json` with a Zedos-specific statusline that surfaces:

- Model + thinking mode
- Context % used
- Current PRD version (parsed from `docs/prd/state.md`)
- Active feature area (if `EXECUTION_LOCK.md` shows one)
- Open blockers count (parsed from `docs/BLOCKERS.md` rows where `Resolution` is empty)
- Surface UNKNOWN count (parsed from `docs/prd/PRD.md` `## Surface Blockers` section)

This is high signal-to-noise for a founder driving the workflow alone.

### 6.7 Canvas usage for analysis artifacts

The `canvas` skill (`/Users/romainpiveteau/.cursor/skills-cursor/canvas/SKILL.md`) instructs to use a canvas for "quantitative analyses, billing investigations, security audits, architecture reviews, data-heavy content, timelines, charts, tables".

This retro itself, the WORK_QUEUE, the BLOCKERS list, the cross-FA dependency graph, and the credit-tier scoring tables in the PRD are all natural canvas candidates.

**Improvement:** Authoring a canvas is non-blocking but high-impact. First two canvases to add:
- `cursor/canvases/work-queue.canvas.tsx` — interactive queue view that reads `docs/WORK_QUEUE.md` + `docs/BLOCKERS.md`.
- `cursor/canvases/prd-coherence.canvas.tsx` — shows the FA → SS dependency graph + surface blockers + open questions.

(File paths above are speculative; canvas skill defines the precise convention.)

### 6.8 Babysit-style PR loop integration

The `babysit` skill exists. Today there's no PR. But the moment `/implement` produces one, babysit becomes the standard "ship it" loop.

**Improvement:** Add `commands/pr.md` that explicitly instructs the agent to load the babysit skill and run its loop after PR open.

### 6.9 Memory / context persistence patterns

The agent transcripts under `~/.cursor/projects/.../agent-transcripts/` are first-class context. Today no rule references them.

**Improvement:** Add a §to `prd-lead.md` and `feature-area-lead.md`:
- "Before producing the brief, scan the most recent N transcripts in this workspace for unresolved threads relevant to the requested mode. Cite by transcript UUID."
The transcript citation idiom is documented in the system prompt for this very session.

### 6.10 Quality gates as agent-driven loops

A `verifier` agent that:
1. Runs `pnpm exec tsc --noEmit` (or `npm` equivalent).
2. Runs `pnpm exec next lint` with the `eslint-plugin-boundaries` enforcement.
3. Runs `pnpm exec vitest run --reporter=verbose`.
4. Runs `pnpm exec next build`.

…and reports PASS/FAIL with the first failing line. `/implement` cannot complete without a `verifier PASS`.

The user's `package.json` has `lint`, no explicit `typecheck` script. Add:

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
}
```

…then the `verifier` agent can simply run `npm run verify`.

### 6.11 Multi-model orchestration patterns

Today every agent declares one model. There is no policy.

**Improvement:** Add `.cursor/agents/MODEL_POLICY.md`:

| Workload | Model | Why |
|---|---|---|
| Long-form context reconstruction | `claude-opus-4-7-thinking-xhigh` | Best at multi-file synthesis. |
| Adversarial / pattern-matching | `gpt-5.5-medium` | Good defaults for skeptical critique without overthinking. |
| High-volume capture / lightweight notes | `composer-2-fast` | Cheap and quick for `/prd note` and discovery routine. |
| Code editing | `claude-opus-4-7-thinking-xhigh` or `gpt-5.5-medium` | User preference; document explicitly. |
| Background/offline tasks | per-task; never tied to `is_background` frontmatter | Documented frontmatter doesn't have it. |

Cite this policy from each agent file's frontmatter `description:` rather than hard-coding the model — which keeps model drift to one file.

---

## 7. Recommended upgrade roadmap (phased)

### Phase 0 — Foundations (consistency pass) — ~1–2 sessions

1. **Fix all agent `model:` slugs** to match the documented Cursor list. (CRITICAL #2.)
2. **Drop `is_background: true`** from `prd-researcher.md` (undocumented frontmatter). Use `Task.run_in_background` at invocation time if needed.
3. **Fix `forbidden_files` in `EXECUTION_LOCK.md` + the rule** to match the actual Zedos paths (`zedos/**/src/**`, etc.) and invert to a default-deny model. (CRITICAL #3 enabler.)
4. **Unify placeholder style** across templates (`{{PLACEHOLDER}}` everywhere).
5. **Unify naming**: drop legacy "Feature Group" / "Feature Area" drift in narrative (PRD source citations remain the only allowed legacy mention).
6. **Delete or repurpose** `hooks/before-submit-prompt.mdc` (tombstone).
7. **Add `AGENTS.md`** at repo root: 50–80 lines, explains the workspace .cursor setup, links into both halves (when the right half exists).
8. **Add `.cursor/templates/README.md`** distinguishing PRD templates / product templates / execution templates (Phase 1).
9. **Add `siso-classification.json`** manifest and reference from `00-siso.mdc`.

### Phase 1 — Build the execution-side counterpart — ~3–6 sessions

1. Add `.cursor/agents/execution/` with `architect`, `implementer`, `verifier`, `reviewer`, `domain-guardian`. (`security-and-data`, `migration-architect` can wait one phase.)
2. Add `.cursor/commands/`: `explore`, `plan`, `implement`, `review`, `pr`, `commit`, `fix`, `help`.
3. Add `.cursor/skills/execution/`: at minimum `add-usecase`, `add-driving-route`, `add-driven-adapter`, `verify-architecture-boundaries`, `explore-codebase`. (`add-prisma-migration`, `add-stripe-webhook`, `wire-nextauth-flow`, `add-react-component` follow.)
4. Add `.cursor/templates/execution/`: `user-story.template.md`, `spec.template.md`, `task.template.md`, `pr-description.template.md`, `architecture-decision-record.template.md`.
5. Add `.cursor/checkers/`: `architecture-readiness-checker.md`, `pr-readiness-checker.md`.
6. Add `.cursor/rules/`: `30-hex-boundaries.mdc` (lifts `zedos/.cursor/rules/01`), `40-database.mdc`, `50-testing.mdc`, `60-pr-sizing.mdc`, `70-execution-bridge.mdc` (the seam to PRD/FA/SS).
7. Promote `zedos/.cursor/rules/02-result-type-rOP.md`, `03-sdk-wrapping-pattern.md`, `04-no-business-logic-in-routes.md`, `05-contracts-zod-source-of-truth.md` into proper `.mdc` rules under workspace `.cursor/rules/` with `globs: zedos/nextjs_space/src/**` (and the appropriate sub-paths). Then **delete the `.docx` and `.pdf` duplicates** (they create three sources of truth for one rule).

### Phase 2 — Cross-cutting governance — ~2 sessions

1. **Wire real hooks** (§4.7 above). Especially the writes-without-approval blockers.
2. **Statusline** — add the Zedos-aware status line.
3. **First canvas** — the `work-queue.canvas.tsx` for the `/execute-prd` view.
4. **Babysit integration** in `/pr`.
5. **Verifier loop** wired into `/implement` so `/implement` cannot complete without verifier PASS.
6. **Split oversized skills** (`prd-builder/SKILL.md` → 7-file family; `scope-readiness-checker.md` → 4-file family).
7. **Machine-readable check schema** (`checkers/checks.json`).

### Phase 3 — Integration with the Turborepo migration — ~1 session, then iterate

1. Author `migrate-to-turborepo/SKILL.md` as a phased plan: `apps/web` from current `zedos/nextjs_space/`, `packages/{domain,application,infrastructure,contracts,shared}` carved out from current `src/{domain,application,infrastructure,contracts,shared}` (the layers already align — this migration is unusually clean).
2. Update `30-hex-boundaries.mdc` `globs` post-migration to point at `packages/**/src/**`.
3. Update `forbidden_files` in `execution-loop.mdc` to whitelist the new Turborepo paths.
4. Add `.cursor/skills/execution/sync-contracts.md` (ZedOS pattern) if `packages/contracts` ships zod schemas consumed by both `apps/web` and `packages/application`.
5. Author a `migration-architect` agent that knows both the pre- and post-state and can answer "is this change safe to do before/after the migration?".

### Phase 4 — Integration with the next feature area — ~1 session per FA

For the user's next feature area work:

1. Pick the FA. Run `/feature-area validate`. If `BLOCKED`, capture in `BLOCKERS.md`.
2. Run `/feature-area slice` → review with `scope-critic` → `/feature-area scaffold-slices`.
3. For each Scope Slice: `/feature-area refine-slice` until `/feature-area check` is `CLEAR`, then `/feature-area promote-slice`.
4. **NEW**: For each `ready-for-user-stories` Scope Slice, generate the User Story file from the new `user-story.template.md` (this is the seam currently missing).
5. **NEW**: `/plan <slice-path>` produces an architect plan.
6. **NEW**: `/implement <plan>` — verifier-bounded code changes inside `zedos/nextjs_space/src/**` (or post-migration `packages/**/src/**`).
7. **NEW**: `/review` → `/pr` → `babysit` until merge.
8. After merge, `/execute-prd scan` re-rebuilds queue; `EXECUTION_LOG` records the close.

The pre-migration first feature area is a perfect end-to-end smoke test for Phases 1–2.

---

## 8. Risks & open questions for the user

The following decisions cannot be made without explicit founder input. Listed in priority order.

1. **Language for prompts and artifacts.** The PRD says "English for UI and AI in v0; French planned next; i18n-ready". Should `.cursor/` artifacts (rules, skills, prompts, agent personas) remain English-only (current state)? Or should they be authored bilingual? Recommendation: stay English-only — agent prompts and rules are developer-facing, not user-facing. But confirm.
2. **Should we mirror ZedOS's executor agents directly, or fork them for Zedos's stack?** ZedOS is NestJS + Drizzle + EventBridge + SQS. Zedos is Next.js + Prisma + NextAuth + Stripe + (Vercel?). The agent shapes (architect, implementer, verifier, reviewer, domain-guardian) port cleanly, but the *content* is different. Recommendation: copy the **shape** (one file per role), author the **content** for Zedos's stack.
3. **Multi-model strategy.** Are you OK with Composer-2-Fast for high-volume capture (`/prd note`, `/prd questions`)? Or do you want all agents on Opus/GPT-5.5 for consistency at the cost of latency and tokens?
4. **Hook strictness.** The proposed `failClosed: true` hooks (block writes without approval) are strict. They will occasionally interrupt legitimate flows (e.g. you manually editing PRD.md outside `/prd update` for a typo fix). Are you OK with that interruption? Recommendation: yes, but allow `failClosed: false` on a few read-side hooks.
5. **Where does the User Story → Spec → Task hierarchy live?** Current proposed paths: `docs/execution/user-stories/`, `docs/execution/specs/`, `docs/execution/tasks/`. Or do you prefer `docs/product/user-stories/` (extending the existing pattern)? The split has implications for the `forbidden_files` whitelist, hooks, and the ID conventions in `WORK_QUEUE.md`.
6. **Pre-migration vs post-migration timing for execution-side authoring.** Building the execution side *before* the Turborepo migration means the `forbidden_files` and `globs` will all need updates after the migration. Building *after* means another full feature area passes through the unbuilt seam. Recommendation: build the execution side **before** the migration, document the explicit post-migration update list (it's small — ~6 file edits).
7. **Should the autonomous `/execute-prd loop` be allowed to invoke `/implement`?** Today the loop hard-stops at FA/SS governance. Once `/implement` exists, do you want `loop` to be allowed to chain `validate → promote → slice → scaffold-slices → refine → promote-slice → plan → implement`? Recommendation: **no for v1** — keep the loop strictly governance, require human-issued `/implement`. Revisit when verifier loop is proven robust.
8. **Canvas adoption.** The canvas skill is specifically for "data-heavy content, timelines, charts, tables" — it's a real UI surface, not just markdown rendering. Are you set up to use canvases (i.e. is your Cursor IDE recent enough to render `.canvas.tsx`)? Confirm before authoring them.
9. **Status of `tree.md` (26 603 lines at repo root).** This is presumably an analysis artifact, not a workspace file. Recommend moving it to `docs/retro/inputs/zedOS-tree.md` or similar, and gitignoring the original location. Otherwise it will silently load into context for many tool calls.
10. **Code-side `.cursor/` cleanup.** `zedos/.cursor/rules/` has each rule in `.md` + `.docx` + `.pdf`. Confirm this is intentional (it looks like exported documentation). If unintentional, drop the `.docx` and `.pdf` siblings — having three formats for one rule guarantees drift.

### Things that are ambitious-but-incomplete in the current setup

- **`/execute-prd loop` iteration cap of 10**: this is reasonable for governance ops but never tested with real autonomous chains. There is no observed evidence the loop ever ran past `init` + one `scan` (per `EXECUTION_LOG.md`).
- **`prd-builder` Build Sequence rule**: "may not produce a build sequence unless **at least 3 feature groups were explicitly validated in separate prior turns**". Strong invariant; never reached today (only 2 feature groups exist in `PRD.md`, both at high-level only).
- **Staleness defaults** (14/45/90 days for exploratory/validated/committed). Sensible but no clock — nothing actually triggers a re-challenge after the deadline. Needs a hook or scheduled check.
- **NEED_HUMAN propagation** (CC-04 in checker). Today this is a check, not an automatic propagation — if a Scope Slice flips `NEED_HUMAN=true`, nobody flips its parent FA automatically.
- **Surface cap on Confidence**. Strong invariant; only enforceable manually today (no test confirms it). Easy to drift after several updates.

---

## 9. Specific call-outs that would make the user proud

These are the parts of the current setup that are **already top 1%** and would be a shame to lose during the upgrade. Amplify, don't replace.

### 9.1 The Surface Gate + Confidence cap + `validated-with-open-surface` status

This trio (`prd-builder/SKILL.md` §3.0.5, §5 surface cap, §4 status semantics) is the single most rigorous design pattern in the workspace. It encodes a real failure mode (false convergence via clean prose) and refuses to let the system silently paper over it. **Amplify**: lift this exact pattern into the execution-side checkers (an "Architecture Surface Gate" with fields like data-store, auth-source-of-truth, transaction-boundary, async-vs-sync).

### 9.2 The Patch Intent Summary / PRD Delta Proposal approval ladder

Refusing `ok` as approval. Distinguishing patch from version bump. Distinguishing summarized intent from full Before/After. Approval state stored in chat, not in files. This is best-in-class. **Amplify**: use the same approval ladder for `/implement` (Plan Intent Summary → approved → execute → diff Before/After).

### 9.3 Adversarial roles factored from builders

`prd-challenger` is separate from `prd-builder`. `scope-critic` is separate from `feature-area-builder`. Builders cannot grade their own work. This is a real solution to the "AI agrees with itself" failure mode. **Amplify**: build `code-reviewer` separate from `implementer`; build `architecture-critic` separate from `architect`. Always pair.

### 9.4 PRD Lead and Feature Area Lead as pure context-reconstruction agents

Neither writes anything. Both produce the same shape (numbered context brief with a "Recommended next operation" line). They are explicitly *not* the workflow drivers. This is unusual and correct. **Amplify**: build `architecture-lead` and `migration-lead` as the same shape — read everything, produce a brief, never write.

### 9.5 The "Current truth resolution" rules for Answered queue

PRD wins post-persistence; later answers win otherwise; explicit `SUPERSEDED by` annotations. This is exactly how a real engineering team treats a backlog. Most AI workflows naively let the queue grow until it contradicts itself. **Amplify**: apply the same pattern to PR comments (`SUPERSEDED by PR #N`), and to ADRs (`SUPERSEDED by ADR-NNN`).

### 9.6 Hard separation of capture artifacts vs persisted PRD

`docs/prd/notes/` and `docs/prd/questions/open-questions.md` are explicitly capture artifacts; never blocked by SISO; never confused with PRD persistence. The user can think out loud without the system hallucinating commitments. **Amplify**: extend to a `docs/scratch/` directory for code-side rough drafts that explicitly do NOT get reviewed.

### 9.7 The `0.0/0.5` of process the framework imposes on itself

Read `prd-builder/SKILL.md` §11 "Anti-governance principle":

> If governance overhead exceeds the product clarity gained, the governance system is failing.
> A PRD is a coordination tool, not a ritual artifact. […] When the system starts feeling like work, cut a section — don't add one.

This is a healthy meta-rule. Most teams forget this exists. **Amplify**: print this rule at the top of `AGENTS.md` so every new contributor (human or AI) reads it first.

### 9.8 The `/feature-area scaffold` / `/feature-area scaffold-slices` "skip if non-empty" idiom

Both modes refuse to overwrite non-empty files; explicitly list skipped files in the output. This is genuine idempotency, not the more common "best-effort overwrite". **Amplify**: every execution-side write command (`/implement`, `/commit`, `/pr`) must follow the same idempotency contract: explicitly list what was skipped, why, and the next step.

---

## Appendix A — File audit table (all 31 files)

| Path | Lines | Severity flag | Note |
|---|---:|---|---|
| `agents/feature-area/README.md` | 92 | M | Partial duplicate of `commands/feature-area.md`. |
| `agents/feature-area/feature-area-lead.md` | 99 | C | Invalid `model:` slug. |
| `agents/feature-area/scope-critic.md` | 144 | C | Invalid `model:` slug. |
| `agents/prd/README.md` | 45 | M | Partial duplicate of `commands/prd.md`. |
| `agents/prd/prd-challenger.md` | 152 | C | Invalid `model:` slug. |
| `agents/prd/prd-lead.md` | 86 | C | Invalid `model:` slug. |
| `agents/prd/prd-researcher.md` | 71 | C | Invalid `model:` + undocumented `is_background`. |
| `checkers/scope-readiness-checker.md` | 359 | H | Should split into 4 leaf files + index. |
| `commands/execute-prd.md` | 63 | M | Defers everything to skill+rule; reading order unclear. |
| `commands/feature-area.md` | 583 | H | Largest single file; should split per mode. |
| `commands/prd-init.md` | 83 | L | Clean. |
| `commands/prd-questions.md` | 167 | C | PRD blocker scan dedup ambiguity (CRITICAL #5). |
| `commands/prd.md` | 450 | H | Outstanding content; should split per mode. |
| `hooks.json` | 4 | H | Empty; framework set up but no hooks. |
| `hooks/before-submit-prompt.mdc` | 14 | M | Tombstone; remove. |
| `rules/00-siso.mdc` | 91 | H | Doesn't classify `/feature-area` and `/execute-prd` modes. |
| `rules/10-prd-discovery.mdc` | 146 | M | Overlaps with `commands/prd.md`. |
| `rules/11-prd-question-loop.mdc` | 166 | M | Discovery note format vs template drift. |
| `rules/execution-loop.mdc` | 209 | C | `forbidden_files` defaults wrong for Zedos paths. |
| `rules/feature-area-workflow.mdc` | 283 | L | Cleanest rule file in the set. |
| `skills/execution-loop/SKILL.md` | 125 | M | Restates rule. |
| `skills/feature-area/feature-area-builder/SKILL.md` | 344 | H | Heavy overlap with `commands/feature-area.md`. |
| `skills/prd/prd-builder/SKILL.md` | 741 | H | 50% over Cursor's 500-line ceiling; split into 7 files. |
| `templates/prd/PRD.template.md` | 89 | L | Solid. |
| `templates/prd/discovery-note.template.md` | 29 | M | Placeholder vs rule format drift. |
| `templates/prd/history.template.md` | 12 | L | Solid. |
| `templates/prd/open-questions.template.md` | 20 | L | Solid. |
| `templates/prd/product-decision.template.md` | 25 | M | Naming risk (vs ADR). |
| `templates/prd/product-decisions-readme.template.md` | 9 | L | Solid. |
| `templates/prd/state.template.md` | 12 | L | Solid. |
| `templates/product/feature-area.template.md` | 142 | L | Solid; placeholder style differs from PRD templates. |
| `templates/product/scope-slice.template.md` | 155 | L | Solid; same placeholder note. |

Total: **31 files / 5006 lines**.

---

## Appendix B — Concrete next-action queue (read-only proposal)

If the user approves any of this, the following concrete first batch is recommended (ordered by leverage / risk):

1. **Fix model slugs** in 5 agent files (Phase 0 #1) — 5-minute mechanical edit, eliminates a CRITICAL latent failure.
2. **Fix `forbidden_files`** in `EXECUTION_LOCK.md` + `execution-loop.mdc` (Phase 0 #3) — closes a CRITICAL safety hole.
3. **Add `AGENTS.md`** at workspace root (Phase 0 #7) — single-page entry point for every human and agent.
4. **Add `commands/help.md`** (Phase 1) — discoverability.
5. **Author `commands/explore.md`** + `agents/execution/architect.md` + `agents/execution/verifier.md` + `commands/plan.md` + `commands/implement.md` (Phase 1, smallest viable execution side).
6. **Wire 3 hooks** (Phase 2): `beforeShellExecution` for destructive git, `afterFileEdit` for unauthorized PRD writes, `subagentStart` for invalid model slugs.

Each of these is reversible, small, and high-signal. None of them touch source code in `zedos/nextjs_space/**`.

---

## Appendix C — What this retro deliberately did NOT do

Per the user's constraints:

- No source files were modified.
- No `.cursor/` files were modified.
- No `/prd`, `/feature-area`, or `/execute-prd` mode was invoked.
- No SISO approval flow was triggered.
- No Patch Intent Summary or PRD Delta Proposal was produced.
- No autonomous loop was started.
- This document is the only artifact created.

To act on any finding, the user should explicitly approve the upgrade roadmap (or any subset of it), and only then should `/prd update`, `/feature-area scaffold` family, or new `.cursor/` authoring begin.

— end of retro —
