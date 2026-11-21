#!/usr/bin/env python3
"""Token usage from Claude Code JSONL logs (read-only).

Sources: every */projects/**/*.jsonl under the Claude config dirs given (from the private config).
Accounting rules (dashboard Module 5):
- one API response = one assistant `message.id`; a response is written as several JSONL lines (one per content block)
  with the same usage, so usage is taken ONCE per message id (last line wins); never summed per line.
- input, output, cache-creation and cache-read tokens stay separate; total_* columns are reported but never mixed into cost.
- the orchestrator = the main session file; a subagent = subagents/agent-<id>.jsonl (+ .meta.json for its description).
  A subagent's tokens are NOT also counted in the parent session (they are separate files / separate requests).
- the same file can exist in two config dirs only if copied; files are de-duplicated by (sessionId, message id).
Output: list of per-message rows (dicts) — aggregated later by build.py.
"""
import glob, json, os, re

def map_task(desc, rules):
    for rx, tid in rules:
        if desc and re.search(rx, desc, re.I):
            return tid
    return "UNALLOCATED"


def files(dirs):
    out = []
    for d in dirs:
        out += glob.glob(os.path.join(d, "projects", "**", "*.jsonl"), recursive=True)
    return sorted(set(out))


def parse(dirs, rules=()):
    rows = {}
    meta = {}
    for f in files(dirs):
        is_sub = "/subagents/" in f
        agent_id = os.path.basename(f)[len("agent-"):-len(".jsonl")] if is_sub else None
        desc, atype = "", ""
        if is_sub:
            mp = f[:-len(".jsonl")] + ".meta.json"
            if os.path.exists(mp):
                try:
                    m = json.load(open(mp))
                    desc, atype = m.get("description", ""), m.get("agentType", "")
                except Exception:
                    pass
        cfg = f.split("/projects/")[0]
        try:
            fh = open(f, encoding="utf-8", errors="replace")
        except OSError:
            continue
        with fh:
            for line in fh:
                if '"usage"' not in line or '"assistant"' not in line:
                    continue
                try:
                    d = json.loads(line)
                except Exception:
                    continue
                if d.get("type") != "assistant":
                    continue
                msg = d.get("message") or {}
                u = msg.get("usage")
                mid = msg.get("id")
                if not u or not mid:
                    continue
                key = (d.get("sessionId"), mid)
                n_tools = sum(1 for b in (msg.get("content") or []) if isinstance(b, dict) and b.get("type") == "tool_use")
                prev = rows.get(key)
                rows[key] = {
                    "session": d.get("sessionId"), "msg_id": mid, "request_id": d.get("requestId"),
                    "ts": d.get("timestamp"), "model": msg.get("model") or "", "config_dir": cfg,
                    "role": "subagent" if is_sub else "orchestrator", "agent_id": agent_id or "",
                    "agent_type": atype, "agent_desc": desc[:160],
                    "task_id": map_task(desc, rules) if is_sub else "ORCHESTRATOR",
                    "input": int(u.get("input_tokens") or 0), "output": int(u.get("output_tokens") or 0),
                    "cache_create": int(u.get("cache_creation_input_tokens") or 0),
                    "cache_read": int(u.get("cache_read_input_tokens") or 0),
                    "tool_calls": max(n_tools, prev["tool_calls"] if prev else 0) if prev else n_tools,
                    "file": f,
                }
                if prev:  # same message id seen before: keep max tool count, last usage (final)
                    rows[key]["tool_calls"] = prev["tool_calls"] + n_tools
                meta[f] = (desc, atype)
    return list(rows.values())


