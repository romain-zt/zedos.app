#!/usr/bin/env bash
# statusline.sh — Zedos-aware CLI status line.
#
# Per ~/.cursor/skills-cursor/statusline/SKILL.md, the CLI spawns this command
# on each conversation update with a JSON payload on stdin. The stdout is
# rendered above the prompt.
#
# To activate, the user adds to ~/.cursor/cli-config.json:
#
#   {
#     "statusLine": {
#       "type": "command",
#       "command": "<repo-root>/.cursor/statusline.sh",
#       "padding": 2
#     }
#   }
#
# This is a workspace-scoped script. It reads workspace governance files
# (`docs/prd/state.md`, `docs/EXECUTION_LOCK.md`, `docs/BLOCKERS.md`,
# `docs/prd/PRD.md` for surface UNKNOWN counts) and surfaces them above the
# prompt — high signal-to-noise for a founder driving the workflow alone.
#
# Anchors:
#   - ~/.cursor/skills-cursor/statusline/SKILL.md (event payload spec)
#   - .cursor/rules/70-execution-bridge.mdc       (PRD / FA / Slice / Plan lifecycle)
#
# Path-aware: works in pre- and post-migration layouts (the workspace docs/
# tree is identical in both).

set -uo pipefail

input="$(cat)"

# Optional: jq pretty extraction. Fall back to no-op if jq absent.
if command -v jq >/dev/null 2>&1; then
  model="$(echo "$input" | jq -r '.model.display_name // "?"' 2>/dev/null || echo "?")"
  ctx_pct="$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null | cut -d. -f1)"
  cwd="$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""' 2>/dev/null)"
else
  model="?"
  ctx_pct="0"
  cwd="$(pwd)"
fi

# Find the workspace root by walking up from the cwd looking for `.cursor/`.
find_workspace_root() {
  local dir="${1:-$PWD}"
  while [ "$dir" != "/" ] && [ "$dir" != "." ]; do
    if [ -d "$dir/.cursor" ] && [ -d "$dir/docs" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

WORKSPACE="$(find_workspace_root "$cwd" 2>/dev/null || echo "")"

# Default outputs (when workspace not detected).
prd_version="—"
prd_direction="—"
active_item="—"
open_blockers="0"
surface_unknown="0"

if [ -n "$WORKSPACE" ]; then
  # PRD version + direction (from state.md frontmatter).
  if [ -f "$WORKSPACE/docs/prd/state.md" ]; then
    v="$(grep -E '^VERSION:' "$WORKSPACE/docs/prd/state.md" 2>/dev/null | head -1 | sed -E 's/^VERSION:\s*//' || echo "")"
    d="$(grep -E '^DIRECTION:' "$WORKSPACE/docs/prd/state.md" 2>/dev/null | head -1 | sed -E 's/^DIRECTION:\s*//' | cut -c1-40 || echo "")"
    [ -n "$v" ] && prd_version="$v"
    [ -n "$d" ] && prd_direction="$d"
  fi

  # Active execution-loop item (from EXECUTION_LOCK.md).
  if [ -f "$WORKSPACE/docs/EXECUTION_LOCK.md" ]; then
    a="$(grep -E '^active_item_id:' "$WORKSPACE/docs/EXECUTION_LOCK.md" 2>/dev/null | head -1 | sed -E 's/^active_item_id:\s*//' || echo "")"
    [ -n "$a" ] && [ "$a" != "none" ] && active_item="$a"
  fi

  # Open blockers count (rows in BLOCKERS.md where Resolution is empty).
  if [ -f "$WORKSPACE/docs/BLOCKERS.md" ]; then
    # Count pipe-table rows (skip header) with empty last column.
    open_blockers="$(awk -F'|' '
      /^\|/ && NF > 2 && $2 !~ /^[ -]*$/ && $1 ~ /^\|/ {
        last=$(NF-1); gsub(/[[:space:]]/,"",last);
        if (last == "" && header == 1) count++;
        if ($2 ~ /ID/) header=1;
      }
      END { print count+0 }
    ' "$WORKSPACE/docs/BLOCKERS.md" 2>/dev/null || echo 0)"
  fi

  # Surface UNKNOWN count (from PRD.md "Surface Blockers" section).
  if [ -f "$WORKSPACE/docs/prd/PRD.md" ]; then
    surface_unknown="$(awk '/^## Surface Blockers/,/^## /' "$WORKSPACE/docs/prd/PRD.md" 2>/dev/null \
      | grep -cE '^- ' || echo 0)"
    surface_unknown="$(echo "$surface_unknown" | tr -d ' ')"
  fi
fi

# ANSI colors. Subtle gray for context, yellow for warnings, blue for active item.
GRAY='\033[90m'
BLUE='\033[34m'
YELLOW='\033[33m'
RESET='\033[0m'

# Line 1: model + ctx.
printf "${GRAY}%s  ctx %s%%${RESET}\n" "$model" "${ctx_pct:-0}"

# Line 2: PRD + active item.
printf "${GRAY}PRD ${BLUE}%s${GRAY} | %s${RESET}\n" "$prd_version" "$prd_direction"

# Line 3: signals (only render if any are non-zero, to keep noise low).
warn=""
if [ "$open_blockers" != "0" ]; then warn="${warn}${YELLOW}🚧 ${open_blockers} blockers${RESET} "; fi
if [ "$surface_unknown" != "0" ]; then warn="${warn}${YELLOW}❔ ${surface_unknown} surface UNKNOWN${RESET} "; fi
if [ "$active_item" != "—" ]; then warn="${warn}${BLUE}▶ ${active_item}${RESET}"; fi

if [ -n "$warn" ]; then
  printf "%b\n" "$warn"
fi

exit 0
