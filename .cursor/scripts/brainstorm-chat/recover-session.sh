#!/usr/bin/env bash
# Recover brainstorm session data.
# 1) Try APFS snapshot (needs Terminal Full Disk Access + sudo)
# 2) Fall back to reconstructing messages from Cursor agent transcripts
set -euo pipefail

DIR="/Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat"
SNAP="${RECOVER_SNAP:-com.apple.TimeMachine.2026-06-16-202524.local}"
MNT="/tmp/brainstorm-snap-recovery"
DATA_REL="Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat/.data"

cd "$DIR"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

try_snapshot() {
  echo "Trying APFS snapshot $SNAP …"
  mkdir -p "$MNT"
  if ! mount_apfs -s "$SNAP" /System/Volumes/Data "$MNT" 2>/dev/null; then
    if ! sudo mount_apfs -s "$SNAP" /System/Volumes/Data "$MNT" 2>/dev/null; then
      return 1
    fi
  fi

  local src="$MNT/$DATA_REL"
  if [[ ! -s "$src/messages.jsonl" ]]; then
    umount "$MNT" 2>/dev/null || sudo umount "$MNT" 2>/dev/null || true
    return 1
  fi

  local backup="$DIR/.data.wiped-$(date +%Y%m%d-%H%M%S)"
  [[ -d "$DIR/.data" ]] && cp -a "$DIR/.data" "$backup"

  mkdir -p "$DIR/.data"
  cp -a "$src/." "$DIR/.data/"
  [[ -f "${backup:-}/ensure-running.log" ]] && cp "$backup/ensure-running.log" "$DIR/.data/"

  umount "$MNT" 2>/dev/null || sudo umount "$MNT" 2>/dev/null || true
  echo "Restored full .data from snapshot."
  return 0
}

echo "=== Step 1: restore session metadata ==="
./restore-last-session.sh

echo ""
echo "=== Step 2: recover messages ==="
if try_snapshot; then
  echo "Snapshot recovery succeeded."
else
  echo "Snapshot mount blocked (common on macOS without Full Disk Access for Terminal)."
  echo "Reconstructing messages from Cursor agent transcripts instead …"
  node reconstruct-messages.mjs
fi

echo ""
echo "Done. Restart: npm start"
