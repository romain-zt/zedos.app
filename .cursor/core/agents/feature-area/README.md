# Feature Area Committee

Two specialized agents that govern Feature Area decomposition from PRD Feature Groups toward Scope Slices.

This is **AI-assisted decomposition governance**: proposals and checks precede decomposition; **`/feature-area scaffold`** writes Feature Area markdown from an approved Feature Area Map; **`/feature-area scaffold-slices`** writes Scope Slice markdown from an approved `/feature-area slice` proposal. The Feature Area Builder skill drives the workflow; the agents provide context reconstruction and adversarial review.

## Members

| Agent | File | Responsibility |
|-------|------|----------------|
| Feature Area Lead | [`feature-area-lead.md`](./feature-area-lead.md) | Global decomposition coherence — reconstructs PRD-to-FA-to-SS state before Feature Area operations |
| Scope Critic | [`scope-critic.md`](./scope-critic.md) | Stress-tests proposals for premature decomposition, architectural language, v0 boundary violations, and hidden blockers |

## Operational core

The [`feature-area-builder`](../../skills/feature-area/feature-area-builder/SKILL.md) skill drives the decomposition loop: PRD-to-Feature-Area mapping, **`scaffold` file writes** after map approval, checker-based validation, Scope Slice proposals, **`scaffold-slices` file writes** after slice approval, and **`refine-slice` / `promote-slice`** on Scope Slice files. Feature Area Lead and Scope Critic provide context and adversarial viewpoints — they do not drive the workflow.

## Operating principle

```txt
/feature-area map
  → [feature-area-lead context brief]
  → builder proposes Feature Area map
  → [scope-critic reviews proposal]
  → user approves map

/feature-area scaffold
  → builder writes docs/product/feature-areas/<kebab>.md from approved map + PRD
  → (reuse Lead brief from map when same-thread; brief first on cold-start scaffold)
  → no Scope Slice files; no FA validation in this step

/feature-area validate <name>
  → [feature-area-lead context brief]
  → builder runs FA-01–FA-09 + CC checks
  → verdict: CLEAR | BLOCKED

/feature-area promote <name>
  → [feature-area-lead context brief]
  → builder re-runs FA-01–FA-09 + CC checks; if CLEAR and status exploratory, narrow file update to validated
  → if already validated: no-op

/feature-area slice <name>
  → [feature-area-lead context brief]
  → builder confirms validated status + no NEED_HUMAN
  → builder proposes Scope Slices
  → [scope-critic reviews proposal]
  → user approves proposal

/feature-area scaffold-slices <name>
  → [feature-area-lead context brief — reuse from slice when same-thread; brief first on cold-start]
  → builder writes docs/product/scope-slices/<fa-kebab>--<slice-kebab>.md from approved proposal + template
  → skips existing non-empty Scope Slice files
  → expect exploratory; story-ready only after refine-slice + promote-slice

/feature-area refine-slice <artifact-path>
  → builder edits product-level sections on one Scope Slice file (no ready-for-user-stories promotion)

/feature-area promote-slice <artifact-path>
  → builder re-runs SS-01–SS-10 + CC-01–CC-05; if CLEAR and status exploratory, narrow file update to ready-for-user-stories
  → if already ready-for-user-stories: no-op

/feature-area check <artifact-path>
  → builder runs checker (no lead pre-flight needed)
  → verdict: CLEAR | BLOCKED
```

## How to invoke

Use the [`/feature-area`](../../commands/feature-area.md) command:

- `/feature-area map` — read PRD, propose a Feature Area map
- `/feature-area scaffold` — after approval, write initial Feature Area markdown from template
- `/feature-area validate <name>` — run FA-01–FA-09 checks against a Feature Area file
- `/feature-area promote <name>` — after CLEAR, apply the exploratory → validated transition fields on the Feature Area file
- `/feature-area slice <name>` — propose Scope Slices for a validated Feature Area
- `/feature-area scaffold-slices <name>` — after approval, create or fill Scope Slice files from template
- `/feature-area refine-slice <path>` — update product-level sections on one Scope Slice
- `/feature-area promote-slice <path>` — after SS-01–SS-10 and CC-01–CC-05 CLEAR, apply ready-for-user-stories transition on one Scope Slice file
- `/feature-area check <artifact-path>` — run the scope-readiness checker against any artifact

## Governed by

- Rule: `.cursor/core/rules/feature-area-workflow.mdc`
- Checker: `.cursor/core/checkers/scope-readiness-checker.md`
- Templates: `.cursor/core/templates/product/`

## Hard rules

- No technical architecture, frameworks, data models, or implementation in committee output.
- **`/feature-area scaffold`** is the only `/feature-area` mode that **creates** Feature Area files under `docs/product/feature-areas/`. **`/feature-area scaffold-slices`** is the only mode that **creates** or **initially fills** Scope Slice files under `docs/product/scope-slices/` from an approved slice proposal. **`/feature-area refine-slice`** may **edit allowed product-level sections** on one existing Scope Slice file. **`/feature-area promote-slice`** is the only mode that **applies the automated ready-for-user-stories transition** on an existing Scope Slice file (narrow edits only). **`/feature-area promote`** is the only mode that **applies the automated validated transition** on an existing Feature Area file (narrow edits only). Agents (Lead, Critic) do not write those files — the builder does, per each mode’s rules.
- No user stories, specs, or tasks at any point.
- Advancement gates follow `.cursor/core/checkers/scope-readiness-checker.md` exclusively.
