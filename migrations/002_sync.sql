-- v2: replica sync (VPS primary -> Codespaces replica). Outbox = edits made on the replica, returned to the primary.
CREATE TABLE IF NOT EXISTS outbox (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  kind TEXT NOT NULL,            -- task_create | task_patch
  payload TEXT NOT NULL,         -- JSON body as received by the API (validated)
  acked_at TEXT                  -- set when the primary confirmed it applied the edit
);
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY, value TEXT
);
CREATE TABLE IF NOT EXISTS pending_setup_tokens (   -- primary only: setup-token hashes to deliver to the replica
  token_hash TEXT PRIMARY KEY, expires_at TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS replica_edits (           -- primary only: edits received from the replica (append-only)
  replica_seq INTEGER, received_at TEXT, actor TEXT, kind TEXT, payload TEXT, result TEXT,
  PRIMARY KEY (replica_seq)
);
