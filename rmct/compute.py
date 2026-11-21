"""Derive every dashboard view from the database. Pure reads; called after each edit/ingestion and cached by the server."""
import collections, datetime, json, random

from . import db

STATUSES = ["NOT_STARTED", "READY", "IN_PROGRESS", "IMPLEMENTED", "TESTED", "ACCEPTED", "BLOCKED", "ON_HOLD",
            "DEFERRED", "CANCELLED", "REJECTED", "NEEDS_REWORK"]
DONE_TECH = {"IMPLEMENTED", "TESTED", "ACCEPTED"}
DEF_EST = {"patch": 0.4, "review": 0.2, "qa_round": 0.4, "decision": 0.2, "rca": 0.3, "doc": 0.1, "tooling": 0.3, "package": 1.0, "ops": 0.3, "qa_tool": 0.3}
OPEN_BATCHES = ("B2", "B3", "V")


def pct(n, d):
    return round(100.0 * n / d, 1) if d else 0.0


def q(xs, p):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    k = (len(xs) - 1) * p
    f = int(k)
    return round(xs[f] + (xs[min(f + 1, len(xs) - 1)] - xs[f]) * (k - f), 2)


def task_dict(r):
    t = dict(r)
    for f in ("deps", "findings", "groups_", "locked_fields"):
        t[f] = db.jload(t.get(f), [])
    t["actual_effort"] = db.jload(t.get("actual_effort"), {})
    t["groups"] = t.pop("groups_")
    t["kind"] = t.get("category")
    return t


def prog(ts):
    n = len([t for t in ts if t["status"] != "CANCELLED"])
    acc = sum(t["status"] == "ACCEPTED" for t in ts)
    tst = sum(t["status"] in ("TESTED", "ACCEPTED") for t in ts)
    imp = sum(t["status"] in DONE_TECH for t in ts)
    return {"total": n, "accepted": acc, "tested_or_better": tst, "implemented_or_better": imp,
            "pct_accepted": pct(acc, n), "pct_tested": pct(tst, n), "pct_implemented": pct(imp, n),
            "status": dict(collections.Counter(t["status"] for t in ts))}


def members(m, tasks):
    rule = db.jload(m["rule"], {})
    if "milestone" in rule:
        return [t for t in tasks if t["milestone"] in rule["milestone"]]
    if "batch" in rule:
        return [t for t in tasks if t["batch"] in rule["batch"] and t["id"] not in rule.get("exclude", [])]
    return []


def workdays_add(start, n):
    if n is None:
        return None
    d = datetime.date.fromisoformat(start)
    left = max(1, -(-n // 1)) - 1
    while left > 0:
        d += datetime.timedelta(days=1)
        if d.weekday() < 5:
            left -= 1
    return d.isoformat()


def build(con):
    tasks = [task_dict(r) for r in con.execute("SELECT * FROM tasks ORDER BY id")]
    by_id = {t["id"]: t for t in tasks}
    hist = collections.defaultdict(list)
    for h in con.execute("SELECT task_id, at, field, old_value, new_value, source, actor FROM task_history ORDER BY seq"):
        hist[h["task_id"]].append(dict(h))
    for t in tasks:
        t["history"] = hist.get(t["id"], [])
    sc = collections.Counter(t["status"] for t in tasks)
    batches = {b: prog([t for t in tasks if t["batch"] == b]) for b in sorted(set(t["batch"] for t in tasks))}
    issues = db.rows(con, "SELECT type, ref, detail FROM reconciliation_issues WHERE run_seq=(SELECT max(seq) FROM ingestion_runs WHERE ok=1)")
    for t in tasks:
        for d in t["deps"]:
            if d not in by_id:
                issues.append({"type": "UNKNOWN_DEPENDENCY", "ref": t["id"], "detail": d})
    # ---- critical path over remaining work
    rem = lambda t: t["status"] not in ("ACCEPTED", "CANCELLED", "DEFERRED") and t["batch"] in OPEN_BATCHES

    def est(t, p80=False):
        base = t["est_p50_d"] if t["est_p50_d"] is not None else DEF_EST.get(t["kind"], .4)
        v = (t["est_p80_d"] if p80 and t["est_p80_d"] is not None else base * (1.6 if p80 else 1))
        return v * (0.3 if t["status"] in ("IMPLEMENTED", "TESTED") else 1)
    memo = {}

    def longest(i, seen=()):
        if i in memo:
            return memo[i]
        best = (0.0, [])
        for d in by_id[i]["deps"]:
            if d in by_id and d not in seen and rem(by_id[d]):
                c = longest(d, seen + (i,))
                if c[0] > best[0]:
                    best = c
        memo[i] = (best[0] + est(by_id[i]), best[1] + [i])
        return memo[i]
    remaining = [t for t in tasks if rem(t)]
    cp = max((longest(t["id"]) for t in remaining), default=(0, []))
    for t in tasks:
        t["critical"] = t["id"] in cp[1]
    # ---- benchmarks from measured data
    agents = db.rows(con, "SELECT * FROM agent_runs ORDER BY first_ts")
    bench = {}
    for c in sorted(set(a["category"] for a in agents)):
        xs = [a for a in agents if a["category"] == c and a["minutes"] is not None]
        bench[c] = {"n": len(xs), "median_min": q([a["minutes"] for a in xs], .5), "p80_min": q([a["minutes"] for a in xs], .8),
                    "median_output": q([a["output"] for a in xs], .5)}
    rounds = db.rows(con, "SELECT * FROM runner_rounds ORDER BY start_ts")
    for r in rounds:
        for k in ("jobs", "installed", "rejected_final", "rollback", "tests"):
            r[k] = db.jload(r[k], [])
    job_min = collections.defaultdict(list)
    for r in rounds:
        for j in r["jobs"]:
            if j.get("minutes") is not None and j["minutes"] >= 0:
                job_min[j["job"]].append(j["minutes"])
    runner_jobs = {k: {"n": len(v), "median_min": q(v, .5), "p80_min": q(v, .8), "total_min": round(sum(v), 1)} for k, v in sorted(job_min.items())}
    runner_day = collections.defaultdict(float)
    for r in rounds:
        if r["minutes"]:
            runner_day[r["day"]] += r["minutes"]
    patch_tasks = [t for t in tasks if t["kind"] == "patch" and t["batch"] in ("B1", "B2")]
    rew = [t for t in patch_tasks if t["status"] in ("NEEDS_REWORK", "REJECTED") or any(h["field"] == "status" and h["new_value"] in ("REJECTED", "NEEDS_REWORK") for h in t["history"])]
    rework_rate = len(rew) / max(1, len(patch_tasks))
    first_pass = [t for t in patch_tasks if t["status"] in ("TESTED", "ACCEPTED") and t not in rew]
    u37h_rounds = [r for r in rounds if r["era"] == "U37H"]
    prod = {"patch_tasks_b1_b2": len(patch_tasks), "rework_tasks": len(rew), "rework_rate": round(rework_rate, 3),
            "first_pass_tested": len(first_pass), "first_pass_rate": round(len(first_pass) / max(1, len([t for t in patch_tasks if t["status"] in ("TESTED", "ACCEPTED")] + [t for t in rew])), 3),
            "rounds_total": len(rounds), "rounds_u37h": len(u37h_rounds),
            "rollback_rounds": sum(1 for r in rounds if r["rollback"]), "rollback_rounds_u37h": sum(1 for r in u37h_rounds if r["rollback"]),
            "failing_test_rounds": sum(1 for r in rounds if r["tests"] and r["tests"][-1]["fail"] > 0),
            "failing_test_rounds_u37h": sum(1 for r in u37h_rounds if r["tests"] and r["tests"][-1]["fail"] > 0),
            "regression_rate_u37h": round(sum(1 for r in u37h_rounds if r["tests"] and r["tests"][-1]["fail"] > 0) / max(1, sum(1 for r in u37h_rounds if r["tests"])), 3)}
    # implementation vs verification time for B1/B2 (measured: agent minutes vs runner minutes of the rounds that tested them)
    impl_min = sum((t["actual_effort"] or {}).get("agent_minutes", 0) for t in patch_tasks)
    ver_rounds = {r["round"] for r in rounds for t in patch_tasks if t["patch"] and any(p in [x.replace(".patch", "") for x in r["installed"]] for p in t["patch"].split())}
    ver_min = sum(r["minutes"] or 0 for r in rounds if r["round"] in ver_rounds)
    prod.update({"impl_agent_minutes": round(impl_min, 1), "verification_runner_minutes": round(ver_min, 1),
                 "verification_rounds": sorted(ver_rounds), "verify_to_impl_ratio": round(ver_min / impl_min, 2) if impl_min else None})
    done_by_day = collections.Counter((t["actual_finish"] or "")[:10] for t in tasks if t["status"] in ("TESTED", "ACCEPTED") and t["actual_finish"])
    # ---- forecast (Monte Carlo; ESTIMATED)
    cap = db.get_fact(con, "capacity", {}) or {}
    free_gb = cap.get("disk_free_gb")
    tests_med = (runner_jobs.get("tests") or {}).get("median_min") or 6
    uidev_med = ((runner_jobs.get("build") or {}).get("median_min") or 24) + ((runner_jobs.get("uidev") or {}).get("median_min") or 12)
    rnd = random.Random(7)

    def sim(need):
        need = {t["id"]: t for t in need}
        out = []
        for _ in range(2000):
            dur = {}
            for i, t in need.items():
                w = rnd.triangular(est(t) * 0.7, est(t, True) * 1.3, est(t))
                if rnd.random() < rework_rate:
                    w *= 1.6
                if t["owner"] in ("OWN", "AUD"):
                    w += rnd.triangular(0.05, 1.0, 0.25)
                if t["status"] == "BLOCKED":
                    w += rnd.triangular(0.5, 5.0, 1.0)
                if t["kind"] == "qa_round":
                    w += rnd.triangular(uidev_med, uidev_med * 2.5, uidev_med * 1.3) / 60 / 8
                    if free_gb is not None and free_gb < (cap.get("build_gate_gb") or 20):
                        w += rnd.triangular(0.1, 2.0, 0.3)
                dur[i] = w
            fin = {}

            def F(i):
                if i not in fin:
                    fin[i] = max([F(d) for d in need[i]["deps"] if d in need] or [0.0]) + dur[i]
                return fin[i]
            cpl = max([F(i) for i in need] or [0.0])
            prounds = max(1, sum(1 for t in need.values() if t["kind"] == "patch") // 3)
            out.append(max(cpl, sum(dur.values()) / max(1, cap.get("agent_cap") or 4)) + prounds * rnd.triangular(tests_med, tests_med * 2.5, tests_med * 1.3) / 60 / 8)
        return out
    ms_rows = db.rows(con, "SELECT * FROM milestones ORDER BY sort")
    today = datetime.datetime.now(datetime.timezone.utc).date()
    resume = today + datetime.timedelta(days=(7 - today.weekday()) % 7) if today.weekday() >= 5 else today
    halt = db.get_fact(con, "halt")
    fc, scope_ids = {}, set()
    milestones = []
    for m in ms_rows:
        ts = members(m, tasks)
        scope_ids |= {t["id"] for t in ts}
        need = [t for t in tasks if t["id"] in scope_ids and rem(t)]
        # include open dependencies of the scope (dependency closure)
        idx = {t["id"] for t in need}
        stack = list(idx)
        while stack:
            for d in by_id[stack.pop()]["deps"]:
                if d in by_id and rem(by_id[d]) and d not in idx:
                    idx.add(d)
                    stack.append(d)
        need = [by_id[i] for i in idx]
        s = sim(need) if need else [0.0]
        f = {"tasks": len(need), "best_workdays": q(s, .1), "p50_workdays": q(s, .5), "p80_workdays": q(s, .8)}
        f.update(best_date=workdays_add(resume.isoformat(), f["best_workdays"]), p50_date=workdays_add(resume.isoformat(), f["p50_workdays"]), p80_date=workdays_add(resume.isoformat(), f["p80_workdays"]))
        fc[m["id"]] = f
        p = prog(ts)
        pf = max([t["planned_finish"] for t in ts if t["planned_finish"]] or [None])
        pf80 = max([(t["planned_finish_p80"] or t["planned_finish"]) for t in ts if t["planned_finish"]] or [None])
        complete = bool(ts) and all(t["status"] == "ACCEPTED" for t in ts)
        af = max([t["actual_finish"] for t in ts if t["actual_finish"]] or [None]) if complete else None
        risks = [t["id"] for t in ts if t["status"] in ("BLOCKED", "NEEDS_REWORK", "ON_HOLD", "REJECTED")]
        milestones.append({"id": m["id"], "name": m["name"], "scope": m["scope"], "tasks": [t["id"] for t in ts], **p, "planned_p50": pf, "planned_p80": pf80,
                           "complete": complete, "actual": af, "risk_tasks": risks, "variance_days_p50": (datetime.date.fromisoformat(f["p50_date"]) - datetime.date.fromisoformat(pf)).days if (pf and f.get("p50_date")) else None,
                           "rule": "Complete only when every required task is ACCEPTED.", "source": m["source"]})
    forecast = {"label": "ESTIMATED", "resume_assumption": resume.isoformat(), "per_milestone": fc,
                "assumptions": ["Working days (Mon–Fri) from the resume date. An owner HALT is active, so the clock starts when work resumes." if halt else "Working days (Mon–Fri) from today.",
                                "Per task: triangular(0.7×P50, 1.3×P80, P50) from the board estimates; tasks without an estimate use a kind default.",
                                "Implemented/tested tasks keep 30 % of their estimate for review and acceptance.",
                                "Rework probability = measured share of B1/B2 patch tasks that were rejected or needed rework (%.0f %%); a reworked task takes 1.6×." % (100 * rework_rate),
                                "Dependency-aware: each sample takes the longest open dependency chain, never less than total work / %d parallel agents." % (cap.get("agent_cap") or 4),
                                "Serial Unity runner: tests median %.1f min, build+uidev median %.1f min (measured)." % (tests_med, uidev_med),
                                "Owner/Auditor gates add 0.05–1 working day (mode 0.25); BLOCKED tasks add 0.5–5 days (mode 1).",
                                "Build/capture rounds wait 0.1–2 days for storage approval while free disk is below the build gate."],
                "measured_inputs": {"rework_rate": rework_rate, "tests_median_min": tests_med, "build_uidev_median_min": uidev_med, "agent_cap": cap.get("agent_cap")}}
    # ---- health (documented rules)
    blocked = [t["id"] for t in tasks if t["status"] == "BLOCKED" and t["batch"] in OPEN_BATCHES]
    crit_block = [i for i in cp[1] if by_id[i]["status"] in ("BLOCKED", "NEEDS_REWORK")]
    disk_low = free_gb is not None and free_gb < (cap.get("build_gate_gb") or 20)
    health = {"value": "PAUSED" if halt else ("RED" if crit_block else "AMBER" if (blocked or disk_low) else "GREEN"),
              "rules": ["PAUSED: an owner HALT is active.", "RED: a critical-path task is BLOCKED or NEEDS_REWORK.",
                        "AMBER: any BLOCKED task in B2/B3/V, or free disk below the build gate.", "GREEN: none of the above."],
              "facts": {"halt": bool(halt), "blocked": blocked, "critical_blocked": crit_block, "disk_below_gate": disk_low}}
    # ---- tokens
    tu = db.rows(con, "SELECT * FROM token_usage")
    TOK = ("input", "output", "cache_create", "cache_read", "requests", "tool_calls")

    def agg(keyf):
        a = collections.defaultdict(lambda: dict.fromkeys(TOK, 0))
        for r in tu:
            k = keyf(r)
            for x in TOK:
                a[k][x] += r[x]
        return dict(sorted(a.items()))
    batch_of = {t["id"]: t["batch"] for t in tasks}
    pricing = db.get_fact(con, "pricing")
    tokens = {"by_day": agg(lambda r: r["day"]), "by_role": agg(lambda r: r["role"]), "by_task": agg(lambda r: r["task_id"]),
              "by_model": agg(lambda r: r["model"]), "by_day_role": agg(lambda r: r["day"] + "|" + r["role"]),
              "by_batch": agg(lambda r: batch_of.get(r["task_id"], r["task_id"] if r["task_id"] in ("ORCHESTRATOR", "UNALLOCATED", "B05", "B1", "SUP", "DASH") else "UNALLOCATED")),
              "coverage": db.get_fact(con, "coverage", {}), "note": db.get_fact(con, "token_note", ""),
              "pricing": pricing, "cost": None}
    if pricing and pricing.get("models"):
        cost = collections.defaultdict(float)
        for r in tu:
            p = pricing["models"].get(r["model"])
            if p:
                cost[r["day"]] += (r["input"] * p["input"] + r["output"] * p["output"] + r["cache_create"] * p["cache_write"] + r["cache_read"] * p["cache_read"]) / 1e6
        tokens["cost"] = {"by_day_usd": dict(sorted(cost.items())), "basis": pricing.get("basis")}
    tasks_tested = [t for t in tasks if t["status"] in ("TESTED", "ACCEPTED") and t["actual_effort"]]
    # ---- risks / decisions / capacity
    risks = db.rows(con, "SELECT * FROM risks ORDER BY status, severity, id")
    for r in risks:
        r["locked_fields"] = db.jload(r["locked_fields"], [])
    cap["parallel_tasks"] = [t["id"] for t in tasks if rem(t) and t["kind"] in ("patch", "rca", "review", "doc") and t["status"] not in ("BLOCKED",)]
    cap["serial_tasks"] = [t["id"] for t in tasks if rem(t) and t["kind"] == "qa_round"]
    cap["by_owner"] = dict(collections.Counter(t["owner"] or "–" for t in tasks if rem(t)))
    cap["file_conflicts"] = "Not available: file ownership is tracked in agent briefs, not in a machine-readable source."
    last_run = (db.rows(con, "SELECT * FROM ingestion_runs WHERE ok=1 ORDER BY seq DESC LIMIT 1") or [None])[0]
    activity = db.rows(con, "SELECT repo, hash, at, subject FROM commits ORDER BY at DESC LIMIT 12")
    return {
        "meta": {"generated_at": db.now(), "last_ingestion": last_run, "halt": halt, "scope": db.get_fact(con, "scope", ""), "statuses": STATUSES,
                 "sources": db.get_fact(con, "sources", []),
                 "formulas": {"pct_accepted": "ACCEPTED / (all − CANCELLED)", "pct_tested": "(TESTED + ACCEPTED) / (all − CANCELLED)",
                              "pct_implemented": "(IMPLEMENTED + TESTED + ACCEPTED) / (all − CANCELLED)",
                              "delivery": "Accepted = ACCEPTED · Not yet accepted = every other status except CANCELLED · Cancelled = CANCELLED"}},
        "tasks": tasks, "status_count": dict(sc), "batches": batches, "milestones": milestones,
        "critical_path": {"days_p50": round(cp[0], 2), "path": cp[1]}, "forecast": forecast, "health": health, "capacity": cap,
        "risks": risks, "decisions": db.rows(con, "SELECT * FROM decisions"), "findings": db.rows(con, "SELECT * FROM findings ORDER BY id"),
        "groups": db.get_fact(con, "groups", {}), "tokens": tokens, "agents": agents,
        "benchmarks": {"agent_by_category": bench, "runner_jobs": runner_jobs, "runner_minutes_by_day": dict(sorted(runner_day.items())), "productivity": prod,
                       "done_by_day": dict(sorted(done_by_day.items())), "tested_with_effort": len(tasks_tested),
                       "output_per_tested_task": round(sum(t["actual_effort"].get("output_tokens", 0) for t in tasks_tested) / len(tasks_tested)) if tasks_tested else None},
        "rounds": rounds, "activity": activity, "issues": issues,
        "imports": db.rows(con, "SELECT * FROM imports ORDER BY seq DESC LIMIT 20"),
    }
