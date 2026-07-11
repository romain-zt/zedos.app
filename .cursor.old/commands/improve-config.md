# /improve-config — Improve the .cursor/ governance system

## Usage

```txt
/improve-config <artifact-path-or-description>
```

Lead agent: `improver` (`.cursor/agents/execution/improver.md`)
Operational skill: `.cursor/skills/execution/improve-config/SKILL.md`
First-party references: `~/.cursor/skills-cursor/create-rule/SKILL.md`, `~/.cursor/skills-cursor/create-skill/SKILL.md`, `~/.cursor/skills-cursor/create-hook/SKILL.md`
Operational rule: `.cursor/rules/80-change-policy.mdc`

---

## Purpose

`/improve-config` is the meta-loop. It improves the `.cursor/` governance system itself — rules, agents, skills, templates, checkers, hooks, commands. Triggered by:

- A Reviewer report suggesting a `.cursor/` change.
- A Monorepo Analyst drift report between a rule and reality.
- The user explicitly asking to update governance.

`/improve-config` writes only `.cursor/**`. It does not edit `docs/**` or source code.

---

## Pre-flight

1. Identify the trigger (Reviewer / Analyst / user request) and the artifact.
2. Read the artifact and every file that references it (find via `Grep` for the artifact's path).
3. Read the relevant Cursor first-party convention:
   - `.cursor/rules/*.mdc` → `~/.cursor/skills-cursor/create-rule/SKILL.md`
   - `.cursor/skills/**/SKILL.md` → `~/.cursor/skills-cursor/create-skill/SKILL.md`
   - `.cursor/hooks.json` + scripts → `~/.cursor/skills-cursor/create-hook/SKILL.md`
   - `.cursor/agents/**/*.md` → use the model slugs in this command's frontmatter list (or in the Cursor Task tool's documented list)
4. **SISO classification:** EXECUTION. `/improve-config` is the meta-EXECUTION command — it edits governance, which has higher consequences than a typical code change. SISO blocks ORANGE/RED.

---

## Behavior

### Step 1 — Produce an Improvement Proposal

```txt
.cursor/ Improvement Proposal

Artifact: <path>
Type: rule | agent | skill | template | checker | hook | command
Trigger: <Reviewer report | Analyst drift | user request | Cursor convention update>
Symptom: <one-line description of what's wrong / drifted>

Changes:
- <section> — <add | modify | remove> — <one-line description>

Cross-references (where this artifact is cited):
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

### Step 2 — Wait for user approval

Same approval ladder as `/implement` and `/prd update`. `ok` and silence are not approval.

### Step 3 — Apply on `approved`

Edit the artifact + every dependent that needed updating in the same Plan. After writing:

- Run `ReadLints` on `.json` files (e.g. `hooks.json`).
- Spot-check that every cited path still exists.
- Verify every checker ID referenced in a rule is still defined.
- Verify every agent's `model:` slug is in the documented Cursor list.
- Verify every skill's `name:` matches the directory name.
- Verify every command file references commands that exist.

### Step 4 — Update the artifact's changelog (if it has one)

Some artifacts have changelog tables (e.g. `feature-area-workflow.mdc`). Append a row.

### Step 5 — Output

```txt
Updated:
- <path> — <short change>

Cross-references updated:
- <file> — <what changed>

Cross-references verified:
- <file> — <still valid>

Lints passed: <true|false>
Cross-reference resolution: <all-resolved|broken-listed>

Next recommended:
- Review the changed artifact in your next session — meta-changes compound subtly.
```

---

## Hard scope

`/improve-config` may edit only `.cursor/**`. Specifically:

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

---

## Hard rules

- Same approval ladder as `/implement`.
- Cross-references resolved after every edit.
- No `.cursor/rules/00-siso.mdc` edit without **explicit user approval in writing** — SISO is the highest-priority rule.
- No deletion of an artifact with live cross-references unless the references are updated in the same Plan.
- No new rule that contradicts an existing rule — propose merge or supersession.
- No invented model slugs — verify against documented Cursor lists.

---

## Failure routing

| Condition | Action |
|-----------|--------|
| Cross-references broken after edit | Halt; ask the user how to update dependents |
| `ReadLints` fails on a `.json` file | Halt; fix the JSON |
| User wants to edit `.cursor/rules/00-siso.mdc` | Require explicit written approval; do not auto-apply |
| Trigger is a non-trivial design change | Route through `/plan` (Plan-as-authority for governance changes too) instead of editing inline |

---

→ next session
