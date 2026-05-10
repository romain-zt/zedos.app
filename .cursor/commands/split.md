# /split — Split current work into smaller PRs

## Usage

```txt
/split                    (analyze current branch + working tree)
/split <pr-number>        (split an already-opened oversized PR)
```

Lead agent: `implementer` (`.cursor/agents/execution/implementer.md`) for the mechanical split; `architect` for Plan-aware decomposition decisions when the work spans Plans.
Operational skill: `.cursor/skills/execution/split-technical-story/SKILL.md`
First-party reference: `~/.cursor/skills-cursor/split-to-prs/SKILL.md`
Operational rule: `.cursor/rules/79-pr-sizing.mdc`

---

## Purpose

`/split` reorganizes oversized work into smaller reviewable PRs. It is invoked when:

- An active diff exceeds the limits in `.cursor/rules/79-pr-sizing.mdc` §2.
- A `pr-readiness-checker.md` returned BLOCKED on PR-B1 / B2 / B3 / B5 / B6 with no exemption.
- A single Implementation Plan has grown to cover multiple distinct user benefits.
- A refactor and a feature are tangled in the same branch.

`/split` does not change behavior — it reorganizes commits / diffs into reviewer-aligned PRs.

---

## Pre-flight

1. Run `git status` and `git diff <base>...HEAD` to understand the current state.
2. Read the active Implementation Plan(s).
3. Read `.cursor/rules/79-pr-sizing.mdc` for the size limits and exemption categories.
4. Find ownership signals: `CODEOWNERS`, package boundaries (post-migration), or layered structure.
5. **SISO classification:** EXECUTION. `/split` writes branches and PRs but does not edit code.

---

## Behavior

### Step 1 — Save a recoverable snapshot

Always, before any reorganization:

```bash
SHA=$(git stash create "pre-split")
if [ -n "$SHA" ]; then
  git update-ref "refs/backup/pre-split-$(date +%s)" "$SHA"
fi
```

The backup ref is preserved until the user explicitly says to delete it.

### Step 2 — Propose the split

Per the `split-technical-story` skill, decompose along these axes (in order of preference):

1. Layer (`infrastructure/persistence/` PR before `application/` PR before `app/` PR).
2. Package (post-migration).
3. Owner (per `CODEOWNERS`).
4. Refactor vs feature.
5. Dependent vs independent.

Default to **independent PRs off the default branch**. Stack only when the dependency is real.

Output a Mermaid diagram when ≥ 3 slices.

### Step 3 — Wait for user approval

Show the proposal:

```txt
Split Proposal

Original branch: <name>

Output PRs:
1. <title> — base: main | <parent>
   Files: <subset>
   Plan-aware: <Plan path or "shared with PR 2,3">
2. <title> — base: <parent>
   Files: <subset>

Stacking diagram:
  main --> PR 1 --> PR 2 --> PR 3

Approval required:
Reply `approved` to execute the split.
Reply `cancel` to stop.
```

Wait for `approved`. Do not branch / commit / push without it.

### Step 4 — Execute the split

For each approved slice:

```bash
git checkout <base>                                # main, or parent PR for stacking
git checkout -b <feature-branch>
git add <named-files-only>                         # never `git add .` / `-A`
git commit -m "<conventional commit per /commit format>"
git push -u origin <feature-branch>
gh pr create --base <base> --title "<title>" --body "$(cat <<'EOF'
[per-PR description per .cursor/rules/79-pr-sizing.mdc §5]
EOF
)"
```

Each output PR runs `pr-readiness-checker.md` independently.

### Step 5 — Report back

```txt
Split — result

Original branch: <name> (preserved at refs/backup/pre-split-<ts>)

Output PRs:
1. PR #<N>: <title> — <url> — base: main
2. PR #<N+1>: <title> — <url> — base: PR #<N>

Backup ref: refs/backup/pre-split-<ts> (kept until you delete)

Next:
- /babysit each PR through review + merge
- Stack merges in order: PR #<N> first
```

---

## Hard rules (preserved from first-party `split-to-prs`)

- Do not create branches, commit, push, or open PRs until the user approves the split plan.
- Never discard user work. No destructive git commands (`reset --hard`, `clean -fdx`, branch deletion, force-push, history rewrite) without explicit approval.
- Always save a recoverable snapshot before moving work around.
- Stage only named files / hunks. **No `git add .`. No `git add -A`.**

## Hard rules (zedos additions)

- Each output PR independently passes `.cursor/checkers/pr-readiness-checker.md`.
- Each output PR ships its own description with the lineage chain (Slice / Story / Plan).
- Refactor + feature splits keep them in separate PRs even if they're sequential.
- Schema migrations get their own PR.

---

→ /pr → /babysit
