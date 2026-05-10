# `.cursor/hooks/` — Hook contract

This directory contains the executable scripts referenced from `.cursor/hooks.json`. Hooks are the **enforcement layer** for governance contracts the rules merely *describe*.

Per Cursor's first-party `~/.cursor/skills-cursor/create-hook/SKILL.md`, hooks exchange JSON over stdin/stdout. Some hook events are auto-fired by Cursor (`beforeShellExecution`, `afterFileEdit`); others are conventional shell scripts the workflow invokes (`pre-commit.sh`, `pre-pr.sh`) — Cursor does not have native pre-commit / pre-pr events.

## Hook inventory

| Script | Event | Purpose | failClosed |
|--------|-------|---------|------------|
| [`guard-destructive-git.sh`](./guard-destructive-git.sh) | `beforeShellExecution` | Refuse destructive git commands without explicit approval (force-push, reset --hard, --no-verify, rm -rf .cursor/, etc.) | true |
| [`guard-protected-paths.sh`](./guard-protected-paths.sh) | `afterFileEdit` | Warn when an edit lands on a protected governance path without an obvious matching command | true (informational) |
| [`post-edit-feedback.sh`](./post-edit-feedback.sh) | `afterFileEdit` | Run `tsc --noEmit` on the touched package and surface up to 5 lines of error output | false |
| [`pre-commit.sh`](./pre-commit.sh) | `/commit` invokes | Verifier quality gates (typecheck, lint, test, build) before allowing a commit | n/a (called by /commit) |
| [`pre-pr.sh`](./pre-pr.sh) | `/pr` invokes | All `pre-commit.sh` gates + full build + PR-sizing + frozen-violation diff scan | n/a (called by /pr) |

## Path-awareness

Every hook works in **both** layouts:

- **Pre-migration** — code at `zedos/nextjs_space/**`. Hooks run `npx tsc --noEmit`, `npx next lint`, `npx vitest run`, `npx next build` from that directory.
- **Post-migration** — code at `apps/**` + `packages/**`. Hooks run `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` (Turborepo orchestrates).

Layout detection: `pnpm-workspace.yaml` at the repo root → post-migration; otherwise pre-migration.

## Hook event reference

For the full Cursor hook event list, see `~/.cursor/skills-cursor/create-hook/SKILL.md`.

The events used here:

- `beforeShellExecution` — fires before any Shell tool execution; can deny with permission `"deny"`.
- `afterFileEdit` — fires after Write/StrReplace/EditNotebook tool execution; returns `additional_context` to inject into the agent's next turn.

The events **not** used here (intentionally):

- `subagentStart` — would be useful for validating agent model slugs, but the cost of running on every subagent invocation isn't worth it once the rule-as-code (`.cursor/agents/execution/README.md`) prescribes valid slugs explicitly. Revisit if drift appears.
- `beforeSubmitPrompt` — useful for prompt-classification reminders, but `.cursor/rules/00-siso.mdc` already classifies prompts at the model level. Revisit when prompt-injection becomes a concern.

## Adding a new hook

When `/improve-config` introduces a new hook:

1. Update `.cursor/hooks.json` to register the event + matcher + script path + `failClosed` setting.
2. Author the script under `.cursor/hooks/<name>.sh` with a clear shebang (`#!/usr/bin/env bash`), `set -euo pipefail` (or `set -uo pipefail` for non-blocking hooks), and JSON-shaped stdout.
3. `chmod +x .cursor/hooks/<name>.sh`.
4. Run `ReadLints` on `hooks.json`.
5. Test by triggering the event manually before relying on it.

## Hard rules

- Hooks must work in both pre-migration and post-migration layouts.
- Hooks that gate destructive operations (`failClosed: true`) must produce a clear `user_message` explaining what was refused and why.
- Hooks must not depend on tools that aren't on every contributor's `$PATH` without falling back gracefully (`jq` falls back to `grep` in the auth/grep family of hooks here).
- Hooks must not duplicate rule content — they enforce; the rules describe.
- Hooks under `failClosed: false` (informational) must not block; their value is signal only.
