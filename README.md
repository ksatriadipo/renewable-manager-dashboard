# RM Control Tower

Internal development control tower for a game project: tasks, milestones, timeline/Gantt, critical path, engineering analytics, token analytics, runner performance and P50/P80 forecasts.

- **Stack:** Python 3 standard library only (http.server + SQLite in WAL mode), vanilla JS + inline SVG frontend. No build step, no third-party packages.
- **Data:** read-only ingestion from project sources through a private adapter. Project data, the database, config, logs and secrets live outside this repository and are never committed.
- **History:** task edits and status changes are appended to `task_history` and `audit_log`; ingestion never overwrites manual edits.
- **Auth:** PBKDF2-SHA256 passwords, hashed session tokens (HttpOnly, SameSite=Strict cookies), one-time setup tokens, login rate limiting; mutating requests require the `X-RMCT: 1` header.

## Run

```
export RMCT_CONFIG=/path/to/private/config.json   # db_path, adapter_path, sources
python3 -m rmct migrate
python3 -m rmct ingest
python3 -m rmct setup-token      # prints a one-time token; open /?setup=TOKEN to create the first account
python3 -m rmct serve            # binds 127.0.0.1:8790 by default
python3 -m unittest discover -s tests
```

## Deploy

`deploy/` holds systemd units (server, 15-minute ingestion timer, daily backup timer) and a Caddy reverse-proxy example with automatic HTTPS.
