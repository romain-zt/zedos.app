#!/bin/bash
# tier-telemetry.sh — Cursor postToolUse hook
#
# Fires after every StrReplace, Write, or EditNotebook.
# Logs the tool call to .cursor/observability/turns.jsonl so
# audit-tier-compliance.ts can compute Executor-share over time.
#
# Fails OPEN — never blocks.

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "unknown")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")

FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    p = d.get('path', d.get('target_notebook', ''))
    print(p)
except:
    print('')
" 2>/dev/null || echo "")

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_DIR=".cursor/observability"
mkdir -p "$LOG_DIR"

# Determine if this looks like an executor delegation
# (Task tool with subagent_type=executor counts as delegation; StrReplace on code does not)
IS_DELEGATION=false
if [ "$TOOL_NAME" = "Task" ]; then
    IS_DELEGATION=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    st = d.get('subagent_type', '')
    print('true' if st == 'executor' else 'false')
except:
    print('false')
" 2>/dev/null || echo "false")
fi

echo "{\"ts\":\"$TIMESTAMP\",\"tool\":\"$TOOL_NAME\",\"path\":\"$FILE_PATH\",\"executor_delegation\":$IS_DELEGATION}" >> "$LOG_DIR/turns.jsonl" 2>/dev/null || true

# Always output additional_context so hook format is valid (empty is fine)
echo '{"additional_context": ""}'
exit 0
