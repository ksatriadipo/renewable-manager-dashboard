"""Task create/patch shared by the HTTP API and the replica-edit replay on the primary.
Every change appends task_history, locks the edited fields (ingestion never overwrites them) and writes audit_log."""
import json

from . import compute, db


class EditError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code, self.msg = code, msg


def audit(con, actor, action, detail, ip=""):
    con.execute("INSERT INTO audit_log(at, actor, action, detail, ip) VALUES (?,?,?,?,?)",
                (db.now(), actor or "", action, json.dumps(detail, default=str)[:4000], ip or ""))


def create(con, user, tid, vals, source, ip="", id_rx=None):
    """vals: normalized column values. Returns the new task id. Caller handles BEGIN/COMMIT."""
    if not tid:
        n = con.execute("SELECT COUNT(*) FROM tasks WHERE origin='manual'").fetchone()[0] + 1
        while con.execute("SELECT 1 FROM tasks WHERE id=?", ("M-%03d" % n,)).fetchone():
            n += 1
        tid = "M-%03d" % n
    if id_rx is not None and not id_rx.match(tid):
        raise EditError(400, "id: 1–40 letters, digits, . _ -")
    if con.execute("SELECT 1 FROM tasks WHERE id=?", (tid,)).fetchone():
        raise EditError(409, "task id already exists")
    now = db.now()
    vals = dict(vals)
    vals.setdefault("source", "manual entry by " + user)
    cols = ["id"] + list(vals) + ["origin", "locked_fields", "created_at", "updated_at"]
    args = [tid] + list(vals.values()) + ["manual", json.dumps(sorted(vals)), now, now]
    con.execute("INSERT INTO tasks(%s) VALUES (%s)" % (",".join(cols), ",".join("?" * len(cols))), args)
    for f, v in vals.items():
        con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                    (tid, now, f, None, None if v is None else str(v), source, user))
    audit(con, user, "task_create", {"id": tid, "fields": sorted(vals), "source": source}, ip)
    return tid


def patch(con, user, tid, vals, source, expect=None, ip=""):
    """Returns the list of changed fields. Caller handles BEGIN/COMMIT."""
    cur = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
    if not cur:
        raise EditError(404, "task not found")
    if expect and expect != cur["updated_at"]:
        raise EditError(409, "task changed since it was loaded; reload and retry")
    changes = {f: (cur[f], v) for f, v in vals.items() if (cur[f] if cur[f] is not None else "") != (v if v is not None else "")}
    if changes:
        locked = set(db.jload(cur["locked_fields"], [])) | set(changes)
        now = db.now()
        con.execute("UPDATE tasks SET %s, locked_fields=?, updated_at=? WHERE id=?" % ", ".join("%s=?" % f for f in changes),
                    [v[1] for v in changes.values()] + [json.dumps(sorted(locked)), now, tid])
        for f, (o, n) in changes.items():
            con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                        (tid, now, f, None if o is None else str(o), None if n is None else str(n), source, user))
        audit(con, user, "task_update", {"id": tid, "fields": sorted(changes), "source": source}, ip)
    return sorted(changes)


def task(con, tid):
    r = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
    return compute.task_dict(r) if r else None
