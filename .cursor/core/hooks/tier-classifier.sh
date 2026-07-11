#!/bin/bash
# tier-classifier.sh — Cursor preToolUse hook
#
# Fires before StrReplace, Write, or EditNotebook.
# If the target file is application code (not markdown/doctrine), injects
# an agent_message reminding the agent to use Task(executor) instead.
# Fails OPEN — never blocks; only advises.
#
# Logs classification to .cursor/observability/classifications.jsonl (gitignored)

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "{}")

# Extract path from tool input
FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    p = d.get('path', d.get('target_notebook', ''))
    print(p)
except:
    print('')
" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
    echo '{"permission": "allow"}'
    exit 0
fi

# Check if file is application code (not markdown/doctrine)
CODE_EXTENSIONS="ts|tsx|js|jsx|mjs|cjs|py|go|rb|rs|java|kt|swift|cs|cpp|c|h|php|vue|svelte|yaml|json|sql|sh"
IS_CODE=$(echo "$FILE_PATH" | grep -cE "\.($CODE_EXTENSIONS)$" || true)

# Doctrine paths — editing these inline is fine (Manager-tier authoring)
IS_DOCTRINE=0
if echo "$FILE_PATH" | grep -qE "^\.cursor/core/|^docs/(prd|product|product-decisions|state)/"; then
    IS_DOCTRINE=1
fi

if [ "$IS_CODE" -gt 0 ] && [ "$IS_DOCTRINE" -eq 0 ]; then
    # Log the classification
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    LOG_DIR=".cursor/observability"
    mkdir -p "$LOG_DIR"
    echo "{\"ts\":\"$TIMESTAMP\",\"hook\":\"tier-classifier\",\"verdict\":\"executor-shaped\",\"tool\":\"$TOOL_NAME\",\"path\":\"$FILE_PATH\"}" >> "$LOG_DIR/classifications.jsonl" 2>/dev/null || true

    # Inject advisory (never block — fail open)
    cat <<EOF
{
  "permission": "allow",
  "agent_message": "TIER CHECK: '${FILE_PATH}' is application code. Per .cursor/core/rules/20-model-routing.mdc and .cursor/core/skills/tier-enforcement/SKILL.md, code edits should be delegated via Task(subagent_type: \"executor\", model: \"composer-2.5-fast\") — not written inline by a Manager/Vision agent. If you have an explicit user waiver (\"do it inline\"), proceed. Otherwise, fire a Task instead.",
  "user_message": "Tier check: consider using an Executor subagent for code edits."
}
EOF
    exit 0
fi

# Allow everything else silently
echo '{"permission": "allow"}'
exit 0
