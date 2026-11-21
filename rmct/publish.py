"""Publish a read-only static build (web/ + data/dashboard.json) to the gh-pages branch of this repository.
Runs on the VPS primary after ingestion. Commits and pushes only when the data or the web files changed."""
import json, os, shutil, subprocess

from . import compute, db

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def git(wt, *args, check=True):
    return subprocess.run(["git", "-C", wt] + list(args), capture_output=True, text=True, check=check)


def ensure_worktree(wt):
    if os.path.exists(os.path.join(wt, ".git")):
        return
    subprocess.run(["git", "-C", HERE, "fetch", "-q", "origin"], check=False)
    has_remote = subprocess.run(["git", "-C", HERE, "rev-parse", "--verify", "-q", "origin/gh-pages"], capture_output=True).returncode == 0
    if has_remote:
        subprocess.run(["git", "-C", HERE, "worktree", "add", "-B", "gh-pages", wt, "origin/gh-pages"], check=True, capture_output=True)
    else:
        subprocess.run(["git", "-C", HERE, "worktree", "add", "--detach", wt], check=True, capture_output=True)
        git(wt, "checkout", "-q", "--orphan", "gh-pages")
        git(wt, "rm", "-rq", "--cached", ".", check=False)


def publish(cfg):
    wt = cfg.get("pages_worktree")
    if not wt:
        return {"ok": False, "reason": "pages_worktree not configured"}
    ensure_worktree(wt)
    con = db.connect(cfg["db_path"])
    try:
        d = compute.build(con)
    finally:
        con.close()
    d["meta"]["deployment"] = {"mode": "static", "host": "GitHub Pages", "note": "Read-only copy refreshed from the VPS"}
    os.makedirs(os.path.join(wt, "data"), exist_ok=True)
    web = os.path.join(HERE, "web")
    for f in ("app.css", "app.js"):
        shutil.copyfile(os.path.join(web, f), os.path.join(wt, f))
    html = open(os.path.join(web, "index.html"), encoding="utf-8").read()
    if 'name="rmct-static"' not in html:
        html = html.replace("<head>", '<head>\n<meta name="rmct-static" content="1">', 1) if "<head>" in html else '<meta name="rmct-static" content="1">\n' + html
    open(os.path.join(wt, "index.html"), "w", encoding="utf-8").write(html)
    open(os.path.join(wt, ".nojekyll"), "w").close()
    data = json.dumps(d, default=str, separators=(",", ":"))
    open(os.path.join(wt, "data", "dashboard.json"), "w", encoding="utf-8").write(data)
    git(wt, "add", "-A")
    if git(wt, "diff", "--cached", "--quiet", check=False).returncode == 0:
        return {"ok": True, "changed": False}
    env = dict(os.environ, GIT_AUTHOR_NAME="rmct-bot", GIT_AUTHOR_EMAIL="rmct-bot@users.noreply.github.com",
               GIT_COMMITTER_NAME="rmct-bot", GIT_COMMITTER_EMAIL="rmct-bot@users.noreply.github.com")
    subprocess.run(["git", "-C", wt, "commit", "-q", "-m", "data refresh " + db.now()], check=True, env=env)
    r = git(wt, "push", "-q", "origin", "gh-pages", check=False)
    return {"ok": r.returncode == 0, "changed": True, "bytes": len(data), "push": (r.stderr or "").strip()[-200:]}
