<!--
  Product Decision Template — Open the Implementation Phase
  Location: .cursor/core/templates/product-decisions/PD-implementation-phase.template.md
  Usage: copy to docs/product-decisions/PD-NNN-implementation-phase.md and set status: approved
         to authorize governed Spec → Test → Implementation work on this project.
  This decision SUPERSEDES the v0 "stop before implementation" boundary
  (execution-loop §11–§12) for Feature Areas that are delivery-ready.
-->
---
id: PD-NNN
status: proposed
date: {{DATE}}
related_prd_version: {{PRD_VERSION}}
supersedes: "execution-loop v0 implementation boundary (§11.1, §12.1)"
---

# Open the Implementation Phase (Spec → Test → Implementation)

## Context

The v0 governance loop deliberately stopped before writing application code
(`.cursor/core/rules/execution-loop.mdc` §11–§12, PD-001). The product workflow is now
mature enough to extend governance into implementation. We want code work to be
test-first, traceable to a Spec, and tier-routed (`20-model-routing.mdc`).

## Decision

Implementation is authorized under `.cursor/core/rules/implementation-workflow.mdc`,
**only** for a Spec that is `ready-for-implementation` whose grandparent Feature
Area is `delivery-ready`. Work proceeds **Spec → Test → Implementation**:

1. Write tests from the Spec's ACs + Contract (per `30-test-strategy.mdc`), minimizing e2e.
2. Implement against the architecture baseline (`40-architecture-baseline.mdc`).
3. A Task reaches `ready-for-merge` only when its traced tests pass.

`/implement` drives this. Executors (`composer-2.5-fast`) write code; a Manager
plans/splits; high-risk review is Vision-tier (`claude-opus-4-6`).

## Consequences / tradeoffs

- The execution loop may now enter Feature Area subtrees that are `delivery-ready` and run code work — but **only** through `/implement`, and never past a `NEED_HUMAN` flag.
- `forbidden_files` in `EXECUTION_LOCK` is set from `docs/project.config.md` (no longer a blanket implementation ban).
- Risk: code work amplifies bad specs. Mitigation: test-first + tests trace to ACs + checker gates remain mandatory.

## Links

- PRD: `docs/prd/PRD.md`
- Rule: `.cursor/core/rules/implementation-workflow.mdc`
- Supersedes: `docs/product-decisions/PD-001-post-slice-workflow.md` (implementation boundary only)
- Config: `docs/project.config.md` → "Implementation phase"
