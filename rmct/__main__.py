"""CLI: python3 -m rmct {migrate,ingest,serve,setup-token,backup} [--config PATH]. Config path defaults to $RMCT_CONFIG."""
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
        con.close()
        print("one-time setup token (expires %s):\n%s" % (exp, tok))
    elif a.cmd == "backup":
        from .ingest import run
        print(run.backup(cfg))
    return 0


if __name__ == "__main__":
    sys.exit(main())
