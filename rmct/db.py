"""SQLite access + versioned migrations (WAL mode so background ingestion never blocks page requests)."""
import datetime, glob, json, os, sqlite3

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATIONS = os.path.join(HERE, "migrations")


def now():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()


def connect(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    con = sqlite3.connect(path, timeout=30, isolation_level=None)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA busy_timeout=30000")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def migrate(con):
    con.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT)")
    done = {r[0] for r in con.execute("SELECT version FROM schema_migrations")}
    applied = []
    for f in sorted(glob.glob(os.path.join(MIGRATIONS, "*.sql"))):
        v = os.path.basename(f)
        if v in done:
            continue
        with open(f, encoding="utf-8") as fh:
            sql = fh.read().replace("PRAGMA foreign_keys = ON;", "")
        stamp = now().replace("'", "")
        con.executescript("BEGIN;\n" + sql + "\nINSERT INTO schema_migrations VALUES ('%s', '%s');\nCOMMIT;" % (v.replace("'", ""), stamp))
        applied.append(v)
    return applied


def rows(con, sql, args=()):
    return [dict(r) for r in con.execute(sql, args)]


def jload(s, default):
    try:
        return json.loads(s) if s else default
    except Exception:
        return default


def set_fact(con, key, obj):
    con.execute("INSERT OR REPLACE INTO facts VALUES (?, ?, ?)", (key, json.dumps(obj, default=str), now()))


def get_fact(con, key, default=None):
    r = con.execute("SELECT json FROM facts WHERE key=?", (key,)).fetchone()
    return jload(r[0], default) if r else default
