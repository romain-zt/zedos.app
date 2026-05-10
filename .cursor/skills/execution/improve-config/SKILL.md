---
name: improve-config
description: Apply improvements to the .cursor/ configuration itself — rules, agents, skills, templates, checkers, hooks. Same approval ladder as /implement; refactors of governance do not bypass approval. Edits .cursor/** only.
disable-model-invocation: true
---

# Improve Config

The meta-loop. Use when the user runs `/improve-config` or when a Reviewer / Monorepo Analyst surfaces drift between a `.cursor/` artifact and reality.

## When to use

- User explicitly asks to update `.cursor/` (rule, agent, skill, template, checker, hook).
- Monorepo Analyst reports drift between a rule and code.
- Reviewer suggests a rule update (e.g. "the route-line cap is unrealistic for streaming endpoints; bump to 40").
- A new Cursor convention emerges (e.g. a new agent type, a new event hook) and existing artifacts need to mirror it.

## Read first

- `.cursor/agents/execution/improver.md` (you operate under that agent's authority).
- `~/.cursor/skills-cursor/create-rule/SKILL.md` (Cursor-first-party rule conventions).
- `~/.cursor/skills-cursor/create-skill/SKILL.md` (Cursor-first-party skill conventions).
- `~/.cursor/skills-cursor/create-hook/SKILL.md` (Cursor-first-party hook conventions).
- The artifact you propose to change.
- All artifacts that reference it (find via `Grep` for the artifact's path).

## Hard scope

`/improve-config` may edit only `.cursor/**`. It does not touch `docs/**` or source code. Specifically:

| May edit | May not edit |
|----------|--------------|
| `.cursor/rules/*.mdc` | `docs/prd/**` (use `/prd update`) |
| `.cursor/agents/**/*.md` | `docs/product/**` (use `/feature-area …`) |
| `.cursor/skills/**/SKILL.md` and supporting docs | `docs/product-decisions/**` |
| `.cursor/commands/*.md` | `zedos/nextjs_space/**`, `apps/**`, `packages/**`, `services/**` |
| `.cursor/templates/**/*.md` | Application code |
| `.cursor/checkers/*.md` | |
| `.cursor/hooks.json` and `.cursor/hooks/*` | |
| `.cursor/canvases/*.canvas.tsx` | |
| `.cursor/statusline.sh` | |

## Recipe

### Step 1 — Identify the trigger

```txt
Improvement Trigger:
- Source: <Reviewer report | Monorepo Analyst drift report | user request | Cursor convention update>
- Artifact: <path>
- Symptom: <one-line description of what's wrong / drifted>
```

### Step 2 — Read the artifact and its dependents

Find every file that references the artifact's path:

```bash
# In a project shell, conceptually:
rg --type md -F ".cursor/rules/<artifact>.mdc" .cursor/ docs/
```

List the dependents in the proposal. Anything that cites a removed section needs to be updated in the same Plan.

### Step 3 — Produce an Improvement Proposal

```txt
.cursor/ Improvement Proposal

Artifact: <path>
Type: <rule | agent | skill | template | checker | hook | command>
Trigger: <Reviewer | Analyst | user | convention>
Symptom: <one-line>

Changes:
- <section> — <add | modify | remove> — <one-line description>

Cross-references:
- <file> — <how it cites the changed artifact, and whether the citation stays valid>
- <file> — <ditto>

Risks:
- <broken cross-references> — <fix plan>
- <agent / hook behavior change> — <impact>

Approval required:
Reply `approved` to apply.
Reply `preview` to see exact wording first.
Reply `cancel` to stop.
```

### Step 4 — Apply on `approved`

Edit the artifact + every dependent that needed updating. Run `ReadLints` on `.json` files (e.g. `hooks.json`).

### Step 5 — Verify cross-references resolve

Spot-check that:

- Every cited path still exists.
- Every checker ID referenced in a rule is still defined in the checker.
- Every agent's `model:` slug is in the documented Cursor list.
- Every skill's name in frontmatter matches the directory name.
- Every command file references commands that exist.

If any reference is broken, halt and ask the user how to proceed (often the right answer is "update the dependent in the same Plan").

### Step 6 — Update the artifact's changelog (if it has one)

Some artifacts (e.g. `feature-area-workflow.mdc`) have changelog tables. Append a row.

## Hard stops

- Refuse to edit `.cursor/rules/00-siso.mdc` without explicit user approval **in writing** — SISO is the highest-priority rule.
- Refuse to delete a rule, agent, skill, template, or checker that has live cross-references without first updating those references in the same Plan.
- Refuse to add a new rule that contradicts an existing rule — propose a merge or supersession instead.
- Refuse to invent a new model slug — verify against `~/.cursor/skills-cursor/create-skill/SKILL.md` and the Cursor docs.
- Refuse to edit `docs/**` or source code — those are out of `/improve-config`'s scope.

## Hard rules

- Same approval ladder as `/implement`.
- Cross-references resolved after every edit.
- Run `ReadLints` on JSON files (`hooks.json`, `cli-config.json` if touched).
- Adversarial review (the user is the adversary — do not auto-approve).
