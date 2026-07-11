#!/usr/bin/env bash
# pre-pr.sh
#
# Final pre-PR verification + sizing guard. Invoked by /pr.
# Runs `pre-commit.sh` + the full build + the sizing checks from
# `.cursor/checkers/pr-readiness-checker.md` §B.
#
# Path-aware via pre-commit.sh's layout detection.
#
# Anchors:
#   - .cursor/checkers/pr-readiness-checker.md (the formal gate)
#   - .cursor/rules/79-pr-sizing.mdc §2 (size limits)
#   - .cursor/agents/execution/verifier.md
#
# Exit codes:
#   0 = all gates passed; /pr may proceed
#   1 = at least one gate failed; /pr blocked

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1 — Run the per-commit gates (typecheck, lint, test, build for post-migration).
echo "[pre-pr] running pre-commit checks..."
"$SCRIPT_DIR/pre-commit.sh" || exit 1

# Step 2 — Run the full build for pre-migration (skipped in pre-commit for speed).
if [ -d "zedos/nextjs_space" ] && [ ! -f "pnpm-workspace.yaml" ]; then
  echo "[pre-pr] running pre-migration full build..."
  (cd zedos/nextjs_space && npx next build) || {
    echo "[pre-pr] FAIL: build" >&2
    exit 1
  }
fi

# Step 3 — Sizing checks (per .cursor/rules/79-pr-sizing.mdc §2).
# Compare HEAD against the tracking branch's merge-base.

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "[pre-pr] not a git repo; sizing skipped" >&2
  exit 0
fi

BASE_REF="$(git merge-base @{u} HEAD 2>/dev/null || git merge-base origin/main HEAD 2>/dev/null || git merge-base origin/master HEAD 2>/dev/null || echo "")"
if [ -z "$BASE_REF" ]; then
  echo "[pre-pr] cannot determine base ref; sizing skipped" >&2
  exit 0
fi

# Net lines and file count.
DIFF_STAT="$(git diff --shortstat "$BASE_REF"...HEAD 2>/dev/null || echo "")"
ADDED="$(echo "$DIFF_STAT" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)"
REMOVED="$(echo "$DIFF_STAT" | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo 0)"
NET_LINES=$((ADDED + REMOVED))
FILES_CHANGED="$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null | wc -l | tr -d ' ')"

echo "[pre-pr] sizing: $NET_LINES net lines, $FILES_CHANGED files"

# Limits from .cursor/rules/79-pr-sizing.mdc §2.
LINE_LIMIT=400
FILE_LIMIT=15

# Honor declared exemption in the most recent commit message.
LAST_COMMIT_MSG="$(git log -1 --pretty=%B 2>/dev/null || echo "")"
EXEMPTION=""
if echo "$LAST_COMMIT_MSG" | grep -qiE '^(mechanical-refactor|generated|migration[-_]phase|revert)\b'; then
  EXEMPTION="$(echo "$LAST_COMMIT_MSG" | head -1 | grep -oiE '^(mechanical-refactor|generated|migration[-_]phase|revert)' | head -1)"
fi

if [ -n "$EXEMPTION" ]; then
  echo "[pre-pr] sizing exemption declared: $EXEMPTION"
elif [ "$NET_LINES" -gt "$LINE_LIMIT" ]; then
  echo "[pre-pr] FAIL: net lines $NET_LINES > limit $LINE_LIMIT (no exemption declared)" >&2
  echo "[pre-pr] route to /split, or declare an exemption in the PR title" >&2
  exit 1
elif [ "$FILES_CHANGED" -gt "$FILE_LIMIT" ]; then
  echo "[pre-pr] FAIL: files changed $FILES_CHANGED > limit $FILE_LIMIT (no exemption declared)" >&2
  echo "[pre-pr] route to /split, or declare an exemption in the PR title" >&2
  exit 1
fi

# Step 4 — Frozen-violation check: refuse new `as any` casts in the diff.
NEW_AS_ANY="$(git diff "$BASE_REF"...HEAD 2>/dev/null | grep -E '^\+' | grep -cE 'as\s+any\b' || true)"
if [ "${NEW_AS_ANY:-0}" -gt 0 ]; then
  echo "[pre-pr] FAIL: $NEW_AS_ANY new \`as any\` cast(s) introduced (per .cursor/rules/73-result-rop.mdc §3.1, frozen)" >&2
  exit 1
fi

# Step 5 — Frozen-violation check: refuse new files under zedos/nextjs_space/lib/.
NEW_LIB_FILES="$(git diff --name-only --diff-filter=A "$BASE_REF"...HEAD 2>/dev/null | grep -cE '^zedos/nextjs_space/lib/' || true)"
if [ "${NEW_LIB_FILES:-0}" -gt 0 ]; then
  echo "[pre-pr] FAIL: new file(s) added under zedos/nextjs_space/lib/ — retirement zone (per .cursor/rules/72-hexagonal-boundaries.mdc §7, frozen)" >&2
  exit 1
fi

echo "[pre-pr] all gates passed"
exit 0
