#!/usr/bin/env python3
"""Unity runner rounds from <round>_nohup.log files (read-only) + NUnit result XML files. Paths come from the private config.

Per round: name, date (log mtime, UTC), start (\"<round> mulai HH:MM:SS\"), end (last JOB_DONE / mtime), jobs with their
finish time and duration (difference to the previous marker), patches installed / rejected / rolled back, and test
counts. Times in the logs are VPS-local (UTC on this host). Nothing is inferred when a marker is missing.
"""
import datetime, glob, os, re
import xml.etree.ElementTree as ET



def _t(day, hms):
    try:
        return datetime.datetime.strptime(day + " " + hms, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def rounds(log_glob):
    out = []
    for f in sorted(glob.glob(log_glob)):
        name = os.path.basename(f)[:-len("_nohup.log")]
        mt = datetime.datetime.fromtimestamp(os.path.getmtime(f), datetime.timezone.utc).replace(tzinfo=None)
        day = mt.strftime("%Y-%m-%d")
        txt = open(f, encoding="utf-8", errors="replace").read()
        m = re.search(r"^\S+ mulai (\d\d:\d\d:\d\d)", txt, re.M)
        start = _t(day, m.group(1)) if m else None
        if start and start > mt:  # crossed midnight
            start -= datetime.timedelta(days=1)
        jobs, prev = [], start
        for jm in re.finditer(r"^JOB_DONE (\S+)\s+(\S*)\s+(\d\d:\d\d:\d\d)", txt, re.M):
            t = _t(start.strftime("%Y-%m-%d") if start else day, jm.group(3))
            if t and prev and t < prev:
                t += datetime.timedelta(days=1)
            jobs.append({"job": jm.group(1), "mode": jm.group(2), "end": t.isoformat() if t else None,
                         "minutes": round((t - prev).total_seconds() / 60, 1) if (t and prev) else None})
            prev = t or prev

        def lst(label):
            mm = re.findall(r"^%s: (.*)$" % label, txt, re.M)
            return [x for x in (mm[-1].split() if mm else []) if x]
        installed = re.findall(r"^PATCH (\S+): DIPASANG", txt, re.M)
        rejected = sorted(set(re.findall(r"^PATCH (\S+): DITOLAK", txt, re.M)) - set(installed))
        tests = re.findall(r"tests pass=(\d+) fail=(\d+) skip=(\d+) inconclusive=(\d+)", txt)
        out.append({
            "round": name, "date": day, "start": start.isoformat() if start else None, "end": (prev or mt).isoformat(),
            "minutes": round(((prev or mt) - start).total_seconds() / 60, 1) if start else None,
            "jobs": jobs, "installed": installed, "rejected_final": rejected,
            "rollback": lst("ROLLBACK"), "done": bool(re.search(r"^\S+_DONE$", txt, re.M)),
            "tests": [dict(zip(("pass", "fail", "skip", "inconclusive"), map(int, t))) for t in tests],
            "source": f,
        })
    return out


def test_runs(xml_globs):
    out = []
    for pat in xml_globs:
        for f in sorted(glob.glob(pat)):
            try:
                r = ET.parse(f).getroot()
            except Exception:
                continue
            out.append({"file": f, "start": r.get("start-time"), "end": r.get("end-time"),
                        "seconds": float(r.get("duration") or 0), "total": int(r.get("total") or 0),
                        "passed": int(r.get("passed") or 0), "failed": int(r.get("failed") or 0),
                        "inconclusive": int(r.get("inconclusive") or 0), "skipped": int(r.get("skipped") or 0)})
    return out


