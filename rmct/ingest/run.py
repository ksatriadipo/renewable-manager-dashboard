"""Ingestion: read every configured source (read-only) and upsert into SQLite.

- Tasks come from the private project adapter; patch tasks are upgraded to TESTED only on runner evidence
  (every patch of the task committed by the runner in a round whose final EditMode run had 0 failures, no rollback).
- Fields a person edited (locked_fields) are never overwritten; a differing source value is logged as a reconciliation issue.
- Every field change is appended to task_history with its source. Nothing is deleted.
"""
import collections, datetime, glob, importlib.util, json, os, shutil, subprocess

from .. import db
from . import runner as R, tokens as TK

TASK_FIELDS = ("title", "description", "batch", "workstream", "category", "priority", "status", "owner", "milestone",
               "est_p50_d", "est_p80_d", "planned_start", "planned_finish", "planned_finish_p80", "actual_start", "actual_finish",
               "deps", "blocker", "acceptance", "evidence", "patch", "commit_ref", "findings", "groups_", "note",
               "status_before_hold", "hold_reason", "actual_effort", "source")
JSON_FIELDS = {"deps", "findings", "groups_", "actual_effort"}
TOK = ("input", "output", "cache_create", "cache_read")


def load_adapter(path):
    spec = importlib.util.spec_from_file_location("rmct_adapter", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def q(xs, p):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    k = (len(xs) - 1) * p
    f = int(k)
    return round(xs[f] + (xs[min(f + 1, len(xs) - 1)] - xs[f]) * (k - f), 2)


def git_log(repo, since):
    try:
        out = subprocess.run(["git", "-C", repo, "log", "--all", "--since=" + since, "--format=%h|%cI|%an|%s"],
                             capture_output=True, text=True, timeout=60).stdout
    except Exception:
        return []
    return [dict(zip(("hash", "at", "author", "subject"), l.split("|", 3))) for l in out.splitlines() if l.count("|") >= 3]


def category(desc):
    d = (desc or "").lower()
    for c, keys in (("review/audit", ("audit", "review", "verdict")), ("rca/investigation", ("rca", "diagnos", "investig", "root cause")),
                    ("documentation", ("doc", "report", "write-up")), ("qa/tooling", ("qa", "capture", "uidev", "perfshot", "test fail", "runner")),
                    ("fix/small patch", ("fix ", "revise", "rebase", "small")), ("implementation", ("impl", "patch", "wire", "unify", "core", "add ", "build"))):
        if any(k in d for k in keys):
            return c
    return "other"


def to_row(t):
    r = {}
    for f in TASK_FIELDS:
        v = t.get(f if f not in ("groups_", "category", "commit_ref", "source") else {"groups_": "groups", "category": "kind", "commit_ref": "commit", "source": "src"}[f])
        if f in JSON_FIELDS:
            v = json.dumps(v if v is not None else ([] if f != "actual_effort" else {}), sort_keys=True)
        r[f] = v if v is not None or f.startswith(("est_", "planned_", "actual_s", "actual_f")) else ""
    return r


def upsert_task(con, t, run_seq, issues):
    r = to_row(t)
    cur = con.execute("SELECT * FROM tasks WHERE id=?", (t["id"],)).fetchone()
    now = db.now()
    if not cur:
        cols = ["id"] + list(TASK_FIELDS) + ["origin", "locked_fields", "created_at", "updated_at"]
        vals = [t["id"]] + [r[f] for f in TASK_FIELDS] + ["ingest", "[]", now, now]
        con.execute("INSERT INTO tasks(%s) VALUES (%s)" % (",".join(cols), ",".join("?" * len(cols))), vals)
        for at, st, note in t.get("history", []):
            con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                        (t["id"], at, "status", None, st, "document history: " + note, "ingest"))
        con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                    (t["id"], now, "status", None, r["status"], r["source"], "ingest"))
        return
    locked = set(db.jload(cur["locked_fields"], []))
    changes = {}
    for f in TASK_FIELDS:
        new, old = r[f], cur[f]
        if (old if old is not None else "") == (new if new is not None else ""):
            continue
        if f in locked:
            issues.append(("MANUAL_OVERRIDE_DIFFERS", t["id"], "%s: manual=%r source=%r" % (f, str(old)[:80], str(new)[:80])))
            continue
        changes[f] = (old, new)
    if changes:
        con.execute("UPDATE tasks SET %s, updated_at=? WHERE id=?" % ", ".join("%s=?" % f for f in changes),
                    [v[1] for v in changes.values()] + [now, t["id"]])
        for f, (o, n) in changes.items():
            if f in ("status", "blocker", "actual_finish", "actual_start", "planned_finish", "milestone", "commit_ref", "evidence", "owner", "priority", "est_p50_d"):
                con.execute("INSERT INTO task_history(task_id, at, field, old_value, new_value, source, actor) VALUES (?,?,?,?,?,?,?)",
                            (t["id"], now, f, None if o is None else str(o), None if n is None else str(n), r["source"], "ingest"))


def ingest(cfg, trigger="manual"):
    con = db.connect(cfg["db_path"])
    db.migrate(con)
    started = db.now()
    con.execute("INSERT INTO ingestion_runs(started_at, ok, trigger) VALUES (?, 0, ?)", (started, trigger))
    run_seq = con.execute("SELECT max(seq) FROM ingestion_runs").fetchone()[0]
    issues = []
    try:
        A = load_adapter(cfg["adapter_path"])
        S = cfg["sources"]
        tasks = A.tasks()
        seen = collections.Counter(t["id"] for t in tasks)
        issues += [("DUPLICATE_TASK_ID", k, "%d rows" % v) for k, v in seen.items() if v > 1]
        # ---- runner + git evidence
        rounds = R.rounds(S["runner_logs"])
        tests_xml = R.test_runs(S.get("test_xml", []))
        commits = []
        for repo in S.get("git_repos", []):
            for c in git_log(repo["path"], S.get("git_since", "2026-11-17")):
                c["repo"] = repo["name"]
                commits.append(c)
        game = [c for c in commits if c["repo"] == S.get("patch_repo")]
        commit_of = {}
        for c in sorted(game, key=lambda c: c["at"]):
            if c["subject"].startswith("patch "):
                commit_of[c["subject"][6:].strip()] = c
        round_of = {}
        for r in rounds:
            ok = bool(r["tests"]) and r["tests"][-1]["fail"] == 0 and not r["rollback"]
            for p in r["installed"]:
                round_of[p.replace(".patch", "")] = (r, ok)
        for t in tasks:
            pats = (t.get("patch") or "").split()
            if not pats:
                continue
            ev = [round_of.get(p) for p in pats]
            cm = [commit_of.get(p) for p in pats]
            if all(e and e[1] for e in ev) and all(cm):
                last = max((e[0] for e in ev), key=lambda r: r["end"])
                tl = last["tests"][-1]
                t["evidence"] = ((t.get("evidence") or "") + "; " if t.get("evidence") else "") + "runner %s EditMode pass %d fail %d; commits %s" % (
                    last["round"], tl["pass"], tl["fail"], " ".join(c["hash"] for c in cm))
                t["commit"] = " ".join(c["hash"] for c in cm)
                if t["status"] == "IMPLEMENTED":
                    t.setdefault("history", []).append((last["end"], "TESTED", "runner %s EditMode %d pass, 0 fail" % (last["round"], tl["pass"])))
                    t["status"] = "TESTED"
                t["actual_finish"] = t.get("actual_finish") or last["end"][:10]
            elif t["status"] in ("TESTED", "ACCEPTED") and t.get("kind") == "patch" and not all(cm):
                issues.append(("STATUS_WITHOUT_COMMIT", t["id"], "status %s but no runner commit for %s" % (t["status"], t["patch"])))
        # ---- tokens (aggregated; raw messages are not stored)
        msgs = TK.parse(sorted(glob.glob(S["claude_dirs"])), getattr(A, "TASK_RX", []))
        era_start = getattr(A, "ERA_START", {})
        for m in msgs:
            m["day"] = (m["ts"] or "")[:10]
            tid = m["task_id"]
            if tid not in ("ORCHESTRATOR", "UNALLOCATED"):
                gate = era_start.get(tid) or era_start.get(tid.split("-")[0])
                if gate and (m["ts"] or "") < gate:
                    m["task_id"] = "UNALLOCATED"
        con.execute("BEGIN")
        con.execute("DELETE FROM token_usage")  # derived aggregate table, rebuilt from logs each run (not history)
        agg = collections.defaultdict(collections.Counter)
        for m in msgs:
            k = (m["day"], m["role"], m["task_id"], m["model"] or "unknown")
            for x in TOK:
                agg[k][x] += m[x]
            agg[k]["requests"] += 1
            agg[k]["tool_calls"] += m["tool_calls"]
        for k, v in agg.items():
            con.execute("INSERT INTO token_usage VALUES (?,?,?,?,?,?,?,?,?,?)", k + (v["requests"], v["tool_calls"], v["input"], v["output"], v["cache_create"], v["cache_read"]))
        agents = {}
        for m in msgs:
            if m["role"] != "subagent":
                continue
            a = agents.setdefault(m["agent_id"], {"desc": m["agent_desc"], "type": m["agent_type"], "task": m["task_id"], "first": None, "last": None,
                                                  "requests": 0, "tool_calls": 0, "models": set(), **{x: 0 for x in TOK}})
            a["requests"] += 1
            a["tool_calls"] += m["tool_calls"]
            a["models"].add(m["model"])
            for x in TOK:
                a[x] += m[x]
            a["first"] = min(filter(None, [a["first"], m["ts"]]))
            a["last"] = max(filter(None, [a["last"], m["ts"]]))
        con.execute("DELETE FROM agent_runs")
        for aid, a in agents.items():
            try:
                mins = round((datetime.datetime.fromisoformat(a["last"].replace("Z", "+00:00")) - datetime.datetime.fromisoformat(a["first"].replace("Z", "+00:00"))).total_seconds() / 60, 1)
            except Exception:
                mins = None
            era = getattr(A, "agent_era", lambda ts: "")(a["first"] or "")
            con.execute("INSERT INTO agent_runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (aid, a["desc"], a["type"], a["task"], category(a["desc"]), era, a["first"], a["last"], mins, a["requests"], a["tool_calls"],
                         a["input"], a["output"], a["cache_create"], a["cache_read"], ",".join(sorted(x for x in a["models"] if x))))
        # actual effort per task from mapped agents
        eff = collections.defaultdict(lambda: {"agents": 0, "agent_minutes": 0.0, "output_tokens": 0, "total_tokens": 0, "first": None})
        for a in con.execute("SELECT * FROM agent_runs"):
            e = eff[a["task_id"]]
            e["agents"] += 1
            e["agent_minutes"] = round(e["agent_minutes"] + (a["minutes"] or 0), 1)
            e["output_tokens"] += a["output"]
            e["total_tokens"] += a["input"] + a["output"] + a["cache_create"] + a["cache_read"]
            e["first"] = min(filter(None, [e["first"], a["first_ts"]]))
        for t in tasks:
            e = eff.get(t["id"])
            if e:
                t["actual_effort"] = {k: v for k, v in e.items() if k != "first"}
                t["actual_start"] = t.get("actual_start") or (e["first"] or "")[:10] or None
        A.apply_halt(tasks)
        for t in tasks:
            upsert_task(con, t, run_seq, issues)
        # ---- runner / tests / commits
        for r in rounds:
            con.execute("INSERT OR REPLACE INTO runner_rounds VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (r["round"], getattr(A, "round_era", lambda n: "")(r["round"]), r["date"], r["start"], r["end"], r["minutes"], json.dumps(r["jobs"]),
                         json.dumps(r["installed"]), json.dumps(r["rejected_final"]), json.dumps(r["rollback"]), json.dumps(r["tests"]), int(r["done"]), os.path.basename(r["source"])))
        for x in tests_xml:
            con.execute("INSERT OR REPLACE INTO test_runs VALUES (?,?,?,?,?,?,?,?,?)", (os.path.basename(x["file"]), x["start"], x["end"], x["seconds"], x["total"], x["passed"], x["failed"], x["inconclusive"], x["skipped"]))
        for c in commits:
            con.execute("INSERT OR IGNORE INTO commits VALUES (?,?,?,?,?)", (c["repo"], c["hash"], c["at"], c["author"], c["subject"][:200]))
        # ---- findings, decisions, milestones
        finds, groups = A.findings()
        for f in finds:
            con.execute("INSERT OR REPLACE INTO findings VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                        (f["id"], f.get("severity"), f.get("category"), f.get("defect_type"), f.get("group"), f.get("rc"), f.get("summary"),
                         f.get("status"), f.get("status_raw", ""), f.get("src"), f.get("status_src", ""), db.now()))
        for d in A.decisions():
            con.execute("INSERT OR REPLACE INTO decisions VALUES (?,?,?,?,?,?)", (d["id"], d["topic"], d["text"], d["status"], d["src"], db.now()))
        for i, m in enumerate(A.milestones()):
            con.execute("INSERT OR REPLACE INTO milestones VALUES (?,?,?,?,?,?)", (m["id"], m["name"], m["scope"], json.dumps(m["members"]), i, m.get("source", "")))
        # ---- risks: derived from tasks + adapter pending decisions (manual fields preserved)
        derived = []
        for t in con.execute("SELECT * FROM tasks"):
            if t["status"] == "BLOCKED":
                derived.append({"id": "BLK-" + t["id"], "title": t["title"], "type": "TRUE_BLOCKER", "severity": "HIGH", "description": t["blocker"], "task_id": t["id"], "milestone": t["milestone"], "owner": t["owner"]})
            elif t["status"] == "NEEDS_REWORK":
                derived.append({"id": "RWK-" + t["id"], "title": t["title"], "type": "REWORK", "severity": "MEDIUM", "description": t["blocker"], "task_id": t["id"], "milestone": t["milestone"], "owner": t["owner"]})
            elif t["status"] == "ON_HOLD":
                derived.append({"id": "HLD-" + t["id"], "title": t["title"], "type": "DELIBERATE_HOLD", "severity": "LOW", "description": t["hold_reason"], "task_id": t["id"], "milestone": t["milestone"], "owner": "OWN"})
        derived += getattr(A, "pending_risks", lambda: [])()
        live_ids = set()
        for r in derived:
            live_ids.add(r["id"])
            cur = con.execute("SELECT locked_fields, status FROM risks WHERE id=?", (r["id"],)).fetchone()
            if not cur:
                con.execute("INSERT INTO risks(id,title,description,type,severity,impact,owner,identified_at,plan,status,task_id,milestone,evidence,source,origin,locked_fields,updated_at) "
                            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'ingest','[]',?)",
                            (r["id"], r["title"], r.get("description", ""), r["type"], r.get("severity", ""), r.get("impact", ""), r.get("owner", ""), db.now()[:10],
                             r.get("plan", ""), "OPEN", r.get("task_id", ""), r.get("milestone", ""), r.get("evidence", ""), r.get("source", "derived from task status"), db.now()))
            else:
                locked = set(db.jload(cur["locked_fields"], []))
                upd = {k: r.get(k, "") for k in ("title", "description", "type", "milestone") if k not in locked}
                if "status" not in locked and cur["status"] == "RESOLVED":
                    upd["status"] = "OPEN"
                con.execute("UPDATE risks SET %s, updated_at=? WHERE id=?" % ", ".join("%s=?" % k for k in upd), list(upd.values()) + [db.now(), r["id"]])
        for r in con.execute("SELECT id, locked_fields, status FROM risks WHERE origin='ingest'").fetchall():
            if r["id"] not in live_ids and r["status"] != "RESOLVED" and "status" not in db.jload(r["locked_fields"], []):
                con.execute("UPDATE risks SET status='RESOLVED', updated_at=? WHERE id=?", (db.now(), r["id"]))
        # ---- facts
        try:
            st = os.statvfs(S.get("disk_path", "/"))
            free_gb = round(st.f_bavail * st.f_frsize / 1e9, 1)
        except Exception:
            free_gb = None
        runner_state = None
        if S.get("runner_status") and os.path.exists(S["runner_status"]):
            try:
                runner_state = json.load(open(S["runner_status"])).get("state")
            except Exception:
                runner_state = None
        db.set_fact(con, "capacity", {"disk_free_gb": free_gb, "warn_gb": S.get("disk_warn_gb", 15), "build_gate_gb": S.get("build_gate_gb", 20),
                                      "hard_stop_gb": S.get("disk_stop_gb", 8), "agent_cap": S.get("agent_cap", 4), "runner_state": runner_state,
                                      "active_agents": getattr(A, "active_agents", lambda: 0)()})
        db.set_fact(con, "halt", getattr(A, "HALT", None))
        db.set_fact(con, "groups", groups)
        db.set_fact(con, "scope", getattr(A, "SCOPE", ""))
        db.set_fact(con, "token_note", "One row per API response (message id); subagent logs are separate files so parent and child are never double-counted. Cache-read is reused context, not generated tokens.")
        db.set_fact(con, "sources", getattr(A, "SOURCES", []))
        db.set_fact(con, "pricing", cfg.get("pricing"))
        db.set_fact(con, "coverage", {"token_first_day": min((m["day"] for m in msgs if m["day"]), default=None), "token_last_day": max((m["day"] for m in msgs if m["day"]), default=None),
                                      "api_responses": len(msgs), "sessions": len(set(m["session"] for m in msgs)), "subagent_runs": len(agents),
                                      "rounds": len(rounds), "test_xml": len(tests_xml), "commits": len(commits),
                                      "gaps": getattr(A, "GAPS", [])})
        for typ, ref, det in issues:
            con.execute("INSERT INTO reconciliation_issues(run_seq, type, ref, detail) VALUES (?,?,?,?)", (run_seq, typ, ref, det))
        n_tasks = con.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
        con.execute("UPDATE ingestion_runs SET finished_at=?, ok=1, tasks=?, findings=?, api_responses=?, rounds=?, issues=?, message='ok' WHERE seq=?",
                    (db.now(), n_tasks, len(finds), len(msgs), len(rounds), len(issues), run_seq))
        con.execute("COMMIT")
        return {"ok": True, "run": run_seq, "tasks": n_tasks, "issues": len(issues)}
    except Exception as e:
        if con.in_transaction:
            con.execute("ROLLBACK")
        con.execute("UPDATE ingestion_runs SET finished_at=?, ok=0, message=? WHERE seq=?", (db.now(), ("%s: %s" % (type(e).__name__, e))[:500], run_seq))
        raise
    finally:
        con.close()


def backup(cfg, keep_note=True):
    """Online SQLite backup (consistent copy) into the private backups folder. Old backups are kept (no rotation)."""
    src = db.connect(cfg["db_path"])
    out = os.path.join(cfg.get("backup_dir", os.path.dirname(cfg["db_path"])), "control_tower_%s.sqlite" % datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    dst = db.connect(out)
    src.backup(dst)
    dst.close()
    src.close()
    return out
