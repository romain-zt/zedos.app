#!/usr/bin/env bash
# pre-commit.sh
#
# Verifier quality gates for the commit-time guard. Invoked by /commit.
# Mirrors `.cursor/agents/execution/verifier.md` §"The four mechanical checks".
#
# Path-aware: detects pre-migration (zedos/nextjs_space/**) vs post-migration
# (apps/**, packages/**) layouts via the presence of pnpm-workspace.yaml at
# the repo root.
#
# Anchors:
#   - .cursor/rules/78-testing.mdc §6 (verify scripts)
#   - .cursor/agents/execution/verifier.md
#   - .cursor/rules/80-change-policy.mdc §5
#
# Halt-on-first-FAIL discipline: if any of typecheck/lint/test/build fails,
# emit a clear failure message and exit non-zero.
#
# Exit codes:
#   0  = all four checks passed; commit may proceed
#   1  = at least one check failed; commit blocked

set -uo pipefail

# Detect layout.
if [ -f "pnpm-workspace.yaml" ]; then
  LAYOUT="post-migration"
  CMD_PREFIX="pnpm -w"
elif [ -d "zedos/nextjs_space" ]; then
  LAYOUT="pre-migration"
  CMD_PREFIX_DIR="zedos/nextjs_space"
else
  echo "[pre-commit] cannot detect layout — neither pnpm-workspace.yaml nor zedos/nextjs_space/ found" >&2
  exit 1
fi

run_check() {
  local label="$1"
  local cmd="$2"
  local cwd="${3:-.}"

  echo "[pre-commit] $label..."
  if [ "$cwd" != "." ]; then
    (cd "$cwd" && eval "$cmd")
  else
    eval "$cmd"
  fi
  local rc=$?
  if [ $rc -ne 0 ]; then
    echo "[pre-commit] FAIL: $label (exit $rc)" >&2
    return $rc
  fi
}

if [ "$LAYOUT" = "post-migration" ]; then
  # Post-migration: turbo orchestrates per-package.
  run_check "typecheck"  "$CMD_PREFIX typecheck"           || exit 1
  run_check "lint"       "$CMD_PREFIX lint"                || exit 1
  run_check "test"       "$CMD_PREFIX test"                || exit 1
  run_check "build"      "$CMD_PREFIX build"               || exit 1
else
  # Pre-migration: run inside zedos/nextjs_space/.
  run_check "typecheck"  "npx tsc --noEmit"                "$CMD_PREFIX_DIR" || exit 1
  run_check "lint"       "npx next lint"                   "$CMD_PREFIX_DIR" || exit 1
  run_check "test"       "npx vitest run"                  "$CMD_PREFIX_DIR" || exit 1
  # Skip `next build` for the per-commit guard — too slow.
  # The full build runs in /pr's pre-pr.sh.
fi

echo "[pre-commit] all checks passed"
exit 0
