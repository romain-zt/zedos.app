#!/usr/bin/env bash
set -euo pipefail

DIR="/Users/romainpiveteau/Projects/AI/lenue-paris/.cursor/scripts/brainstorm-chat"
URL="http://localhost:3847"
PORT=3847
LOG="$DIR/.data/ensure-running.log"
STARTUP_WAIT_SECS=120

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
fi

export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

http_ok() {
  curl -sf --max-time 5 -o /dev/null "$URL"
}

mkdir -p "$DIR/.data"

if http_ok; then
  exit 0
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  log "port $PORT listening but HTTP check failed — skipping"
  exit 0
fi

log "down — starting npm start (node: $(command -v node), arch: $(node -p process.arch))"
cd "$DIR"
nohup npm start >> "$LOG" 2>&1 &
pid=$!

for _ in $(seq 1 "$STARTUP_WAIT_SECS"); do
  if http_ok; then
    if grep -qE "Agents ready|Auto-resuming brainstorm" "$LOG" 2>/dev/null; then
      log "up — pid $pid (agents ready)"
    else
      log "up — pid $pid"
    fi
    exit 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    log "failed — npm start exited before becoming healthy (pid $pid)"
    exit 1
  fi
  sleep 1
done

log "failed — still not healthy after ${STARTUP_WAIT_SECS}s (pid $pid)"
exit 1
