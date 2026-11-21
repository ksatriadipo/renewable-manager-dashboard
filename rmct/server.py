"""HTTP server (Python stdlib only): static frontend from web/ + JSON API.

Security: every /api route except /healthz, /api/setup and /api/login needs a valid session cookie; every mutating
request (POST/PATCH/PUT/DELETE) needs the header `X-RMCT: 1` (CSRF guard, together with SameSite=Strict cookies).
Passwords and tokens are never logged. Manual task edits append task_history + audit_log and lock the edited fields so
ingestion never overwrites them.
"""
import datetime, http.cookies, json, mimetypes, os, re, threading, traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from . import auth, compute, db
from .ingest import run as ingest_run

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(HERE, "web")
COOKIE = "rmct_session"
MAX_BODY = 1_000_000

EDITABLE = {"title", "description", "batch", "workstream", "category", "priority", "status", "owner", "milestone",
            "est_p50_d", "est_p80_d", "planned_start", "planned_finish", "planned_finish_p80", "actual_start", "actual_finish",
            "deps", "blocker", "acceptance", "evidence", "patch", "commit_ref", "findings", "groups_", "note",
            "status_before_hold", "hold_reason", "actual_effort", "source"}
ALIASES = {"notes": "note", "groups": "groups_", "kind": "category", "commit": "commit_ref"}
DATE_FIELDS = {"planned_start", "planned_finish", "planned_finish_p80", "actual_start", "actual_finish"}
NUM_FIELDS = {"est_p50_d", "est_p80_d"}
LIST_FIELDS = {"deps", "findings", "groups_"}
DATE_RX = re.compile(r"^\d{4}-\d\d-\d\d$")
ID_RX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$")


class ApiError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code, self.msg = code, msg


def normalize(body, partial=True):
    """Validate + convert a task payload into DB column values. Raises ApiError(400)."""
    if not isinstance(body, dict):
        raise ApiError(400, "JSON object expected")
    out = {}
    for k, v in body.items():
        k = ALIASES.get(k, k)
        if k in ("id", "updated_at"):
            continue
        if k not in EDITABLE:
            raise ApiError(400, "field not editable: %s" % k)
        if k == "status":
            if v not in compute.STATUSES:
                raise ApiError(400, "status must be one of " + ", ".join(compute.STATUSES))
        elif k in DATE_FIELDS:
            if v in (None, ""):
                v = None
            elif not (isinstance(v, str) and DATE_RX.match(v)):
                raise ApiError(400, "%s must be YYYY-MM-DD or empty" % k)
            else:
                try:
                    datetime.date.fromisoformat(v)
                except ValueError:
                    raise ApiError(400, "%s is not a valid date" % k)
        elif k in NUM_FIELDS:
            if v in (None, ""):
                v = None
            else:
                try:
                    v = float(v)
                except (TypeError, ValueError):
                    raise ApiError(400, "%s must be a number" % k)
                if v < 0 or v > 3650:
                    raise ApiError(400, "%s out of range" % k)
        elif k in LIST_FIELDS:
            if isinstance(v, str):
                v = [x for x in re.split(r"[,\s]+", v) if x]
            if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
                raise ApiError(400, "%s must be a list of strings" % k)
            v = json.dumps(v, sort_keys=True)
        elif k == "actual_effort":
            if not isinstance(v, dict):
                raise ApiError(400, "actual_effort must be an object")
            v = json.dumps(v, sort_keys=True)
        else:
            if v is None:
                v = ""
            if not isinstance(v, str):
                v = str(v)
            if len(v) > 20000:
                raise ApiError(400, "%s too long" % k)
        out[k] = v
    if not partial:
        if not (out.get("title") or "").strip():
            raise ApiError(400, "title is required")
        out.setdefault("status", "NOT_STARTED")
    if "title" in out and not out["title"].strip():
        raise ApiError(400, "title cannot be empty")
    return out


class App:
    """Shared state: config, dashboard cache, ingest lock."""

    def __init__(self, cfg):
        self.cfg = cfg
        self.web = cfg.get("web_dir", WEB)
        self._cache = None
        self._cache_lock = threading.Lock()
        self.ingest_lock = threading.Lock()
        con = self.con()
        db.migrate(con)
        con.close()

    def con(self):
        return db.connect(self.cfg["db_path"])

    def invalidate(self):
        with self._cache_lock:
            self._cache = None

    def dashboard(self):
        with self._cache_lock:
            if self._cache is None:
                con = self.con()
                try:
                    self._cache = json.dumps(compute.build(con), default=str).encode()
                finally:
                    con.close()
            return self._cache

    def run_ingest(self, trigger):
        if not self.ingest_lock.acquire(blocking=False):
            raise ApiError(409, "ingestion already running")
        try:
            res = ingest_run.ingest(self.cfg, trigger=trigger)
        finally:
            self.ingest_lock.release()
            self.invalidate()
        return res


def audit(con, actor, action, detail, ip):
    con.execute("INSERT INTO audit_log(at, actor, action, detail, ip) VALUES (?,?,?,?,?)",
                (db.now(), actor or "", action, json.dumps(detail, default=str)[:4000], ip or ""))


def make_handler(app):
    class H(BaseHTTPRequestHandler):
        server_version = "rmct"
        sys_version = ""
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):  # path only (no query string, no bodies, no cookies)
            path = urlsplit(self.path).path
            line = "%s %s %s %s\n" % (db.now(), self.command, path, args[1] if len(args) > 1 else "")
            logp = app.cfg.get("access_log")
            if logp:
                try:
                    with open(logp, "a", encoding="utf-8") as fh:
                        fh.write(line)
                except OSError:
                    pass

        # ---------- helpers
        def ip(self):
            return self.client_address[0] if self.client_address else ""

        def send(self, code, body=b"", ctype="application/json; charset=utf-8", headers=()):
            if isinstance(body, (dict, list)):
                body = json.dumps(body, default=str).encode()
            elif isinstance(body, str):
                body = body.encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy",
                             "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                             "script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            if app.cfg.get("cookie_secure"):
                self.send_header("Strict-Transport-Security", "max-age=31536000")
            if ctype.startswith("application/json"):
                self.send_header("Cache-Control", "no-store")
            for k, v in headers:
                self.send_header(k, v)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def err(self, code, msg):
            self.send(code, {"error": msg})

        def token(self):
            raw = self.headers.get("Cookie")
            if not raw:
                return None
            try:
                c = http.cookies.SimpleCookie(raw)
            except http.cookies.CookieError:
                return None
            return c[COOKIE].value if COOKIE in c else None

        def cookie(self, value, max_age):
            parts = ["%s=%s" % (COOKIE, value), "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=%d" % max_age]
            if app.cfg.get("cookie_secure"):
                parts.append("Secure")
            return ("Set-Cookie", "; ".join(parts))

        def body(self):
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                raise ApiError(413, "body too large")
            raw = self.rfile.read(n) if n else b""
            if not raw:
                return {}
            try:
                return json.loads(raw.decode("utf-8"))
            except Exception:
                raise ApiError(400, "invalid JSON")

        # ---------- dispatch
        def do_GET(self):
            self.dispatch("GET")

        def do_HEAD(self):
            self.dispatch("GET")

        def do_POST(self):
            self.dispatch("POST")

        def do_PATCH(self):
            self.dispatch("PATCH")

        def do_PUT(self):
            self.dispatch("PUT")

        def do_DELETE(self):
            self.dispatch("DELETE")

        def dispatch(self, method):
            path = urlsplit(self.path).path
            con = None
            try:
                if path == "/healthz":
                    return self.send(200, {"ok": True})
                if not path.startswith("/api/"):
                    if method != "GET":
                        raise ApiError(405, "method not allowed")
                    return self.static(path)
                if method != "GET" and self.headers.get("X-RMCT") != "1":
                    raise ApiError(403, "missing X-RMCT header")
                con = app.con()
                if path == "/api/setup" and method == "POST":
                    return self.api_setup(con)
                if path == "/api/login" and method == "POST":
                    return self.api_login(con)
                user = auth.session_user(con, self.token())
                if not user:
                    raise ApiError(401, "authentication required")
                if path == "/api/me" and method == "GET":
                    return self.send(200, {"username": user})
                if path == "/api/logout" and method == "POST":
                    auth.logout(con, self.token())
                    audit(con, user, "logout", {}, self.ip())
                    return self.send(200, {"ok": True}, headers=[self.cookie("", 0)])
                if path == "/api/dashboard" and method == "GET":
                    return self.send(200, app.dashboard())
                if path == "/api/ingest" and method == "POST":
                    res = app.run_ingest("api:" + user)
                    audit(con, user, "ingest", res, self.ip())
                    return self.send(200, res)
                if path == "/api/tasks" and method == "POST":
                    return self.create_task(con, user)
                m = re.match(r"^/api/tasks/([^/]+)(/history)?$", path)
                if m:
                    tid = m.group(1)
                    if m.group(2) and method == "GET":
                        return self.history(con, tid)
                    if not m.group(2) and method == "PATCH":
                        return self.patch_task(con, user, tid)
                    if not m.group(2) and method == "GET":
                        r = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
                        if not r:
                            raise ApiError(404, "task not found")
                        return self.send(200, compute.task_dict(r))
                    raise ApiError(405, "method not allowed")
                raise ApiError(404, "not found")
            except ApiError as e:
                self.err(e.code, e.msg)
            except Exception:
                traceback.print_exc()
                self.err(500, "internal error")
            finally:
                if con is not None:
                    con.close()

        # ---------- static
        def static(self, path):
            rel = path.lstrip("/") or "index.html"
            full = os.path.realpath(os.path.join(app.web, rel))
            root = os.path.realpath(app.web)
            if not (full == root or full.startswith(root + os.sep)):
                raise ApiError(404, "not found")
            if os.path.isdir(full):
                full = os.path.join(full, "index.html")
            if not os.path.isfile(full):
                if "." in os.path.basename(rel):
                    raise ApiError(404, "not found")
                full = os.path.join(root, "index.html")  # SPA fallback
                if not os.path.isfile(full):
                    return self.send(200, "<!doctype html><title>RM Control Tower</title><p>Frontend not built yet.</p>",
                                     "text/html; charset=utf-8")
            ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
                ctype += "; charset=utf-8"
            with open(full, "rb") as fh:
                data = fh.read()
            cache = "no-cache" if full.endswith(".html") else "public, max-age=300"
            self.send(200, data, ctype, headers=[("Cache-Control", cache)])

        # ---------- auth
        def api_setup(self, con):
            key = "setup:" + self.ip()
            if not auth.rate_ok(key):
                raise ApiError(429, "too many attempts, try later")
            b = self.body()
            tok, user, pw = b.get("token") or "", (b.get("username") or "").strip(), b.get("password") or ""
            if not auth.setup_token_valid(con, tok):
                auth.rate_hit(key)
                raise ApiError(403, "invalid or expired setup token")
            try:
                auth.set_password(con, user, pw)
            except ValueError as e:
                raise ApiError(400, str(e))
            auth.use_setup_token(con, tok)
            audit(con, user, "setup", {"username": user}, self.ip())
            return self.send(200, {"ok": True, "username": user})

        def api_login(self, con):
            b = self.body()
            user, pw = (b.get("username") or "").strip(), b.get("password") or ""
            keys = ("login-ip:" + self.ip(), "login-user:" + user.lower())
            if not all(auth.rate_ok(k) for k in keys):
                raise ApiError(429, "too many attempts, try later")
            tok = auth.login(con, user, pw, self.headers.get("User-Agent"), app.cfg.get("session_days", 30))
            if not tok:
                for k in keys:
                    auth.rate_hit(k)
                audit(con, user[:40], "login_failed", {}, self.ip())
                raise ApiError(401, "invalid username or password")
            audit(con, user, "login", {}, self.ip())
            return self.send(200, {"ok": True, "username": user},
                             headers=[self.cookie(tok, int(app.cfg.get("session_days", 30)) * 86400)])

        # ---------- tasks
        def create_task(self, con, user):
            b = self.body()
            tid = (b.get("id") or "").strip() if isinstance(b, dict) else ""
            vals = normalize(b, partial=False)
            con.execute("BEGIN IMMEDIATE")
            try:
                if not tid:
                    n = con.execute("SELECT COUNT(*) FROM tasks WHERE origin='manual'").fetchone()[0] + 1
                    while con.execute("SELECT 1 FROM tasks WHERE id=?", ("M-%03d" % n,)).fetchone():
                        n += 1
                    tid = "M-%03d" % n
                if not ID_RX.match(tid):
                    raise ApiError(400, "id: 1–40 letters, digits, . _ -")
                if con.execute("SELECT 1 FROM tasks WHERE id=?", (tid,)).fetchone():
                    raise ApiError(409, "task id already exists")
                now = db.now()
                vals.setdefault("source", "manual entry by " + user)
                cols = ["id"] + list(vals) + ["origin", "locked_fields", "created_at", "updated_at"]
                args = [tid] + list(vals.values()) + ["manual", json.dumps(sorted(vals)), now, now]
                con.execute("INSERT INTO tasks(%s) VALUES (%s)" % (",".join(cols), ",".join("?" * len(cols))), args)
                for f, v in vals.items():
                    con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                                (tid, now, f, None, None if v is None else str(v), "manual create", user))
                audit(con, user, "task_create", {"id": tid, "fields": sorted(vals)}, self.ip())
                con.execute("COMMIT")
            except Exception:
                con.execute("ROLLBACK")
                raise
            app.invalidate()
            r = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
            return self.send(201, compute.task_dict(r))

        def patch_task(self, con, user, tid):
            b = self.body()
            expect = b.get("updated_at") if isinstance(b, dict) else None
            vals = normalize(b, partial=True)
            if not vals:
                raise ApiError(400, "no fields to change")
            con.execute("BEGIN IMMEDIATE")
            try:
                cur = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
                if not cur:
                    raise ApiError(404, "task not found")
                if expect and expect != cur["updated_at"]:
                    raise ApiError(409, "task changed since it was loaded; reload and retry")
                changes = {f: (cur[f], v) for f, v in vals.items()
                           if (cur[f] if cur[f] is not None else "") != (v if v is not None else "")}
                locked = set(db.jload(cur["locked_fields"], [])) | set(changes)
                now = db.now()
                if changes:
                    sets = ", ".join("%s=?" % f for f in changes)
                    con.execute("UPDATE tasks SET %s, locked_fields=?, updated_at=? WHERE id=?" % sets,
                                [v[1] for v in changes.values()] + [json.dumps(sorted(locked)), now, tid])
                    for f, (o, n) in changes.items():
                        con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                                    (tid, now, f, None if o is None else str(o), None if n is None else str(n), "manual edit", user))
                    audit(con, user, "task_update", {"id": tid, "fields": sorted(changes)}, self.ip())
                con.execute("COMMIT")
            except Exception:
                con.execute("ROLLBACK")
                raise
            if changes:
                app.invalidate()
            r = con.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
            return self.send(200, dict(compute.task_dict(r), changed=sorted(changes)))

        def history(self, con, tid):
            if not con.execute("SELECT 1 FROM tasks WHERE id=?", (tid,)).fetchone():
                raise ApiError(404, "task not found")
            return self.send(200, {"task_id": tid, "history": db.rows(
                con, "SELECT seq, at, field, old_value, new_value, source, actor FROM task_history WHERE task_id=? ORDER BY seq", (tid,))})

    return H


def make_server(cfg, bind=None, port=None):
    app = App(cfg)
    srv = ThreadingHTTPServer((bind or cfg.get("bind", "127.0.0.1"), int(cfg.get("port", 8790) if port is None else port)), make_handler(app))
    srv.daemon_threads = True
    srv.app = app
    return srv


def serve(cfg):
    srv = make_server(cfg)
    print("RM Control Tower listening on http://%s:%d" % srv.server_address[:2], flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
