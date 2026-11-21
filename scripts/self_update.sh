#!/bin/bash
# Replica self-update, started by the server after a VERIFIED sync that names commit $1 of this repository.
# Fast-forward only from origin/main; the target must be exactly the named commit; then restart the server.
set -u
cd "$(dirname "$0")/.."
WANT=$1
LOG=/workspaces/.rmct-data/self_update.log
{
  echo "$(date -u +%FT%TZ) update requested -> $WANT"
  git fetch -q origin main || { echo "fetch failed"; exit 1; }
  [ "$(git rev-parse origin/main)" = "$WANT" ] || { echo "origin/main is not the requested commit; refused"; exit 1; }
  git merge -q --ff-only origin/main || { echo "not a fast-forward; refused"; exit 1; }
  PID=$(cat /workspaces/.rmct-data/server.pid 2>/dev/null || true)
  [ -n "$PID" ] && kill "$PID" 2>/dev/null
  sleep 2
  bash scripts/codespace_start.sh
} >> "$LOG" 2>&1
