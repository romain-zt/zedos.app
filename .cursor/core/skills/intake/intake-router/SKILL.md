---
name: intake-router
description: Triage entry point for any incoming work. Classifies the input (idea / scope / spec / implementation / domain task / bug / chore / question), runs SISO, checks the .cursor setup can handle it (setup-readiness-checker), proposes any missing rule/skill/command/agent, then routes to the right workflow command. Use at the start of any request that isn't already a specific command, or when the user runs /intake.
disable-model-invocation: true
---

# Intake Router

Drives `/intake`. Read first: `.cursor/core/rules/intake-flow.mdc`,
`.cursor/core/checkers/setup-readiness-checker.md`, `.cursor/core/rules/00-siso.mdc`,
`.cursor/core/rules/20-model-routing.mdc`.

This is **Vision-tier** triage + delegation — it routes, it doesn't do the deep work itself.

## Workflow

```
- [ ] 1. Classify the input
- [ ] 2. SISO gate
- [ ] 3. Setup-readiness check (audit + freshness)
- [ ] 4. Propose gaps (if any)
- [ ] 5. Route
```

### 1. Classify

Pick one class (intake-flow §1): idea/product · scope/planning · spec · implementation · domain task · bug · chore/setup · question. State why.

### 2. SISO gate

Apply `00-siso.mdc`. Don't block discovery/questions/chore-talk. Block only ORANGE/RED **execution** — ask the minimum questions.

### 3. Setup-readiness check

Run `setup-readiness-checker.md` (SR-01…SR-11):

- Inventory: read `.cursor/rules`, `.cursor/commands`, `.cursor/skills`, `.cursor/agents`, `.cursor/templates` — is the needed piece present?
- Config: `docs/project.config.md` present + filled? If missing, create from template.
- Implementation gate: if the request implies code, is the phase enabled (config + approved PD)? If not, routing stops before code.
- Freshness: any blocking `NEED_UPDATE` in `docs/POINTS_OF_ATTENTION.md`? PRD present when assumed?

Verdict: **READY** or **GAP**.

### 4. Propose gaps

For a GAP, name the missing rule/skill/command/agent/template: proposed path + one-line purpose, following `create-rule` / `create-skill` conventions. Load-bearing gap → get approval before routing. Minor gap → log `NEED_UPDATE` and route around.

### 5. Route

Emit the single next command (intake-flow §1 table). For delegation, pick the tier per `20-model-routing.mdc` (idea/triage/architecture/business review → Vision; planning/splitting → Manager; one brick → Executor).

## Output

```txt
Intake — <request one-liner>

Class: <one> — <why>
SISO: GREEN | YELLOW | ORANGE | RED  (+ any blocking questions)
Setup: READY | GAP
  Gaps: <none | path → purpose>
Route → <single next command>  (tier: Vision | Manager | Executor)
Notes: <NEED_UPDATE logged? PRD/config created? etc.>
```

## Hard rules

- One next command, not a menu.
- Never invent a rule/skill/agent silently — surface the gap.
- Don't enter implementation when the gate fails — route to the unblocking step.
- Don't re-do work a specific command already owns; hand off.
