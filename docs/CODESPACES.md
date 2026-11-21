# Running the Control Tower in GitHub Codespaces

- **Roles:** the VPS is the primary (it reads the real project sources). A codespace runs a **replica** that you open from any browser, including Android.
- **No secrets in this repository:**
  - the VPS signs every data push with its private key;
  - the replica checks the signature against `deploy/allowed_signers` (a public key);
  - login uses a one-time setup link created on the VPS.

## One-time setup
1. On github.com open this repository → **Code** → **Codespaces** → **Create codespace on main**. The container starts the replica on port 8790 (`scripts/codespace_start.sh`).
2. In the codespace **Ports** panel, check that port 8790 has visibility **Public** (the start script tries to set it). The VPS needs to reach `/api/sync`; every page and API still requires your login.
3. Copy the forwarded address (`https://<name>-8790.app.github.dev`) and give it to the operator. The VPS stores it as `replica_url` and pushes data every 5 minutes.
4. The operator sends you a one-time **setup link** (`…/?setup=<token>`, valid 24 h). Open it on your phone and choose a username and password (min. 12 characters). Afterwards log in normally; the session lasts 30 days.

## Daily use
- A codespace stops after the idle timeout (GitHub settings → Codespaces → Default idle timeout, max. 240 min). Start it again from github.com → Codespaces; the replica restarts automatically and the next VPS push (≤ 5 min) refreshes the data.
- **Retention:** GitHub deletes a codespace that has been stopped for longer than its retention period (default 30 days). Starting it once in a while keeps it. If it is deleted, create a new one and repeat steps 2–4.
- **Edits made in the replica:**
  - create/edit task changes are queued and sent back to the VPS with the next push;
  - on the VPS they get the normal history, field locks and audit trail;
  - the header shows the time of the last sync and the number of edits still waiting.
- Ingestion runs only on the VPS. The replica's "Refresh data" button reports that data arrives automatically.
