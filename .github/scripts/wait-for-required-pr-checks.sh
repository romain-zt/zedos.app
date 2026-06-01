#!/usr/bin/env bash
# Wait until required GitHub check runs (CI quality + E2E playwright) succeed on a PR head.
set -euo pipefail

REPO="${REPO:?REPO is required}"
PR_SHA="${PR_SHA:-}"
PR_NUMBER="${PR_NUMBER:-}"
REQUIRED_CHECKS="${REQUIRED_CHECKS:-quality,playwright}"
MAX_WAIT_SEC="${MAX_WAIT_SEC:-1800}"
POLL_SEC="${POLL_SEC:-30}"
# strict = single pass (no polling); for cleanup / verify-only
WAIT_MODE="${WAIT_MODE:-polite}"

if [ -z "$PR_SHA" ] && [ -n "$PR_NUMBER" ]; then
  PR_SHA="$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq '.head.sha')"
fi

if [ -z "$PR_SHA" ]; then
  echo "❌ PR_SHA or PR_NUMBER is required"
  exit 1
fi

IFS=',' read -ra REQUIRED_ARR <<< "$REQUIRED_CHECKS"

check_name_matches() {
  local name="$1"
  local req="$2"
  local lname
  lname="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
  local lreq
  lreq="$(echo "$req" | tr '[:upper:]' '[:lower:]')"
  [[ "$lname" == "$lreq" || "$lname" == *"/${lreq}" ]]
}

evaluate_checks() {
  local -n _missing=$1
  local -n _pending=$2
  local -n _failed=$3

  _missing=()
  _pending=()
  _failed=()

  local json
  json="$(gh api "repos/${REPO}/commits/${PR_SHA}/check-runs?per_page=100" \
    --jq '[.check_runs[] | {name, status, conclusion}]')"

  for req in "${REQUIRED_ARR[@]}"; do
    req="$(echo "$req" | xargs)"
    [ -z "$req" ] && continue

    local match
    match="$(echo "$json" | jq -c --arg req "$req" '
      [.[] | select(
        (.name | ascii_downcase) == ($req | ascii_downcase)
        or (.name | ascii_downcase | endswith("/" + ($req | ascii_downcase)))
      )] | .[0] // empty
    ')"

    if [ -z "$match" ] || [ "$match" = "null" ]; then
      _missing+=("$req")
      continue
    fi

    local status conclusion
    status="$(echo "$match" | jq -r '.status')"
    conclusion="$(echo "$match" | jq -r '.conclusion // empty')"

    if [ "$status" != "completed" ]; then
      _pending+=("$req")
    elif [ "$conclusion" != "success" ] && [ "$conclusion" != "skipped" ]; then
      _failed+=("$req ($conclusion)")
    fi
  done
}

elapsed=0
while true; do
  missing=()
  pending=()
  failed=()

  evaluate_checks missing pending failed

  if [ "${#failed[@]}" -gt 0 ]; then
    echo "❌ Required checks failed: ${failed[*]}"
    gh pr checks "${PR_NUMBER:-$PR_SHA}" --repo "$REPO" 2>/dev/null || true
    exit 1
  fi

  if [ "${#missing[@]}" -eq 0 ] && [ "${#pending[@]}" -eq 0 ]; then
    echo "✅ Required checks passed: ${REQUIRED_CHECKS} (sha ${PR_SHA:0:7})"
    exit 0
  fi

  if [ "$WAIT_MODE" = "strict" ]; then
    echo "❌ Required checks not ready (strict mode)."
    [ "${#missing[@]}" -gt 0 ] && echo "   Missing: ${missing[*]}"
    [ "${#pending[@]}" -gt 0 ] && echo "   Pending: ${pending[*]}"
    gh pr checks "${PR_NUMBER:-$PR_SHA}" --repo "$REPO" 2>/dev/null || true
    exit 1
  fi

  if [ "$elapsed" -ge "$MAX_WAIT_SEC" ]; then
    echo "❌ Timeout (${MAX_WAIT_SEC}s) waiting for: ${REQUIRED_CHECKS}"
    [ "${#missing[@]}" -gt 0 ] && echo "   Missing: ${missing[*]}"
    [ "${#pending[@]}" -gt 0 ] && echo "   Pending: ${pending[*]}"
    exit 1
  fi

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "⏳ Waiting for checks to register: ${missing[*]} (${elapsed}s)"
  else
    echo "⏳ Waiting for checks to finish: ${pending[*]} (${elapsed}s)"
  fi

  sleep "$POLL_SEC"
  elapsed=$((elapsed + POLL_SEC))
done
