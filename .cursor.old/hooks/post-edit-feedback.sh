#!/usr/bin/env bash
# post-edit-feedback.sh
#
# After a TS/TSX edit lands, surface a quick `tsc` + lint feedback summary for
# the touched file's package. Non-blocking — informational only.
#
# Path-aware: works for both pre-migration (zedos/nextjs_space/**) and
# post-migration (apps/**, packages/**, services/**) layouts.
#
# Anchors:
#   - .cursor/rules/78-testing.mdc §6 (verify scripts)
#   - .cursor/agents/execution/verifier.md (full verification gate)
#
# This hook is NOT the verifier — verifier runs at /implement iteration boundaries.
# This is a fast feedback signal for the agent: "your edit just typechecks (or doesn't)".
#
# Hook event: afterFileEdit
# Returns JSON: { additional_context?: "..." }
# failClosed: false (informational only)
# timeout: 30s (typecheck can be slow on cold cache)

set -euo pipefail

input="$(cat)"

if command -v jq >/dev/null 2>&1; then
  filepath="$(echo "$input" | jq -r '.file_path // .path // empty' 2>/dev/null || true)"
else
  filepath="$(echo "$input" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed -E 's/^"file_path"\s*:\s*"//;s/"$//')"
fi

if [ -z "$filepath" ]; then
  echo '{}'
  exit 0
fi

# Only run for TypeScript / TSX edits.
case "$filepath" in
  *.ts|*.tsx) ;;
  *)
    echo '{}'
    exit 0
    ;;
esac

# Only run for source edits — skip tests, contracts, etc. (those are caught in verifier).
case "$filepath" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx|*.contract.test.ts)
    echo '{}'
    exit 0
    ;;
esac

# Determine the package root.
# Pre-migration: cd into zedos/nextjs_space if filepath starts with that prefix.
# Post-migration: walk up to find the nearest package.json containing the file.

pkg_root=""
case "$filepath" in
  zedos/nextjs_space/*)
    pkg_root="zedos/nextjs_space"
    ;;
  apps/*|packages/*|services/*)
    # Walk up to find package.json.
    dir="$(dirname "$filepath")"
    while [ "$dir" != "." ] && [ "$dir" != "/" ]; do
      if [ -f "$dir/package.json" ]; then
        pkg_root="$dir"
        break
      fi
      dir="$(dirname "$dir")"
    done
    ;;
esac

if [ -z "$pkg_root" ] || [ ! -d "$pkg_root" ]; then
  echo '{}'
  exit 0
fi

# Fast typecheck against the package's tsconfig. We do not block on failure;
# we surface the first 5 lines of diagnostics as additional_context.
typecheck_output=""
if [ -f "$pkg_root/tsconfig.json" ]; then
  typecheck_output="$(
    (cd "$pkg_root" && npx --no-install tsc --noEmit 2>&1 | head -n 5) || true
  )"
fi

if [ -n "$typecheck_output" ] && echo "$typecheck_output" | grep -qE 'error TS'; then
  # Escape newlines + quotes for JSON.
  msg="$(printf '%s' "$typecheck_output" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/' | tr -d '\n')"
  printf '{"additional_context":"[post-edit-feedback] tsc reported errors near %s:\\n%s"}\n' "$filepath" "$msg"
else
  echo '{}'
fi

exit 0
