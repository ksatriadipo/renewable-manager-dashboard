#!/bin/bash
# Starts the Control Tower as a read/write REPLICA inside GitHub Codespaces. Data arrives from the VPS primary via signed
# pushes to /api/sync; nothing secret is stored in the repository. Database lives outside the git checkout.
set -u
cd "$(dirname "$0")/.."
git pull -q --ff-only origin main 2>/dev/null || true   # pick up the latest released code on every start
DATA=/workspaces/.rmct-data
mkdir -p "$DATA"
CFG="$DATA/config.json"
cat > "$CFG" <<JSON
{"mode": "replica", "db_path": "$DATA/replica.sqlite", "allowed_signers": "$PWD/deploy/allowed_signers",
 "bind": "0.0.0.0", "port": 8790, "cookie_secure": true, "access_log": "$DATA/access.log",
 "public_read": true, "self_update": "$PWD/scripts/self_update.sh",
 "public_url": "https://${CODESPACE_NAME:-local}-8790.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"}
JSON
# the VPS must reach /api/sync, so the port is made public; every page and API still requires the app login
gh codespace ports visibility 8790:public -c "${CODESPACE_NAME:-}" >/dev/null 2>&1 || echo "note: set port 8790 to Public in the Ports panel once"
if ! curl -fsS http://127.0.0.1:8790/healthz >/dev/null 2>&1; then
  RMCT_CONFIG="$CFG" nohup python3 -m rmct serve >> "$DATA/server.log" 2>&1 &
  echo $! > "$DATA/server.pid"
fi
sleep 2
curl -fsS http://127.0.0.1:8790/healthz && echo " RM Control Tower replica running on port 8790"
