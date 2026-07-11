#!/usr/bin/env bash
# guard-destructive-git.sh
#
# Refuses destructive git commands without explicit user approval. Covers:
#   - git push --force / git push -f
#   - git reset --hard
#   - git clean -fdx
#   - git commit --no-verify
#   - git rebase -i (interactive flag — not supported in our agent flow)
#   - rm -rf .cursor/ or docs/
#
# Anchors:
#   - .cursor/rules/80-change-policy.mdc §5
#   - .cursor/commands/babysit.md hard rules
#   - .cursor/commands/split.md hard rules (preserved from first-party split-to-prs)
#
# Hook event: beforeShellExecution
# Returns JSON: { permission: "ask" | "allow" | "deny", user_message?, agent_message? }
#
# Exit codes:
#   0  = success (permission decision in stdout)
#   2  = block the action (used as a backup; primary signal is permission: deny)

set -euo pipefail

input="$(cat)"

# jq is optional. If present, prefer it; otherwise fall back to grep.
if command -v jq >/dev/null 2>&1; then
  command="$(echo "$input" | jq -r '.command // empty' 2>/dev/null || true)"
else
  command="$(echo "$input" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed -E 's/^"command"\s*:\s*"//;s/"$//')"
fi

if [ -z "$command" ]; then
  echo '{"permission":"allow"}'
  exit 0
fi

block=false
reason=""

if echo "$command" | grep -qE 'git\s+push.*(--force|-f\b)'; then
  block=true
  reason="git push --force is destructive and is forbidden by .cursor/rules/80-change-policy.mdc §5. Force-push to main/master is never allowed."
elif echo "$command" | grep -qE 'git\s+reset\s+--hard'; then
  block=true
  reason="git reset --hard discards work and is forbidden without explicit user approval (per .cursor/commands/babysit.md and .cursor/commands/split.md hard rules)."
elif echo "$command" | grep -qE 'git\s+clean\s+-fdx'; then
  block=true
  reason="git clean -fdx removes untracked files including ignored ones. Forbidden without explicit user approval."
elif echo "$command" | grep -qE 'git\s+commit.*--no-verify'; then
  block=true
  reason="--no-verify bypasses the pre-commit hook (verifier quality gates). Forbidden by .cursor/rules/80-change-policy.mdc §5."
elif echo "$command" | grep -qE 'git\s+rebase.*\s-i\b'; then
  block=true
  reason="git rebase -i requires interactive input which the agent flow does not support. Use a non-interactive rebase or ask the user to run interactively."
elif echo "$command" | grep -qE 'rm\s+-rf\s+(\.cursor|docs)\b'; then
  block=true
  reason="rm -rf .cursor/ or docs/ would delete the governance system or product artifacts. Forbidden."
fi

if [ "$block" = true ]; then
  printf '{"permission":"deny","user_message":"Refused destructive command: %s","agent_message":"Hook guard-destructive-git refused this command. Reason: %s"}\n' \
    "$reason" "$reason"
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
