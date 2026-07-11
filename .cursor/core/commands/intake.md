# /intake — Work Intake & Router

## Usage

```txt
/intake <your goal / todo / bug / idea / question>
```

The front door for any work. Classifies the input, checks the `.cursor` setup can
handle it, fills gaps, and routes you to the right command. Use it when you don't
know which command to run, or to make sure the workflow is fresh before starting.

Governed by: `.cursor/core/rules/intake-flow.mdc`
Skill: `.cursor/core/skills/intake/intake-router/SKILL.md`
Agent: `.cursor/core/agents/intake/intake-router.md` (Vision tier)
Checker: `.cursor/core/checkers/setup-readiness-checker.md`

## What it does

1. **Classify** the input → idea / scope / spec / implementation / domain task / bug / chore / question.
2. **SISO gate** (`00-siso.mdc`) — clarify only if execution input is too ambiguous; never blocks discovery.
3. **Setup-readiness** (`setup-readiness-checker.md`) — audits rules/skills/commands/agents/templates + `docs/project.config.md` + the implementation gate. Verdict READY or GAP.
4. **Propose gaps** — names any missing rule/skill/command/agent/template (path + purpose); approval for load-bearing gaps.
5. **Route** — one next command, at the right model tier.

## Routing map

| Class | Next command |
|-------|--------------|
| Idea / product | `/prd discover` (or `/prd init`) |
| Scope / planning | `/feature-area` · `/user-story` · `/spec` |
| Spec / behavior | `/spec` |
| Implementation | `/implement` (gate-checked) |
| Domain task | `/domain <name>` |
| Bug | reproduce → failing test → fix (Spec if behavior changes) |
| Chore / setup | author via create-rule / create-skill; update `docs/project.config.md` |
| Question | answered directly |

## Output

```txt
Intake — <request one-liner>

Class: <one> — <why>
SISO: GREEN | YELLOW | ORANGE | RED
Setup: READY | GAP  (gaps: <none | path → purpose>)
Route → <single next command>  (tier: Vision | Manager | Executor)
```

## Hard rules

- One recommended next command — not a menu.
- Never invent a rule/skill/agent silently; surface gaps first.
- Never route into code when the implementation gate fails — route to the unblocking step.
