"""Primary (VPS) -> replica (GitHub Codespaces) sync without shared secrets.

- The primary signs each snapshot with an OpenSSH key (`ssh-keygen -Y sign`, namespace "rmct-sync"); the replica
  verifies it against deploy/allowed_signers (a PUBLIC key, safe in the public repo). Unsigned or stale payloads are refused.
- Snapshot = the data tables (tasks, history, analytics, …). Auth tables (users, sessions, setup tokens, audit) are never
  sent or replaced; only setup-token HASHES for a new login are delivered.
- Edits made on the replica go to `outbox`; the replica returns un-acked outbox rows in the sync response; the primary replays
  them through rmct.edits (so they get history, locks and audit) and acknowledges them in the next push. Until acknowledged,
  the replica re-applies them on top of each snapshot, so the owner never sees an edit disappear.
"""
import base64, datetime, gzip, json, os, subprocess, tempfile, urllib.request, urllib.error

from . import db, edits

NAMESPACE = "rmct-sync"
IDENTITY = "rmct-vps"
DATA_TABLES = ["tasks", "task_history", "milestones", "findings", "decisions", "risks", "agent_runs", "token_usage",
               "runner_rounds", "test_runs", "commits", "ingestion_runs", "reconciliation_issues", "imports", "facts"]
MAX_SKEW_S = 900


def _cols(con, table):
    return [r[1] for r in con.execute("PRAGMA table_info(%s)" % table)]


# ------------------------------------------------------------------ primary side
def export(con, ack_upto):
    tables = {}
    for t in DATA_TABLES:
        cols = _cols(con, t)
        tables[t] = {"cols": cols, "rows": [list(r) for r in con.execute("SELECT %s FROM %s" % (",".join(cols), t))]}
    seq = int(db.get_fact(con, "sync_seq", 0) or 0) + 1
    db.set_fact(con, "sync_seq", seq)
    tokens = [dict(r) for r in con.execute("SELECT token_hash, expires_at FROM pending_setup_tokens WHERE expires_at > ?", (db.now(),))]
    return {"v": 1, "seq": seq, "at": db.now(), "ack_upto": ack_upto, "setup_tokens": tokens, "tables": tables}


def sign(data, key_path):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "payload")
        with open(p, "wb") as fh:
            fh.write(data)
        subprocess.run(["ssh-keygen", "-q", "-Y", "sign", "-f", key_path, "-n", NAMESPACE, p], check=True, capture_output=True)
        with open(p + ".sig", "rb") as fh:
            return fh.read()


def verify(data, sig, allowed_signers):
    with tempfile.TemporaryDirectory() as d:
        s = os.path.join(d, "sig")
        with open(s, "wb") as fh:
            fh.write(sig)
        r = subprocess.run(["ssh-keygen", "-Y", "verify", "-f", allowed_signers, "-I", IDENTITY, "-n", NAMESPACE, "-s", s],
                           input=data, capture_output=True)
        return r.returncode == 0


def replay(con, edits_in):
    """Apply replica edits on the primary. Returns the highest replica seq processed (applied or rejected)."""
    from .server import normalize, ApiError, ID_RX  # local import: same validation as the API
    top = 0
    for e in edits_in:
        rs = int(e["seq"])
        top = max(top, rs)
        if con.execute("SELECT 1 FROM replica_edits WHERE replica_seq=?", (rs,)).fetchone():
            continue  # already applied (idempotent)
        payload = json.loads(e["payload"])
        result = "applied"
        con.execute("BEGIN IMMEDIATE")
        try:
            if e["kind"] == "task_create":
                tid = (payload.get("id") or "").strip()
                vals = normalize(payload, partial=False)
                edits.create(con, e["actor"], tid, vals, "replica edit (Codespaces) by " + e["actor"], id_rx=ID_RX)
            elif e["kind"] == "task_patch":
                vals = normalize(payload["fields"], partial=True)
                edits.patch(con, e["actor"], payload["id"], vals, "replica edit (Codespaces) by " + e["actor"])
            else:
                result = "rejected: unknown kind"
        except (ApiError, edits.EditError) as x:
            result = "rejected: %s" % getattr(x, "msg", x)
        con.execute("INSERT INTO replica_edits VALUES (?,?,?,?,?,?)", (rs, db.now(), e["actor"], e["kind"], e["payload"], result))
        con.execute("COMMIT")
    return top


def push(cfg):
    """Primary: sign + POST a snapshot to the replica, replay returned edits. Quiet failure when the replica is offline."""
    url = (cfg.get("replica_url") or "").rstrip("/")
    key = cfg.get("sync_key")
    if not url or not key:
        return {"ok": False, "reason": "replica_url or sync_key not configured"}
    con = db.connect(cfg["db_path"])
    db.migrate(con)
    try:
        ack = int(db.get_fact(con, "replica_ack", 0) or 0)
        con.execute("BEGIN IMMEDIATE")
        snap = export(con, ack)
        con.execute("COMMIT")
        body = gzip.compress(json.dumps(snap, default=str).encode())
        sig = sign(body, key)
        req = urllib.request.Request(url + "/api/sync", data=body, method="POST", headers={
            "Content-Type": "application/octet-stream", "X-RMCT": "1", "X-RMCT-Signature": base64.b64encode(sig).decode()})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                resp = json.loads(r.read().decode())
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            return {"ok": False, "reason": "replica unreachable: %s" % (getattr(e, "code", None) or type(e).__name__)}
        top = replay(con, resp.get("outbox", []))
        if top:
            db.set_fact(con, "replica_ack", max(ack, top))
        db.set_fact(con, "replica_last_push", {"at": db.now(), "seq": snap["seq"], "replica_edits": len(resp.get("outbox", []))})
        return {"ok": True, "seq": snap["seq"], "bytes": len(body), "edits_received": len(resp.get("outbox", [])), "ack": max(ack, top)}
    finally:
        con.close()


def add_setup_token_hash(con, token_hash, expires_at):
    con.execute("INSERT OR REPLACE INTO pending_setup_tokens VALUES (?,?,?)", (token_hash, expires_at, db.now()))


# ------------------------------------------------------------------ replica side
def apply(con, raw, sig_b64, allowed_signers):
    """Verify + apply a snapshot. Returns un-acked outbox rows for the primary. Raises ValueError on any rejection."""
    try:
        sig = base64.b64decode(sig_b64 or "", validate=True)
    except Exception:
        raise ValueError("bad signature encoding")
    if not sig or not os.path.exists(allowed_signers) or not verify(raw, sig, allowed_signers):
        raise ValueError("signature verification failed")
    snap = json.loads(gzip.decompress(raw).decode())
    at = datetime.datetime.fromisoformat(snap["at"])
    if abs((datetime.datetime.now(datetime.timezone.utc) - at).total_seconds()) > MAX_SKEW_S:
        raise ValueError("snapshot timestamp outside the allowed window")
    last = int((con.execute("SELECT value FROM sync_state WHERE key='seq'").fetchone() or ["0"])[0])
    if int(snap["seq"]) <= last:
        raise ValueError("replayed or out-of-order snapshot")
    con.execute("BEGIN IMMEDIATE")
    try:
        for t in DATA_TABLES:
            spec = snap["tables"].get(t)
            if spec is None:
                continue
            local = set(_cols(con, t))
            cols = [c for c in spec["cols"] if c in local]
            idx = [spec["cols"].index(c) for c in cols]
            con.execute("DELETE FROM %s" % t)
            con.executemany("INSERT INTO %s(%s) VALUES (%s)" % (t, ",".join(cols), ",".join("?" * len(cols))),
                            [[row[i] for i in idx] for row in spec["rows"]])
        for tk in snap.get("setup_tokens", []):
            con.execute("INSERT OR IGNORE INTO setup_tokens VALUES (?, ?, ?, NULL)", (tk["token_hash"], db.now(), tk["expires_at"]))
        ack = int(snap.get("ack_upto") or 0)
        con.execute("UPDATE outbox SET acked_at=? WHERE seq<=? AND acked_at IS NULL", (db.now(), ack))
        pending = [dict(r) for r in con.execute("SELECT seq, at, actor, kind, payload FROM outbox WHERE acked_at IS NULL ORDER BY seq")]
        _reapply(con, pending)
        con.execute("INSERT OR REPLACE INTO sync_state VALUES ('seq', ?)", (str(snap["seq"]),))
        con.execute("INSERT OR REPLACE INTO sync_state VALUES ('last_sync', ?)", (db.now(),))
        con.execute("COMMIT")
    except Exception:
        con.execute("ROLLBACK")
        raise
    return pending


def _reapply(con, pending):
    """Re-apply not-yet-acknowledged replica edits on top of a fresh snapshot (best effort, no audit duplication)."""
    from .server import normalize, ApiError, ID_RX
    for e in pending:
        p = json.loads(e["payload"])
        try:
            if e["kind"] == "task_create":
                tid = (p.get("id") or "").strip()
                if tid and con.execute("SELECT 1 FROM tasks WHERE id=?", (tid,)).fetchone():
                    continue
                edits.create(con, e["actor"], tid, normalize(p, partial=False), "replica edit (pending sync)", id_rx=ID_RX)
            elif e["kind"] == "task_patch":
                edits.patch(con, e["actor"], p["id"], normalize(p["fields"], partial=True), "replica edit (pending sync)")
        except (ApiError, edits.EditError):
            pass


def record(con, actor, kind, payload):
    con.execute("INSERT INTO outbox(at, actor, kind, payload) VALUES (?,?,?,?)", (db.now(), actor, kind, json.dumps(payload, default=str)))
