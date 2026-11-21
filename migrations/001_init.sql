-- RM Control Tower schema v1. Append-only history tables are never updated or deleted by the application.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  batch TEXT DEFAULT '',
  workstream TEXT DEFAULT '',
  category TEXT DEFAULT '',
  priority TEXT DEFAULT '',
  status TEXT NOT NULL,
  owner TEXT DEFAULT '',
  milestone TEXT DEFAULT '',
  est_p50_d REAL, est_p80_d REAL,
  planned_start TEXT, planned_finish TEXT, planned_finish_p80 TEXT,
  actual_start TEXT, actual_finish TEXT,
  deps TEXT DEFAULT '[]',
  blocker TEXT DEFAULT '',
  acceptance TEXT DEFAULT '',
  evidence TEXT DEFAULT '',
  patch TEXT DEFAULT '',
  commit_ref TEXT DEFAULT '',
  findings TEXT DEFAULT '[]',
  groups_ TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  status_before_hold TEXT DEFAULT '',
  hold_reason TEXT DEFAULT '',
  actual_effort TEXT DEFAULT '{}',
  source TEXT DEFAULT '',
  origin TEXT NOT NULL DEFAULT 'ingest',      -- ingest | manual | import
  locked_fields TEXT DEFAULT '[]',              -- fields edited by a person; ingestion never overwrites them
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS ix_tasks_batch ON tasks(batch);
CREATE INDEX IF NOT EXISTS ix_tasks_milestone ON tasks(milestone);

CREATE TABLE IF NOT EXISTS task_history (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  at TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT, new_value TEXT,
  source TEXT DEFAULT '',
  actor TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_hist_task ON task_history(task_id, seq);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY, name TEXT, scope TEXT, rule TEXT, sort INTEGER, source TEXT
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY, severity TEXT, category TEXT, defect_type TEXT, group_id TEXT, rc TEXT,
  summary TEXT, status TEXT, status_raw TEXT, source TEXT, status_source TEXT, updated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_findings_status ON findings(status);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY, topic TEXT, text TEXT, status TEXT, source TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY, title TEXT, description TEXT, type TEXT, severity TEXT, impact TEXT, owner TEXT,
  identified_at TEXT, plan TEXT, status TEXT, task_id TEXT, milestone TEXT, evidence TEXT, source TEXT,
  origin TEXT NOT NULL DEFAULT 'ingest', locked_fields TEXT DEFAULT '[]', updated_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_risks_status ON risks(status);

CREATE TABLE IF NOT EXISTS agent_runs (
  agent_id TEXT PRIMARY KEY, description TEXT, agent_type TEXT, task_id TEXT, category TEXT, era TEXT,
  first_ts TEXT, last_ts TEXT, minutes REAL, requests INTEGER, tool_calls INTEGER,
  input INTEGER, output INTEGER, cache_create INTEGER, cache_read INTEGER, models TEXT
);
CREATE INDEX IF NOT EXISTS ix_agent_task ON agent_runs(task_id);

CREATE TABLE IF NOT EXISTS token_usage (   -- aggregated per day x role x task x model; raw logs are never stored
  day TEXT, role TEXT, task_id TEXT, model TEXT,
  requests INTEGER, tool_calls INTEGER, input INTEGER, output INTEGER, cache_create INTEGER, cache_read INTEGER,
  PRIMARY KEY (day, role, task_id, model)
);

CREATE TABLE IF NOT EXISTS runner_rounds (
  round TEXT PRIMARY KEY, era TEXT, day TEXT, start_ts TEXT, end_ts TEXT, minutes REAL, jobs TEXT,
  installed TEXT, rejected_final TEXT, rollback TEXT, tests TEXT, done INTEGER, source TEXT
);
CREATE TABLE IF NOT EXISTS test_runs (
  file TEXT PRIMARY KEY, start_ts TEXT, end_ts TEXT, seconds REAL, total INTEGER, passed INTEGER, failed INTEGER,
  inconclusive INTEGER, skipped INTEGER
);
CREATE TABLE IF NOT EXISTS commits (
  repo TEXT, hash TEXT, at TEXT, author TEXT, subject TEXT, PRIMARY KEY (repo, hash)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT, finished_at TEXT, ok INTEGER, trigger TEXT,
  tasks INTEGER, findings INTEGER, api_responses INTEGER, rounds INTEGER, issues INTEGER, message TEXT
);
CREATE TABLE IF NOT EXISTS reconciliation_issues (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, run_seq INTEGER, type TEXT, ref TEXT, detail TEXT
);
CREATE TABLE IF NOT EXISTS imports (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, actor TEXT, source TEXT, kind TEXT, created INTEGER, updated INTEGER, rejected INTEGER, detail TEXT
);
CREATE TABLE IF NOT EXISTS facts (   -- small key/value facts from ingestion (capacity, halt, pending decisions, groups)
  key TEXT PRIMARY KEY, json TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY, pw_hash TEXT NOT NULL, created_at TEXT, last_login TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, created_at TEXT, expires_at TEXT, user_agent TEXT
);
CREATE TABLE IF NOT EXISTS setup_tokens (
  token_hash TEXT PRIMARY KEY, created_at TEXT, expires_at TEXT, used_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, actor TEXT, action TEXT, detail TEXT, ip TEXT
);
