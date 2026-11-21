"""CLI: python3 -m rmct {migrate,ingest,serve,setup-token,sync-push,backup} [--config PATH]. Config path defaults to $RMCT_CONFIG."""
import argparse, json, sys

from . import auth, config, db


def main(argv=None):
    p = argparse.ArgumentParser(prog="rmct", description="RM Control Tower")
    p.add_argument("--config", help="private JSON config (default: $RMCT_CONFIG)")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("migrate", help="apply database migrations")
    sub.add_parser("ingest", help="read all configured sources into the database")
    s = sub.add_parser("serve", help="run the HTTP server")
    s.add_argument("--bind")
    s.add_argument("--port", type=int)
    t = sub.add_parser("setup-token", help="print a one-time setup token (create or reset a login)")
    t.add_argument("--hours", type=int, default=24)
    t.add_argument("--replica", action="store_true", help="deliver the token to the Codespaces replica with the next sync")
    sub.add_parser("publish", help="primary: publish the read-only static build to the gh-pages branch")
    sub.add_parser("sync-push", help="primary: push a signed snapshot to the replica and replay replica edits")
    sub.add_parser("backup", help="consistent SQLite backup into the private backups folder")
    a = p.parse_args(argv)
    try:
        cfg = config.load(a.config)
    except config.ConfigError as e:
        print("config error: %s" % e, file=sys.stderr)
        return 2
    if a.cmd == "migrate":
        con = db.connect(cfg["db_path"])
        print(json.dumps({"applied": db.migrate(con)}))
        con.close()
    elif a.cmd == "ingest":
        from .ingest import run
        print(json.dumps(run.ingest(cfg, trigger="cli")))
    elif a.cmd == "serve":
        from . import server
        if a.bind:
            cfg["bind"] = a.bind
        if a.port is not None:
            cfg["port"] = a.port
        server.serve(cfg)
    elif a.cmd == "setup-token":
        con = db.connect(cfg["db_path"])
        db.migrate(con)
        tok, exp = auth.create_setup_token(con, a.hours)
        if a.replica:
            from . import sync
            sync.add_setup_token_hash(con, auth._h(tok), exp)
        con.close()
        base = (cfg.get("replica_url") if a.replica else cfg.get("public_url")) or ""
        print("one-time setup token (expires %s):\n%s" % (exp, tok))
        if base:
            print("setup link: %s/?setup=%s" % (base.rstrip("/"), tok))
    elif a.cmd == "publish":
        from . import publish
        print(json.dumps(publish.publish(cfg)))
    elif a.cmd == "sync-push":
        from . import sync
        print(json.dumps(sync.push(cfg)))
    elif a.cmd == "backup":
        from .ingest import run
        print(run.backup(cfg))
    return 0


if __name__ == "__main__":
    sys.exit(main())
