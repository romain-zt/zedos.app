#!/usr/bin/env bash
# guard-protected-paths.sh
#
# Audit hook: warns (does NOT block) when an edit lands on a protected path
# without an obvious matching governance command in recent history.
#
# Protected paths and their governing commands:
#   docs/prd/PRD.md, state.md, history.md, archive/**           -> /prd update
#   docs/product/feature-areas/**                                -> /feature-area scaffold | promote
#   docs/product/scope-slices/**                                 -> /feature-area scaffold-slices | refine-slice | promote-slice
#   docs/product-decisions/**                                    -> /prd update (decision capture)
#   docs/execution/user-stories/**, plans/**                     -> /plan
#   .cursor/rules/**, checkers/**, hooks.json                    -> /improve-config
#
# This hook does NOT enforce — that's the job of the governance commands themselves.
# It exists to surface a warning when an edit looks ungoverned, so the user can
# verify the change went through the correct command.
#
# Anchors:
#   - .cursor/rules/80-change-policy.mdc §2 (mode → permitted changes)
#   - .cursor/rules/00-siso.mdc            (DISCOVERY vs EXECUTION)
#
# Hook event: afterFileEdit
# Returns JSON: { additional_context?: "..." }
# failClosed: true on JSON-malformed input; otherwise non-blocking warning.
#
# Path-aware: works for both pre-migration (zedos/nextjs_space/**) and
# post-migration (apps/**, packages/**, services/**) layouts.

set -euo pipefail

input="$(cat)"

if command -v jq >/dev/null 2>&1; then
  filepath="$(echo "$input" | jq -r '.file_path // .path // empty' 2>/dev/null || true)"
  tool="$(echo "$input" | jq -r '.tool // empty' 2>/dev/null || true)"
else
  filepath="$(echo "$input" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed -E 's/^"file_path"\s*:\s*"//;s/"$//')"
  tool=""
fi

if [ -z "$filepath" ]; then
  echo '{}'
  exit 0
fi

warning=""

# Detect the governing command per protected path family.
case "$filepath" in
  docs/prd/PRD.md|docs/prd/state.md|docs/prd/history.md|docs/prd/archive/*)
    warning="Edit landed on PRD persistence file '$filepath'. Verify it went through /prd update with an approved Patch Intent Summary."
    ;;
  docs/product/feature-areas/*.md)
    warning="Edit landed on Feature Area file '$filepath'. Verify it went through /feature-area scaffold or /feature-area promote (only modes allowed to write)."
    ;;
  docs/product/scope-slices/*.md)
    warning="Edit landed on Scope Slice file '$filepath'. Verify it went through /feature-area scaffold-slices, /feature-area refine-slice, or /feature-area promote-slice."
    ;;
  docs/product-decisions/PD-*.md)
    warning="Edit landed on a Product Decision file '$filepath'. Verify the decision capture path was followed."
    ;;
  docs/execution/user-stories/*.md|docs/execution/plans/*.plan.md)
    warning="Edit landed on an execution-side artifact '$filepath'. Verify it went through /plan with an approved Plan."
    ;;
  .cursor/rules/*.mdc|.cursor/checkers/*.md|.cursor/hooks.json|.cursor/hooks/*.sh)
    warning="Edit landed on .cursor/ governance file '$filepath'. Verify it went through /improve-config with an approved Improvement Proposal."
    ;;
esac

if [ -n "$warning" ]; then
  printf '{"additional_context":"[guard-protected-paths] %s"}\n' "$warning"
else
  echo '{}'
fi

exit 0
