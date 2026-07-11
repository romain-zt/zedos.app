#!/usr/bin/env bash
# Restore session metadata (agents, specialists, state) from last known good state.
# For the full 350-message thread, also run: ./recover-session.sh (needs sudo)
set -euo pipefail

DIR="/Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat"
DATA="$DIR/.data"

mkdir -p "$DATA/skills/maison_lens" "$DATA/skills/payload_architect"

cat > "$DATA/state.json" <<'EOF'
{
  "sessionId": "407c6ef8-4386-4122-a7b1-66d29e5938ff",
  "sessionTopic": "lenue.paris — class-grade luxury storefront + CI agent loop",
  "conversationGoal": "Now the lenue.paris project",
  "lastOrchestratorHint": "",
  "agentsPaused": true,
  "waitingForHuman": false,
  "turnsThisCycle": 0,
  "updatedAt": 0
}
EOF

cat > "$DATA/agent-bindings.json" <<'EOF'
{
  "orchestrator": "agent-ff487328-f950-4523-802b-ac43c40b4852",
  "spark": "agent-c68348f1-58ea-41e4-96ad-71596686e61f",
  "skeptic": "agent-9a0285c9-aa0d-4eb2-bd6c-242a92dd93d5",
  "maison_lens": "agent-82d0218b-ba41-4917-b37d-95ab6880cbca",
  "payload_architect": "agent-e95fef5b-8f9a-4e07-b342-a9826b7ceaba"
}
EOF

cat > "$DATA/participants.json" <<EOF
{
  "maison_lens": {
    "name": "Maison Lens",
    "label": "Agent · luxury retail digital",
    "color": "hsl(312 55% 52%)",
    "persona": "Haute boutique web: editorial typography, product photography cadence, fr/en/ru voice parity, WhatsApp-as-checkout tone — scores what feels maison-grade vs marketplace-generic",
    "skillPath": "$DATA/skills/maison_lens/SKILL.md"
  },
  "payload_architect": {
    "name": "Payload Architect",
    "label": "Agent · payload cms",
    "color": "hsl(48 55% 52%)",
    "persona": "Payload CMS + Next.js live preview, tri-locale admin UX, and product-centric editorial architecture for luxury commerce — not page-per-product sprawl",
    "skillPath": "$DATA/skills/payload_architect/SKILL.md"
  }
}
EOF

cat > "$DATA/skills/maison_lens/SKILL.md" <<'EOF'
---
name: brainstorm-maison_lens
description: luxury retail digital
---

# Maison Lens

Haute boutique web: editorial typography, product photography cadence, fr/en/ru voice parity, WhatsApp-as-checkout tone — scores what feels maison-grade vs marketplace-generic
EOF

cat > "$DATA/skills/payload_architect/SKILL.md" <<'EOF'
---
name: brainstorm-payload_architect
description: payload cms
---

# Payload Architect

Payload CMS + Next.js live preview, tri-locale admin UX, and product-centric editorial architecture for luxury commerce — not page-per-product sprawl
EOF

if [[ ! -s "$DATA/messages.jsonl" ]]; then
  echo "messages.jsonl is empty — run ./recover-session.sh to restore the full conversation from APFS snapshot."
fi

echo "Restored session metadata for 407c6ef8-4386-4122-a7b1-66d29e5938ff"
echo "Restart server: npm start"
