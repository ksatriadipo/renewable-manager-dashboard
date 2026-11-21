/* RM Control Tower — vanilla client for the RMCT API (same-origin, session cookie). No external requests besides fonts. */
(function () {
  "use strict";
  var D = null, ME = null;
  var STATUSES = ["NOT_STARTED", "READY", "IN_PROGRESS", "IMPLEMENTED", "TESTED", "ACCEPTED", "BLOCKED", "ON_HOLD", "DEFERRED", "CANCELLED", "REJECTED", "NEEDS_REWORK"];
  var ST = { NOT_STARTED: "--s-not", READY: "--s-ready", IN_PROGRESS: "--s-prog", IMPLEMENTED: "--s-impl", TESTED: "--s-test",
    ACCEPTED: "--s-acc", BLOCKED: "--s-block", ON_HOLD: "--s-hold", DEFERRED: "--s-def", CANCELLED: "--s-can", REJECTED: "--s-rej", NEEDS_REWORK: "--s-rew" };
  var BATCH_NAME = { B0: "Batch 0 · discovery", B05: "Batch 0.5 · verification", B1: "Batch 1 · blockers", B2: "Batch 2", B3: "Batch 3",
    B4: "Batch 4", B5: "Batch 5", B6: "Batch 6", B7: "Batch 7", B8: "Batch 8", V: "Validation / RC", SUP: "Supporting (recovery/ops)" };
  var VIEWS = ["overview", "register", "timeline", "milestones", "tokens", "productivity", "capacity", "risks", "forecast", "sources"];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var col = function (s) { return "var(" + (ST[s] || "--muted") + ")"; };
  var fmt = function (n) { if (n == null || isNaN(n)) return "–"; var a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toFixed(2) + "B" : a >= 1e6 ? (n / 1e6).toFixed(2) + "M" : a >= 1e4 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n * 10) / 10); };
  var stTag = function (s) { return '<span class="st" style="color:' + col(s) + '"><span class="dot" style="background:' + col(s) + '"></span>' + esc(s || "–") + "</span>"; };
  var day = function (s) { return s ? String(s).slice(0, 10) : "–"; };
  var num = function (v, suf) { return v == null || v === "" ? "–" : esc(v) + (suf || ""); };
  var pct = function (v) { return v == null ? "–" : v + "%"; };
  var obj = function (o) { return o && typeof o === "object" ? o : {}; };
  var arr = function (a) { return Array.isArray(a) ? a : []; };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function dayDiff(a, b) { if (!a || !b) return null; return Math.round((new Date(String(b).slice(0, 10) + "T00:00:00Z") - new Date(String(a).slice(0, 10) + "T00:00:00Z")) / 864e5); }

  /* ---------- API ---------- */
  function api(method, path, body) {
    var o = { method: method, credentials: "same-origin", headers: { Accept: "application/json" }, cache: "no-store" };
    if (method !== "GET") { o.headers["X-RMCT"] = "1"; o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body || {}); }
    return fetch(path, o).then(function (r) {
      return r.text().then(function (txt) {
        var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { j = null; }
        if (!r.ok) {
          var msg = (j && (j.error || j.detail || j.message)) || (txt && txt.length < 200 ? txt : "") || r.statusText || "request failed";
          var err = new Error("HTTP " + r.status + ": " + msg); err.status = r.status; err.body = j; throw err;
        }
        return j;
      });
    });
  }
  function toast(msg, bad) { var t = $("#toast"); t.textContent = msg; t.className = "toast" + (bad ? " bad" : ""); t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, bad ? 7000 : 3500); }
  function onApiError(e, where) { if (e && e.status === 401) { showLogin("Your session ended. Sign in again."); return; } toast((where ? where + ": " : "") + (e && e.message || e), true); }

  /* ---------- theme ---------- */
  (function () { var t = store("rmct-theme"); if (t) document.documentElement.setAttribute("data-theme", t); })();
  $("#theme").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") || (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    var nx = cur === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nx); store("rmct-theme", nx); route();
  });

  /* ---------- normalisation: accepts the API shape and the v1 dataset shape; never fills gaps with invented values ---------- */
  function normalize(d) {
    d = obj(d); d.meta = obj(d.meta); d.meta.statuses = arr(d.meta.statuses).length ? d.meta.statuses : STATUSES; d.meta.formulas = obj(d.meta.formulas);
    d.tasks = arr(d.tasks); d.status_count = obj(d.status_count); d.batches = obj(d.batches); d.milestones = arr(d.milestones);
    d.critical_path = obj(d.critical_path); d.critical_path.path = arr(d.critical_path.path);
    d.forecast = obj(d.forecast); d.forecast.per_milestone = obj(d.forecast.per_milestone); d.forecast.assumptions = arr(d.forecast.assumptions);
    d.health = obj(d.health); d.capacity = obj(d.capacity); d.capacity.parallel_tasks = arr(d.capacity.parallel_tasks); d.capacity.serial_tasks = arr(d.capacity.serial_tasks);
    d.decisions = arr(d.decisions); d.findings = arr(d.findings); d.groups = obj(d.groups); d.issues = arr(d.issues); d.rounds = arr(d.rounds);
    d.tokens = obj(d.tokens); ["by_day", "by_role", "by_task", "by_model", "by_day_role"].forEach(function (k) { d.tokens[k] = obj(d.tokens[k]); });
    d.benchmarks = obj(d.benchmarks); d.benchmarks.agent_by_category = obj(d.benchmarks.agent_by_category); d.benchmarks.runner_jobs = obj(d.benchmarks.runner_jobs);
    d.benchmarks.runner_minutes_by_day = obj(d.benchmarks.runner_minutes_by_day);
    var P = obj(d.benchmarks.productivity);
    if (d.benchmarks.rework_rate == null && P.rework_rate != null) d.benchmarks.rework_rate = P.rework_rate;
    if (!d.benchmarks.runner && P.rounds_total != null) d.benchmarks.runner = { rounds: P.rounds_total, rounds_with_rollback: P.rollback_rounds, tests_fail_rounds: P.failing_test_rounds };
    d.tasks.forEach(function (t) {
      t.src = t.src || t.source || ""; t.commit = t.commit || t.commit_ref || ""; t.kind = t.kind || t.category || "";
      t.deps = arr(t.deps); t.findings = arr(t.findings);
      if (!Array.isArray(t.status_history)) t.status_history = arr(t.history).filter(function (h) { return h.field === "status"; }).map(function (h) { return { at: h.at, status: h.new_value, note: (h.old_value ? "from " + h.old_value : "") + (h.actor ? " · " + h.actor : ""), source: h.source }; });
      if (t.original_finish == null) { var pf = arr(t.history).filter(function (h) { return h.field === "planned_finish" && h.old_value; }); if (pf.length) t.original_finish = pf[0].old_value; }
      t.actual_effort = t.actual_effort && Object.keys(t.actual_effort).length ? t.actual_effort : null;
    });
    d.risks = arr(d.risks).length ? d.risks : arr(d.blockers).map(function (b) { return { id: b.id, title: b.title, type: b.type, description: b.text, milestone: b.milestone, task_id: b.id }; });
    d.risks.forEach(function (r) { r.description = r.description || r.text || ""; r.task_id = r.task_id || r.id; });
    d.decisions.forEach(function (x) { x.src = x.src || x.source || ""; });
    d.agents = arr(d.agents).map(function (a) { return { id: a.id || a.agent_id, desc: a.desc || a.description || "", task: a.task || a.task_id || "UNALLOCATED", category: a.category || "other",
      minutes: a.minutes, output: a.output || 0, input: a.input || 0, cache_create: a.cache_create || 0, cache_read: a.cache_read || 0, requests: a.requests != null ? a.requests : a.msgs, tool_calls: a.tool_calls, day: String(a.day || a.first || a.first_ts || "").slice(0, 10), era: a.era }; });
    d.rounds.forEach(function (r) { r.date = r.date || r.day || String(r.start || r.start_ts || "").slice(0, 10); r.tests = arr(r.tests); r.rollback = arr(r.rollback); r.installed = arr(r.installed); r.jobs = arr(r.jobs); });
    if (!Array.isArray(d.activity)) { var c = obj(d.commits), act = []; Object.keys(c).forEach(function (repo) { arr(c[repo]).forEach(function (x) { act.push({ repo: repo, hash: x.hash, at: x.at || x.date, subject: x.subject }); }); });
      act.sort(function (a, b) { return a.at < b.at ? 1 : -1; }); d.activity = act.slice(0, 12); }
    return d;
  }

  /* ---------- small SVG / HTML helpers ---------- */
  function stackBar(parts, total) {
    return '<div class="bar" role="img" aria-label="distribution">' + parts.filter(function (p) { return p.v > 0; }).map(function (p) {
      return '<span title="' + esc(p.k + ": " + p.v) + '" style="width:' + (100 * p.v / (total || 1)).toFixed(2) + "%;background:" + p.c + '"></span>'; }).join("") + "</div>";
  }
  function hbars(rows, opt) {
    opt = opt || {}; if (!rows.length) return '<p class="note">No data recorded.</p>';
    var w = opt.w || 640, lw = opt.lw || 150, rh = 22, max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    var h = rows.length * rh + 6, bw = w - lw - 70;
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" style="min-width:' + Math.min(w, 420) + 'px" role="img">';
    rows.forEach(function (r, i) {
      var y = i * rh + 4, len = Math.max(1, bw * r.value / max);
      s += '<text class="lbl" x="0" y="' + (y + 13) + '">' + esc(String(r.label).slice(0, opt.lc || 22)) + "<title>" + esc(r.label) + "</title></text>";
      s += '<rect x="' + lw + '" y="' + (y + 3) + '" width="' + len.toFixed(1) + '" height="13" rx="3" fill="' + (r.color || "var(--accent)") + '"></rect>';
      s += '<text x="' + (lw + len + 6).toFixed(1) + '" y="' + (y + 13) + '">' + esc(opt.f ? opt.f(r.value) : fmt(r.value)) + "</text>";
    });
    return '<div class="chart-box">' + s + "</svg></div>";
  }
  function stackedCols(cats, series, opt) {
    opt = opt || {}; if (!cats.length) return '<p class="note">No data recorded.</p>';
    var w = Math.max(360, cats.length * (opt.cw || 46) + 60), h = opt.h || 200, pb = 34, pl = 50, pt = 10;
    var tot = cats.map(function (_, i) { return series.reduce(function (a, s) { return a + (s.values[i] || 0); }, 0); });
    var max = Math.max.apply(null, tot.concat([1])), ch = h - pb - pt, bw = Math.min(28, (w - pl) / cats.length * 0.6);
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" style="min-width:' + Math.min(w, 520) + 'px" role="img">';
    for (var g = 0; g <= 4; g++) { var gy = pt + ch - ch * g / 4; s += '<line x1="' + pl + '" x2="' + w + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--line)"></line><text x="' + (pl - 6) + '" y="' + (gy + 4) + '" text-anchor="end">' + fmt(max * g / 4) + "</text>"; }
    cats.forEach(function (c, i) {
      var x = pl + (i + 0.5) * (w - pl) / cats.length - bw / 2, y = pt + ch;
      series.forEach(function (sr) { var v = sr.values[i] || 0, bh = ch * v / max; y -= bh; if (bh > 0) s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + sr.color + '"><title>' + esc(c + " · " + sr.name + ": " + fmt(v)) + "</title></rect>"; });
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 18) + '" text-anchor="middle">' + esc(String(c).slice(5)) + "</text>";
    });
    return '<div class="chart-box">' + s + "</svg></div>";
  }
  function legend(items) { return '<div class="legend">' + items.map(function (i) { return '<span><span class="dot" style="background:' + i[1] + '"></span> ' + esc(i[0]) + "</span>"; }).join("") + "</div>"; }
  function panel(title, body, note, right) {
    return '<div class="panel"><div class="panel-h"><h2>' + esc(title) + "</h2>" + (right || "") + "</div>" + (note ? '<p class="note">' + note + "</p>" : "") + body + "</div>";
  }
  function kpi(k, v, s) { return '<div class="kpi"><span class="k">' + esc(k) + '</span><span class="v">' + v + '</span><span class="s">' + (s || "") + "</span></div>"; }
  function table(head, rows, empty) {
    return '<div class="tbl-box"><table><thead><tr>' + head.map(function (h) { return "<th" + (h.charAt(0) === "#" ? ' class="num">' + esc(h.slice(1)) : ">" + esc(h)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      (rows.length ? rows.join("") : '<tr><td colspan="' + head.length + '" class="muted">' + esc(empty || "No records.") + "</td></tr>") + "</tbody></table></div>";
  }
  function pctTxt(a, b) { return b ? (100 * a / b).toFixed(1) + "%" : "–"; }
  function healthPill() { var v = D.health.value || "UNKNOWN", c = v === "GREEN" ? "var(--good)" : v === "AMBER" ? "var(--warn)" : v === "RED" ? "var(--crit)" : "var(--s-hold)"; return '<span class="pill" id="health" style="color:' + c + '">' + esc(v) + "</span>"; }
  var IDX = {};
  function byId(i) { return IDX[i] || null; }
  function taskLink(i) { var x = byId(i); return x ? '<a href="#register" data-task="' + esc(i) + '" class="mono">' + esc(i) + "</a> " + esc(x.title) : (i ? '<span class="mono">' + esc(i) + "</span>" : "–"); }
  function chipLink(i) { var t = byId(i); return '<a href="#register" data-task="' + esc(i) + '" class="chip" style="border-color:' + (t ? col(t.status) : "var(--line)") + '">' + esc(i) + "</a>"; }
  function batchProg(b) { var x = D.batches[b]; return x ? x : null; }

  /* ---------- A. Executive overview ---------- */
  function overview() {
    var t = D.tasks, sc = D.status_count, n = t.length, cancelled = sc.CANCELLED || 0, base = n - cancelled;
    var acc = sc.ACCEPTED || 0, tested = (sc.TESTED || 0) + acc, impl = tested + (sc.IMPLEMENTED || 0);
    var b2 = batchProg("B2"), b3 = batchProg("B3");
    var cur = D.milestones.filter(function (m) { return !m.complete; })[0] || null, nxt = cur ? D.milestones[D.milestones.indexOf(cur) + 1] : null;
    var cpNext = D.critical_path.path.filter(function (i) { var x = byId(i); return x && x.status !== "ACCEPTED"; })[0];
    var fc = D.forecast.per_milestone, halt = D.meta.halt, h = "";
    if (halt && (halt.text || halt.date)) h += '<div class="banner paused"><b>Project paused by owner</b><span class="note">' + esc(halt.text || "") + (halt.src ? " Source: " + esc(halt.src) : "") + (halt.date ? " (" + esc(halt.date) + ")" : "") + ".</span></div>";
    h += '<div class="grid">' + kpi("Unique tasks", n, "all batches") + kpi("Accepted", acc, pctTxt(acc, base) + " complete") +
      kpi("Tested", sc.TESTED || 0, "tested+accepted " + pctTxt(tested, base)) + kpi("Implemented", sc.IMPLEMENTED || 0, "impl.+ " + pctTxt(impl, base)) +
      kpi("In progress", sc.IN_PROGRESS || 0, "") + kpi("Ready", sc.READY || 0, "") + kpi("Blocked", sc.BLOCKED || 0, "external dependency") +
      kpi("On hold", sc.ON_HOLD || 0, "deliberate") + kpi("Deferred", sc.DEFERRED || 0, "") + kpi("Rework / rejected", (sc.NEEDS_REWORK || 0) + (sc.REJECTED || 0), "") +
      kpi("Not started", sc.NOT_STARTED || 0, "") + kpi("Cancelled", cancelled, "excluded from %") + "</div>";
    var parts = D.meta.statuses.map(function (s) { return { k: s, v: sc[s] || 0, c: col(s) }; });
    var dist = stackBar(parts, n) + legend(parts.filter(function (p) { return p.v; }).map(function (p) { return [p.k + " " + p.v, p.c]; }));
    var mrow = function (id) { var f = fc[id]; return f ? "P50 " + esc(f.p50_date || "–") + " · P80 " + esc(f.p80_date || "–") : "–"; };
    h += '<div class="hero">' + panel("Status distribution", dist, "Execution status of every unique task. IMPLEMENTED, TESTED and ACCEPTED are separate gates; only ACCEPTED counts as delivered. Overall completion = " + esc(D.meta.formulas.pct_accepted || "ACCEPTED / (all − CANCELLED)") + ".") +
      panel("Where we are", '<dl class="kv"><dt>Health</dt><dd>' + healthPill().replace(' id="health"', "") + '</dd><dt>Current milestone</dt><dd>' + (cur ? esc(cur.id + " · " + cur.name) : "all complete") +
        "</dd><dt>Next milestone</dt><dd>" + (nxt ? esc(nxt.id + " · " + nxt.name) : "–") + "</dd><dt>Critical-path task</dt><dd>" + taskLink(cpNext) +
        '</dd><dt>Batch 2</dt><dd class="num">' + (b2 ? pct(b2.pct_tested) + " tested · " + pct(b2.pct_accepted) + " accepted" : "–") + '</dd><dt>Batch 3</dt><dd class="num">' + (b3 ? pct(b3.pct_tested) + " tested · " + pct(b3.pct_accepted) + " accepted" : "–") +
        '</dd><dt>M4 forecast</dt><dd class="num">' + mrow("M4") + '</dd><dt>M7 forecast</dt><dd class="num">' + mrow("M7") + ' <span class="chip">ESTIMATED</span></dd></dl>',
        D.forecast.resume_assumption ? "Forecast dates count working days from " + esc(D.forecast.resume_assumption) + ". Not a commitment." : "") + "</div>";
    var rules = arr(D.health.rules), facts = obj(D.health.facts);
    h += panel("Health criteria", "<ul>" + rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      '<dl class="kv">' + Object.keys(facts).map(function (k) { var v = facts[k]; return "<dt>" + esc(k) + "</dt><dd>" + (Array.isArray(v) ? (v.length ? v.map(chipLink).join(" ") : "none") : esc(String(v))) + "</dd>"; }).join("") + "</dl>",
      "Health is computed by the documented rules below, first match wins; not a judgement call.");
    var bt = Object.keys(BATCH_NAME).concat(Object.keys(D.batches).filter(function (b) { return !BATCH_NAME[b]; })).filter(function (b) { return D.batches[b]; }).map(function (b) {
      var x = D.batches[b], ps = D.meta.statuses.map(function (s) { return { k: s, v: obj(x.status)[s] || 0, c: col(s) }; });
      return "<tr><td>" + esc(BATCH_NAME[b] || b) + '</td><td class="num">' + num(x.total) + '</td><td class="num">' + pct(x.pct_accepted) + '</td><td class="num">' + pct(x.pct_tested) + '</td><td class="num">' + pct(x.pct_implemented) + '</td><td style="min-width:140px">' + stackBar(ps, x.total) + "</td></tr>";
    });
    h += panel("Progress by batch", table(["Batch", "#Tasks", "#Accepted", "#Tested+", "#Implemented+", "Status mix"], bt), esc(D.meta.formulas.pct_accepted || "") + (D.meta.formulas.pct_tested ? " · Tested+ = " + esc(D.meta.formulas.pct_tested) : ""));
    var mrows = D.milestones.map(function (m) { return '<tr><td class="mono">' + esc(m.id) + "</td><td>" + esc(m.name) + '</td><td class="num">' + pct(m.pct_accepted) + '</td><td class="num">' + pct(m.pct_tested) + '</td><td style="min-width:120px">' + stackBar(D.meta.statuses.map(function (s) { return { k: s, v: obj(m.status)[s] || 0, c: col(s) }; }), m.total) + "</td><td>" + (m.complete ? "COMPLETE" : "OPEN") + "</td></tr>"; });
    h += panel("Milestone progress", table(["MS", "Name", "#Accepted", "#Tested+", "Mix", "State"], mrows));
    var fs = {}; D.findings.forEach(function (f) { fs[f.status] = (fs[f.status] || 0) + 1; });
    h += '<div class="grid-2">' + panel("Audit findings (separate layer)", '<div class="grid">' + Object.keys(fs).sort().map(function (k) { return kpi(k, fs[k], ""); }).join("") + "</div>",
      D.findings.length + " findings. Findings are not tasks and are not counted in task totals.") +
      panel("Recent activity", table(["When", "Repo", "Commit", "Subject"], D.activity.map(function (a) { return '<tr><td class="mono nw">' + esc(String(a.at || "").slice(0, 16).replace("T", " ")) + "</td><td>" + esc(a.repo) + '</td><td class="mono">' + esc(a.hash) + "</td><td>" + esc(a.subject) + "</td></tr>"; }), "No commits recorded.")) + "</div>";
    $("#v-overview").innerHTML = h;
  }

  /* ---------- B. Task register (search/filter/sort/create/edit) ---------- */
  var REG = { q: "", batch: "", status: "", ws: "", priority: "", owner: "", ms: "", blocked: "", acc: "", sort: "id", dir: 1 };
  function accState(t) { return t.status === "ACCEPTED" ? "accepted" : t.status === "TESTED" ? "awaiting acceptance" : t.status === "REJECTED" || t.status === "NEEDS_REWORK" ? "rejected / rework" : "not reviewed"; }
  function effortTxt(e) { return e ? (e.agent_minutes != null ? fmt(e.agent_minutes) + " agent-min" : "") + (e.agents ? " · " + e.agents + " run(s)" : "") : "–"; }
  function register() {
    var opts = function (key, vals, label) { return '<select id="f-' + key + '" aria-label="' + label + '"><option value="">' + label + "</option>" + vals.map(function (v) { return '<option' + (REG[key] === v ? " selected" : "") + ">" + esc(v) + "</option>"; }).join("") + "</select>"; };
    var uniq = function (f) { return Array.from(new Set(D.tasks.map(f).filter(Boolean))).sort(); };
    var h = '<div class="filters"><input id="f-q" type="search" placeholder="Search id, title, description, patch, finding…" value="' + esc(REG.q) + '">' +
      opts("batch", uniq(function (t) { return t.batch; }), "Batch") + opts("status", D.meta.statuses, "Status") + opts("ws", uniq(function (t) { return t.workstream; }), "Workstream") +
      opts("priority", uniq(function (t) { return t.priority; }), "Priority") + opts("owner", uniq(function (t) { return t.owner; }), "Agent / owner") +
      opts("ms", uniq(function (t) { return t.milestone; }), "Milestone") + opts("blocked", ["blocked", "unblocked"], "Blocked?") +
      opts("acc", ["accepted", "awaiting acceptance", "rejected / rework", "not reviewed"], "Acceptance") + "</div>";
    var rows = D.tasks.filter(function (t) {
      var s = [t.id, t.title, t.description, t.patch, t.findings.join(" "), t.workstream, t.commit, t.note].join(" ").toLowerCase();
      return (!REG.q || s.indexOf(REG.q.toLowerCase()) >= 0) && (!REG.batch || t.batch === REG.batch) && (!REG.status || t.status === REG.status) &&
        (!REG.ws || t.workstream === REG.ws) && (!REG.priority || t.priority === REG.priority) && (!REG.owner || t.owner === REG.owner) && (!REG.ms || t.milestone === REG.ms) &&
        (!REG.blocked || (REG.blocked === "blocked") === (t.status === "BLOCKED" || !!t.blocker)) && (!REG.acc || accState(t) === REG.acc);
    });
    var keyf = function (t, k) { var v = k === "effort" ? (t.actual_effort || {}).agent_minutes : t[k]; return v == null ? "" : v; };
    rows.sort(function (a, b) { var x = keyf(a, REG.sort), y = keyf(b, REG.sort); if (typeof x === "number" && typeof y === "number") return (x - y) * REG.dir; x = String(x); y = String(y); return (x > y ? 1 : x < y ? -1 : 0) * REG.dir; });
    var cols = [["id", "ID"], ["title", "Task"], ["batch", "Batch"], ["workstream", "Workstream"], ["priority", "Prio"], ["owner", "Owner"], ["status", "Status"], ["milestone", "MS"],
      ["est_p50_d", "Est. d"], ["effort", "Actual"], ["planned_start", "Plan start"], ["planned_finish", "Plan finish"], ["actual_start", "Act. start"], ["actual_finish", "Act. finish"], ["deps", "Deps"], ["patch", "Patch / commit"], ["updated_at", "Updated"]];
    h += '<div class="tbl-box"><table><thead><tr>' + cols.map(function (c) { return '<th data-sort="' + c[0] + '">' + c[1] + (REG.sort === c[0] ? (REG.dir > 0 ? " ▲" : " ▼") : "") + "</th>"; }).join("") + "</tr></thead><tbody>" +
      (rows.length ? rows.map(function (t) {
        return '<tr class="row' + (t.critical ? " crit" : "") + '" data-task="' + esc(t.id) + '"><td class="mono nw">' + esc(t.id) + '</td><td class="clip">' + esc(t.title) + (t.blocker ? '<br><span class="note" style="color:var(--crit)">' + esc(t.blocker) + "</span>" : "") + "</td><td>" + esc(t.batch) + "</td><td>" + esc(t.workstream) +
          "</td><td>" + esc(t.priority || "–") + "</td><td>" + esc(t.owner || "–") + "</td><td>" + stTag(t.status) + "</td><td>" + esc(t.milestone || "–") + '</td><td class="num">' + num(t.est_p50_d) + '</td><td class="nw">' + effortTxt(t.actual_effort) +
          '</td><td class="mono nw">' + day(t.planned_start) + '</td><td class="mono nw">' + day(t.planned_finish) + '</td><td class="mono nw">' + day(t.actual_start) + '</td><td class="mono nw">' + day(t.actual_finish) +
          '</td><td class="mono">' + esc(t.deps.join(" ") || "–") + '</td><td class="mono">' + esc([t.patch, t.commit].filter(Boolean).join(" · ") || "–") + '</td><td class="mono nw">' + day(t.updated_at) + "</td></tr>";
      }).join("") : '<tr><td colspan="' + cols.length + '" class="muted">No task matches these filters.</td></tr>') + "</tbody></table></div>";
    var right = '<div class="row-actions"><button class="btn" type="button" id="new-task">New task</button><button class="btn sec" type="button" id="clear-f">Clear filters</button></div>';
    $("#v-register").innerHTML = panel("Master task register", h, rows.length + " of " + D.tasks.length + " tasks. Amber edge = critical path. Select a row for detail, history and editing; manual edits are recorded in the append-only history and protected from re-ingestion.", right);
    ["q", "batch", "status", "ws", "priority", "owner", "ms", "blocked", "acc"].forEach(function (k) {
      var el = $("#f-" + k); el.addEventListener(k === "q" ? "input" : "change", function () { REG[k] = el.value; register(); if (k === "q") { var e = $("#f-q"); e.focus(); try { e.setSelectionRange(e.value.length, e.value.length); } catch (x) { /* search inputs in some engines */ } } });
    });
    $$("#v-register th[data-sort]").forEach(function (th) { th.addEventListener("click", function () { var k = th.getAttribute("data-sort"); REG.dir = REG.sort === k ? -REG.dir : 1; REG.sort = k; register(); }); });
    $("#new-task").addEventListener("click", function () { openForm(null); });
    $("#clear-f").addEventListener("click", function () { Object.keys(REG).forEach(function (k) { if (k !== "sort" && k !== "dir") REG[k] = ""; }); register(); });
  }

  /* task detail drawer */
  function openTask(id) {
    var t = byId(id); if (!t) return;
    var deps = t.deps.map(function (d) { var x = byId(d); return '<span class="chip">' + esc(d) + " " + (x ? stTag(x.status) : "unknown") + "</span>"; }).join("") || "–";
    var dependents = D.tasks.filter(function (x) { return x.deps.indexOf(id) >= 0; }).map(function (x) { return chipLink(x.id); }).join("") || "–";
    var e = t.actual_effort, v = dayDiff(t.planned_finish, t.actual_finish);
    var b = '<div><span class="mono note">' + esc(t.id) + " · " + esc(BATCH_NAME[t.batch] || t.batch) + '</span><h2 id="dr-title">' + esc(t.title) + "</h2></div>" +
      '<div class="chips">' + stTag(t.status) + (t.critical ? '<span class="chip" style="color:var(--sun)">critical path</span>' : "") + (t.status_before_hold ? '<span class="chip">before hold: ' + esc(t.status_before_hold) + "</span>" : "") +
      (t.origin ? '<span class="chip">origin: ' + esc(t.origin) + "</span>" : "") + (arr(t.locked_fields).length ? '<span class="chip">locked: ' + esc(t.locked_fields.join(", ")) + "</span>" : "") + "</div>" +
      '<div class="row-actions"><button class="btn" type="button" id="edit-task">Edit task</button></div>' +
      (t.description ? '<p>' + esc(t.description) + "</p>" : "") +
      '<dl class="kv"><dt>Workstream</dt><dd>' + esc(t.workstream || "–") + "</dd><dt>Kind</dt><dd>" + esc(t.kind || "–") + "</dd><dt>Priority</dt><dd>" + esc(t.priority || "–") + "</dd><dt>Owner</dt><dd>" + esc(t.owner || "–") + "</dd><dt>Milestone</dt><dd>" + esc(t.milestone || "–") +
      "</dd><dt>Estimate</dt><dd>" + (t.est_p50_d == null ? "–" : "P50 " + esc(t.est_p50_d) + " d" + (t.est_p80_d != null ? " · P80 " + esc(t.est_p80_d) + " d" : "")) +
      "</dd><dt>Planned</dt><dd>" + day(t.planned_start) + " → " + day(t.planned_finish) + (t.planned_finish_p80 ? " (P80 " + day(t.planned_finish_p80) + ")" : "") + (t.original_finish ? " · original baseline " + day(t.original_finish) : "") +
      "</dd><dt>Actual</dt><dd>" + day(t.actual_start) + " → " + day(t.actual_finish) + "</dd><dt>Variance</dt><dd>" + (v == null ? "–" : '<span class="' + (v > 0 ? "var-pos" : "var-neg") + '">' + (v > 0 ? "+" : "") + v + " d vs plan</span>") +
      "</dd><dt>Actual effort</dt><dd>" + (e ? (e.agents != null ? e.agents + " agent run(s), " : "") + (e.agent_minutes != null ? fmt(e.agent_minutes) + " agent-min, " : "") + fmt(e.output_tokens) + " output tokens" : "not recorded / orchestrator") +
      '</dd><dt>Patch</dt><dd class="mono">' + esc(t.patch || "–") + '</dd><dt>Commit</dt><dd class="mono">' + esc(t.commit || "–") + "</dd><dt>Acceptance</dt><dd>" + esc(t.acceptance || "–") + "</dd><dt>Evidence</dt><dd>" + esc(t.evidence || "–") +
      "</dd><dt>Blocker</dt><dd>" + esc(t.blocker || t.hold_reason || "–") + "</dd><dt>Findings</dt><dd>" + (t.findings.map(function (f) { return '<span class="chip">' + esc(f) + "</span>"; }).join(" ") || "–") +
      "</dd><dt>Depends on</dt><dd>" + deps + "</dd><dt>Needed by</dt><dd>" + dependents + "</dd><dt>Note</dt><dd>" + esc(t.note || "–") + '</dd><dt>Source</dt><dd class="mono">' + esc(t.src || "–") + '</dd><dt>Updated</dt><dd class="mono">' + esc(t.updated_at || "–") + "</dd></dl>" +
      '<h3>History</h3><div id="dr-hist"><p class="note">Loading history…</p></div>';
    $("#dr-body").innerHTML = b; $("#drawer").hidden = false; $("#dr-close").focus();
    $("#edit-task").addEventListener("click", function () { openForm(t); });
    var local = function (note) {
      var hist = t.status_history.map(function (h) { return '<tr><td class="mono nw">' + esc(String(h.at || "").slice(0, 16)) + "</td><td>status</td><td>" + stTag(h.status) + "</td><td>" + esc(h.note) + '</td><td class="note">' + esc(h.source) + "</td></tr>"; });
      $("#dr-hist").innerHTML = (note ? '<p class="note">' + esc(note) + "</p>" : "") + table(["At", "Field", "Value", "Note", "Source"], hist, "No recorded transitions.");
    };
    api("GET", "/api/tasks/" + encodeURIComponent(id) + "/history").then(function (r) {
      var rows = Array.isArray(r) ? r : arr(r && (r.history || r.items));
      if ($("#dr-hist") == null) return;
      $("#dr-hist").innerHTML = table(["At", "Field", "Change", "Actor", "Source"], rows.map(function (h) {
        var change = h.field === "status" ? stTag(h.old_value) + " → " + stTag(h.new_value) : esc(h.old_value == null || h.old_value === "" ? "∅" : h.old_value) + " → " + esc(h.new_value == null || h.new_value === "" ? "∅" : h.new_value);
        return '<tr><td class="mono nw">' + esc(String(h.at || "").slice(0, 16).replace("T", " ")) + "</td><td>" + esc(h.field) + "</td><td>" + change + "</td><td>" + esc(h.actor || "–") + '</td><td class="note">' + esc(h.source || "") + "</td></tr>";
      }), "No recorded changes.");
    }).catch(function (err) { if (err && err.status === 401) return onApiError(err); local("Live history unavailable (" + (err && err.message) + "); showing status transitions from the dashboard snapshot."); });
  }
  $("#dr-close").addEventListener("click", function () { $("#drawer").hidden = true; });
  $("#drawer").addEventListener("click", function (ev) { if (ev.target && ev.target.id === "drawer") $("#drawer").hidden = true; });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") $("#drawer").hidden = true; });
  document.addEventListener("click", function (ev) { var el = ev.target && ev.target.closest ? ev.target.closest("[data-task]") : null; if (el && D) { ev.preventDefault(); openTask(el.getAttribute("data-task")); } });

  /* create / edit form */
  var FIELDS = [["id", "Task ID", "text"], ["title", "Title", "text"], ["status", "Status", "status"], ["batch", "Batch", "text"], ["workstream", "Workstream", "text"], ["priority", "Priority", "text"],
    ["owner", "Owner / agent", "text"], ["milestone", "Milestone", "text"], ["category", "Kind", "text"], ["est_p50_d", "Estimate P50 (days)", "number"], ["est_p80_d", "Estimate P80 (days)", "number"],
    ["planned_start", "Planned start", "date"], ["planned_finish", "Planned finish", "date"], ["actual_start", "Actual start", "date"], ["actual_finish", "Actual finish", "date"],
    ["deps", "Dependencies (IDs, comma separated)", "list"], ["patch", "Patch", "text"], ["commit_ref", "Commit", "text"], ["description", "Description", "area"], ["blocker", "Blocker", "area"],
    ["acceptance", "Acceptance criteria", "area"], ["evidence", "Test evidence", "area"], ["note", "Note", "area"], ["source", "Source document", "text"]];
  function fval(t, k) { if (!t) return ""; var v = k === "commit_ref" ? t.commit : k === "source" ? t.src : k === "category" ? t.kind : t[k]; if (k === "deps") return arr(v).join(", "); if (v == null) return ""; return /^(planned|actual)_(start|finish)$/.test(k) ? String(v).slice(0, 10) : String(v); }
  function openForm(t) {
    var uniq = function (f) { return Array.from(new Set(D.tasks.map(f).filter(Boolean))).sort(); };
    var dl = function (id, vals) { return '<datalist id="' + id + '">' + vals.map(function (v) { return "<option value=\"" + esc(v) + '">'; }).join("") + "</datalist>"; };
    var lists = { batch: uniq(function (x) { return x.batch; }), workstream: uniq(function (x) { return x.workstream; }), priority: uniq(function (x) { return x.priority; }), owner: uniq(function (x) { return x.owner; }), milestone: D.milestones.map(function (m) { return m.id; }), category: uniq(function (x) { return x.kind; }) };
    var f = FIELDS.map(function (F) {
      var k = F[0], v = fval(t, k), lab = esc(F[1]) + (k === "id" || k === "title" || k === "status" ? " *" : "");
      if (F[2] === "status") return "<label>" + lab + '<select name="status">' + D.meta.statuses.map(function (s) { return "<option" + ((v || "NOT_STARTED") === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></label>";
      if (F[2] === "area") return '<label class="wide">' + lab + '<textarea name="' + k + '" rows="2">' + esc(v) + "</textarea></label>";
      return '<label' + (k === "title" || k === "deps" ? ' class="wide"' : "") + ">" + lab + '<input name="' + k + '" type="' + (F[2] === "number" ? "number" : F[2] === "date" ? "date" : "text") + '"' + (F[2] === "number" ? ' step="0.1" min="0"' : "") +
        (lists[k] ? ' list="dl-' + k + '"' : "") + ' value="' + esc(v) + '"' + (k === "id" && t ? " readonly" : "") + (k === "id" || k === "title" ? " required" : "") + (k === "id" ? ' autocapitalize="characters" pattern="[A-Za-z0-9._-]{1,40}"' : "") + "></label>";
    }).join("");
    $("#dr-body").innerHTML = '<div><span class="mono note">' + (t ? esc(t.id) + " · edit" : "new task") + '</span><h2 id="dr-title">' + (t ? "Edit task" : "Create task") + "</h2></div>" +
      '<form id="task-form" class="form" novalidate><div class="fgrid">' + f + (t ? '<label class="wide">Reason for change (recorded in history)<input name="_reason" type="text"></label>' : "") + "</div>" +
      Object.keys(lists).map(function (k) { return dl("dl-" + k, lists[k]); }).join("") +
      '<div id="tf-msg"></div><div class="row-actions"><button class="btn" type="submit">' + (t ? "Save changes" : "Create task") + '</button><button class="btn sec" type="button" id="tf-cancel">Cancel</button></div></form>';
    $("#drawer").hidden = false;
    $("#tf-cancel").addEventListener("click", function () { if (t) openTask(t.id); else $("#drawer").hidden = true; });
    $("#task-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var form = ev.target, out = {}, msg = $("#tf-msg"), btn = form.querySelector('button[type="submit"]');
      FIELDS.forEach(function (F) {
        var k = F[0], el = form.querySelector('[name="' + k + '"]'); if (!el) return;
        var raw = String(el.value == null ? "" : el.value).trim(), val;
        if (F[2] === "number") val = raw === "" ? null : Number(raw);
        else if (F[2] === "list") val = raw ? raw.split(/[,\s]+/).filter(Boolean) : [];
        else if (F[2] === "date") val = raw || null;
        else val = raw;
        if (!t) { if (val !== "" && val !== null && !(Array.isArray(val) && !val.length)) out[k] = val; return; }
        var old = fval(t, k), cmp = Array.isArray(val) ? val.join(", ") : val == null ? "" : String(val);
        if (k !== "id" && cmp !== old) out[k] = val;
      });
      var errs = [];
      if (!t && !out.id) errs.push("Task ID is required."); if (!t && out.id && !/^[A-Za-z0-9._-]{1,40}$/.test(out.id)) errs.push("Task ID may use letters, digits, dot, dash and underscore (max 40).");
      if (!t && byId(out.id)) errs.push("Task ID " + out.id + " already exists.");
      if (!t && !out.title) errs.push("Title is required.");
      if (t && "title" in out && !out.title) errs.push("Title cannot be empty.");
      ["est_p50_d", "est_p80_d"].forEach(function (k) { if (out[k] != null && (isNaN(out[k]) || out[k] < 0)) errs.push(k + " must be a non-negative number."); });
      var ps = "planned_start" in out ? out.planned_start : t && t.planned_start, pf = "planned_finish" in out ? out.planned_finish : t && t.planned_finish;
      if (ps && pf && String(ps).slice(0, 10) > String(pf).slice(0, 10)) errs.push("Planned start is after planned finish.");
      var unknown = arr(out.deps).filter(function (d) { return !byId(d); }); if (unknown.length) errs.push("Unknown dependency ID(s): " + unknown.join(", "));
      if (t && arr(out.deps).indexOf(t.id) >= 0) errs.push("A task cannot depend on itself.");
      if (errs.length) { msg.innerHTML = '<div class="err">' + errs.map(esc).join("<br>") + "</div>"; return; }
      if (t && !Object.keys(out).length) { msg.innerHTML = '<div class="err">Nothing changed.</div>'; return; }
      var reason = form.querySelector('[name="_reason"]'); if (t && reason && reason.value.trim()) out.reason = reason.value.trim();
      btn.disabled = true; msg.innerHTML = '<p class="note">Saving…</p>';
      var p = t ? api("PATCH", "/api/tasks/" + encodeURIComponent(t.id), out) : api("POST", "/api/tasks", out);
      p.then(function () { var id = t ? t.id : out.id; toast(t ? "Saved " + id : "Created " + id); return loadDashboard().then(function () { if (byId(id)) openTask(id); }); })
        .catch(function (err) { btn.disabled = false; if (err && err.status === 401) return onApiError(err); msg.innerHTML = '<div class="err">Not saved. ' + esc(err && err.message) + "</div>"; });
    });
  }

  /* ---------- C. Timeline + Gantt ---------- */
  var TL = { scale: "day", scope: "ALL" };
  function timeline() {
    var scopes = { ALL: ["B05", "B1", "B2", "B3", "V"], B2: ["B2"], B3: ["B3"], V: ["V"] };
    var sel = scopes[TL.scope] || scopes.ALL;
    var ts = D.tasks.filter(function (t) { return (t.planned_start || t.planned_finish || t.actual_finish || t.actual_start) && sel.indexOf(t.batch) >= 0; });
    var fc = D.forecast.per_milestone, ms = D.milestones;
    var seg = function (key, vals, lab) { return '<div class="seg" role="group" aria-label="' + lab + '">' + vals.map(function (k) { return '<button type="button" data-' + key + '="' + k[0] + '" aria-pressed="' + (TL[key] === k[0]) + '">' + k[1] + "</button>"; }).join("") + "</div>"; };
    var ctrl = '<div class="row-actions">' + seg("scope", [["ALL", "Integrated"], ["B2", "Batch 2"], ["B3", "Batch 3"], ["V", "Validation"]], "Scope") + seg("scale", [["day", "Day"], ["week", "Week"], ["month", "Month"]], "Scale") + "</div>";
    var dates = [];
    ts.forEach(function (t) { [t.planned_start, t.planned_finish, t.planned_finish_p80, t.actual_finish, t.actual_start, t.original_finish].forEach(function (d) { if (d) dates.push(String(d).slice(0, 10)); }); });
    if (TL.scope === "ALL") Object.keys(fc).forEach(function (k) { if (fc[k].p80_date) dates.push(fc[k].p80_date); if (fc[k].p50_date) dates.push(fc[k].p50_date); });
    var gen = D.meta.generated_at ? String(D.meta.generated_at).slice(0, 10) : null; if (gen) dates.push(gen);
    if (!ts.length) { $("#v-timeline").innerHTML = panel("Timeline: plan vs actual", '<p class="note">No task in this scope has a recorded date. Nothing is drawn; no dates are invented.</p>', "", ctrl); bindTl(); return; }
    dates.sort(); var d0 = new Date(dates[0] + "T00:00:00Z"), d1 = new Date(dates[dates.length - 1] + "T00:00:00Z");
    d0.setUTCDate(d0.getUTCDate() - 1); d1.setUTCDate(d1.getUTCDate() + 2);
    var px = TL.scale === "day" ? 40 : TL.scale === "week" ? 16 : 6, ndays = Math.round((d1 - d0) / 864e5), lw = 170, rh = 20;
    var X = function (s) { return lw + Math.round((new Date(String(s).slice(0, 10) + "T00:00:00Z") - d0) / 864e5) * px; };
    var rows = [];
    sel.forEach(function (g) { var tg = ts.filter(function (t) { return t.batch === g; }); if (tg.length) { rows.push({ head: BATCH_NAME[g] || g }); tg.forEach(function (t) { rows.push({ t: t }); }); } });
    rows.push({ head: "Parallel execution (tasks active per day)" }); rows.push({ par: true });
    if (TL.scope === "ALL") { rows.push({ head: "Milestone gates (plan vs forecast)" }); ms.forEach(function (m) { rows.push({ m: m }); }); }
    var w = lw + ndays * px + 20, h = rows.length * rh + 34, ypos = {}, bars = {};
    var s = '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Gantt chart">';
    s += '<defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6z" fill="var(--muted)"></path></marker></defs>';
    for (var i = 0; i <= ndays; i++) {
      var dd = new Date(d0.getTime() + i * 864e5), x = lw + i * px, wk = dd.getUTCDay() === 0 || dd.getUTCDay() === 6;
      if (wk && TL.scale !== "month") s += '<rect x="' + x + '" y="20" width="' + px + '" height="' + (h - 20) + '" fill="var(--surface-2)"></rect>';
      var show = TL.scale === "day" || (TL.scale === "week" && dd.getUTCDay() === 1) || (TL.scale === "month" && dd.getUTCDate() === 1) || i === 0;
      if (show) s += '<text x="' + (x + 2) + '" y="13">' + dd.toISOString().slice(5, 10) + '</text><line x1="' + x + '" x2="' + x + '" y1="18" y2="' + h + '" stroke="var(--line)"></line>';
    }
    if (gen) s += '<line x1="' + X(gen) + '" x2="' + X(gen) + '" y1="18" y2="' + h + '" stroke="var(--sun)" stroke-dasharray="3 3"></line><text x="' + (X(gen) + 3) + '" y="' + (h - 4) + '" style="fill:var(--sun)">now</text>';
    rows.forEach(function (r, k) {
      var y = 24 + k * rh;
      if (r.head) { s += '<text class="lbl" x="0" y="' + (y + 13) + '" style="font-weight:600">' + esc(r.head) + "</text>"; return; }
      if (r.par) {
        for (var j = 0; j < ndays; j++) {
          var ds = new Date(d0.getTime() + j * 864e5).toISOString().slice(0, 10), c = ts.filter(function (t) { var a = t.actual_start ? String(t.actual_start).slice(0, 10) : null, f = t.actual_finish ? String(t.actual_finish).slice(0, 10) : (a ? gen : null); return a && f && a <= ds && ds <= f; }).length;
          if (c) s += '<rect x="' + (lw + j * px) + '" y="' + (y + 3) + '" width="' + px + '" height="13" fill="var(--accent)" opacity="' + Math.min(1, 0.2 + c * 0.15).toFixed(2) + '"><title>' + ds + ": " + c + " task(s) active</title></rect>" + (px >= 16 ? '<text x="' + (lw + j * px + 3) + '" y="' + (y + 13) + '" class="lbl">' + c + "</text>" : "");
        }
        return;
      }
      if (r.t) {
        var t = r.t; ypos[t.id] = y + 9;
        s += '<text x="8" y="' + (y + 13) + '" data-task="' + esc(t.id) + '" style="cursor:pointer">' + esc((t.id + " " + t.title).slice(0, 24)) + "<title>" + esc(t.id + " " + t.title) + "</title></text>";
        var lo = null, hi = null;
        if (t.original_finish && t.original_finish !== t.planned_finish) { var ox = X(t.original_finish); s += '<line x1="' + (ox + px / 2) + '" x2="' + (ox + px / 2) + '" y1="' + (y + 2) + '" y2="' + (y + 16) + '" stroke="var(--muted)" stroke-width="2"><title>' + esc(t.id + " original baseline finish " + day(t.original_finish)) + "</title></line>"; }
        if (t.planned_finish || t.planned_start) {
          var p0 = X(t.planned_start || t.planned_finish), p1 = X(t.planned_finish_p80 || t.planned_finish || t.planned_start) + px;
          s += '<rect x="' + p0 + '" y="' + (y + 4) + '" width="' + Math.max(px, p1 - p0) + '" height="10" rx="2" fill="none" stroke="var(--ink-2)" stroke-dasharray="2 2"><title>' + esc(t.id + " planned " + (t.planned_start ? day(t.planned_start) + " → " : "") + "P50 " + day(t.planned_finish) + (t.planned_finish_p80 ? " · P80 " + day(t.planned_finish_p80) : "") + (t.est_p50_d != null ? " · est " + t.est_p50_d + " d" : "")) + "</title></rect>";
          lo = p0; hi = Math.max(p0 + px, p1);
        }
        if (t.actual_finish || t.actual_start) {
          var a0 = X(t.actual_start || t.actual_finish), a1 = X(t.actual_finish || gen || t.actual_start) + px, vv = dayDiff(t.planned_finish, t.actual_finish);
          s += '<rect x="' + a0 + '" y="' + (y + 5) + '" width="' + Math.max(6, a1 - a0) + '" height="8" rx="2" fill="' + col(t.status) + '"' + (t.actual_finish ? "" : ' opacity=".55"') + "><title>" + esc(t.id + " actual " + day(t.actual_start) + " → " + (t.actual_finish ? day(t.actual_finish) : "open") + " · " + t.status + (vv != null ? " · variance " + (vv > 0 ? "+" : "") + vv + " d" : "")) + "</title></rect>";
          lo = lo == null ? a0 : Math.min(lo, a0); hi = Math.max(hi || 0, a1);
        }
        bars[t.id] = { lo: lo, hi: hi, y: y + 9 };
        if (t.critical) s += '<circle cx="3" cy="' + (y + 9) + '" r="3" fill="var(--sun)"></circle>';
        return;
      }
      var m = r.m, f = fc[m.id] || {};
      s += '<text x="8" y="' + (y + 13) + '">' + esc((m.id + " " + m.name).slice(0, 24)) + "<title>" + esc(m.id + " " + m.name) + "</title></text>";
      if (m.planned_p50) s += '<path d="M' + X(m.planned_p50) + " " + (y + 9) + ' l6 -6 l6 6 l-6 6z" fill="none" stroke="var(--ink-2)"><title>' + esc(m.id + " planned P50 " + m.planned_p50) + "</title></path>";
      if (f.p50_date) s += '<rect x="' + X(f.p50_date) + '" y="' + (y + 6) + '" width="' + Math.max(px, X(f.p80_date || f.p50_date) - X(f.p50_date) + px) + '" height="7" rx="3" fill="var(--accent)" opacity=".8"><title>' + esc(m.id + " forecast P50 " + f.p50_date + " · P80 " + (f.p80_date || "–") + " (ESTIMATED)") + "</title></rect>";
      if (m.actual) s += '<path d="M' + X(m.actual) + " " + (y + 9) + ' l6 -6 l6 6 l-6 6z" fill="var(--good)"><title>' + esc(m.id + " actual " + day(m.actual)) + "</title></path>";
    });
    // dependency links (only between drawn tasks)
    var links = "";
    ts.forEach(function (t) { t.deps.forEach(function (d) { var a = bars[d], b = bars[t.id]; if (!a || !b || a.hi == null || b.lo == null) return; var cp = t.critical && byId(d) && byId(d).critical;
      links += '<path d="M' + a.hi + " " + a.y + " C" + (a.hi + 14) + " " + a.y + " " + (b.lo - 14) + " " + b.y + " " + (b.lo - 1) + " " + b.y + '" fill="none" stroke="' + (cp ? "var(--sun)" : "var(--muted)") + '" stroke-width="' + (cp ? 1.6 : 1) + '" opacity=".75" marker-end="url(#arr)"><title>' + esc(d + " → " + t.id) + "</title></path>"; }); });
    s += links + "</svg>";
    var vrows = ts.filter(function (t) { return t.planned_finish || t.actual_finish; }).map(function (t) {
      var v = dayDiff(t.planned_finish, t.actual_finish), ad = dayDiff(t.actual_start, t.actual_finish);
      return '<tr class="row" data-task="' + esc(t.id) + '"><td class="mono nw">' + esc(t.id) + '</td><td>' + stTag(t.status) + '</td><td class="mono nw">' + day(t.original_finish) + '</td><td class="mono nw">' + day(t.planned_finish) + '</td><td class="mono nw">' + day(t.actual_start) + '</td><td class="mono nw">' + day(t.actual_finish) +
        '</td><td class="num">' + num(t.est_p50_d) + '</td><td class="num">' + (ad == null ? "–" : ad + 1) + '</td><td class="num ' + (v > 0 ? "var-pos" : v < 0 ? "var-neg" : "") + '">' + (v == null ? "–" : (v > 0 ? "+" : "") + v) + "</td></tr>";
    });
    $("#v-timeline").innerHTML = panel("Timeline: plan vs actual", '<div class="chart-box">' + s + "</div>" +
      legend([["planned window", "var(--ink-2)"], ["actual (status colour; faded = still open)", "var(--s-acc)"], ["original baseline tick", "var(--muted)"], ["milestone forecast P50→P80", "var(--accent)"], ["critical path / critical link", "var(--sun)"]]),
      "Planned = revised baseline from the tracker; original baseline appears when the history recorded an earlier planned finish. Actual start/finish come from recorded runs, commits and decisions. Tasks without any recorded date are not drawn; no dates are invented. Arrows = dependencies between drawn tasks.", ctrl) +
      panel("Schedule variance", table(["ID", "Status", "Original", "Planned", "Act. start", "Act. finish", "#Est. d", "#Act. d", "#Var. d"], vrows), "Variance = actual finish − planned finish in calendar days (positive = late). Actual duration counts calendar days inclusive; '–' where a date is missing.");
    bindTl();
  }
  function bindTl() {
    $$("[data-scale]").forEach(function (b) { b.addEventListener("click", function () { TL.scale = b.getAttribute("data-scale"); timeline(); }); });
    $$("[data-scope]").forEach(function (b) { b.addEventListener("click", function () { TL.scope = b.getAttribute("data-scope"); timeline(); }); });
  }

  /* ---------- D. Milestones ---------- */
  function milestones() {
    var fc = D.forecast.per_milestone;
    if (!D.milestones.length) { $("#v-milestones").innerHTML = panel("Milestones", '<p class="note">No milestones in the dataset.</p>'); return; }
    var h = D.milestones.map(function (m, idx) {
      var tasks = arr(m.tasks), parts = D.meta.statuses.map(function (s) { return { k: s, v: obj(m.status)[s] || 0, c: col(s) }; }), f = fc[m.id] || {};
      var risks = tasks.map(byId).filter(function (t) { return t && ["BLOCKED", "NEEDS_REWORK", "ON_HOLD", "REJECTED"].indexOf(t.status) >= 0; });
      var ext = {}; tasks.forEach(function (i) { var t = byId(i); if (t) t.deps.forEach(function (d) { if (tasks.indexOf(d) < 0) ext[d] = 1; }); });
      var prev = idx > 0 ? D.milestones[idx - 1].id : null;
      var accReq = tasks.map(byId).filter(function (t) { return t && t.acceptance; }).slice(0, 6).map(function (t) { return "<li><span class=\"mono\">" + esc(t.id) + "</span> " + esc(t.acceptance) + "</li>"; }).join("");
      return '<div class="ms"><div class="ms-head"><span><span class="ms-id">' + esc(m.id) + "</span> <b>" + esc(m.name) + "</b></span>" +
        '<span class="pill" style="color:' + (m.complete ? "var(--good)" : "var(--ink-2)") + '">' + (m.complete ? "COMPLETE" : "OPEN") + "</span></div>" +
        '<span class="note">' + esc(m.scope || "") + "</span>" + stackBar(parts, m.total) +
        '<dl class="kv"><dt>Tasks</dt><dd>' + num(m.total) + " · accepted " + pct(m.pct_accepted) + " · tested+ " + pct(m.pct_tested) + " · implemented+ " + pct(m.pct_implemented) +
        '</dd><dt>Planned</dt><dd class="num">' + esc(m.planned_p50 || "–") + (m.planned_p80 ? " (P80 " + esc(m.planned_p80) + ")" : "") +
        '</dd><dt>Forecast</dt><dd class="num">P50 ' + esc(f.p50_date || "–") + " · P80 " + esc(f.p80_date || "–") + ' <span class="chip">ESTIMATED</span>' + (m.variance_days_p50 != null ? ' <span class="' + (m.variance_days_p50 > 0 ? "var-pos" : "var-neg") + '">' + (m.variance_days_p50 > 0 ? "+" : "") + esc(m.variance_days_p50) + " d vs plan</span>" : "") +
        "</dd><dt>Actual</dt><dd>" + (m.actual ? day(m.actual) : m.complete ? "complete" : "–") +
        "</dd><dt>Depends on</dt><dd>" + ((prev ? '<span class="chip">' + esc(prev) + "</span> " : "") + Object.keys(ext).map(chipLink).join(" ") || "–") +
        "</dd><dt>Risks</dt><dd>" + (risks.map(function (t) { return '<a href="#register" data-task="' + esc(t.id) + '" class="mono">' + esc(t.id) + "</a> " + stTag(t.status); }).join(" · ") || "none recorded") +
        "</dd><dt>Required</dt><dd>" + (tasks.map(chipLink).join(" ") || "–") + "</dd></dl>" +
        (accReq ? "<details><summary class=\"note\">Acceptance requirements</summary><ul>" + accReq + "</ul></details>" : "") + "</div>";
    }).join("");
    $("#v-milestones").innerHTML = panel("Milestones M1–M7", '<div class="grid-2">' + h + "</div>", esc(D.milestones[0].rule || "A milestone is complete only when every required task is ACCEPTED.") + " Implemented code alone never completes a milestone.");
  }

  /* ---------- E. Tokens ---------- */
  function tokens() {
    var T = D.tokens, days = Object.keys(T.by_day).sort();
    if (!days.length) { $("#v-tokens").innerHTML = panel("Token analytics", '<p class="note">No token usage has been ingested yet.</p>'); return; }
    var mk = function (role, k) { return days.map(function (d) { var v = T.by_day_role[d + "|" + role]; return v ? v[k] || 0 : 0; }); };
    var roles = T.by_role, R = function (r) { return obj(roles[r]); }, sum = function (k) { return Object.keys(roles).reduce(function (a, r) { return a + (roles[r][k] || 0); }, 0); };
    var tot = function (o) { return (o.input || 0) + (o.output || 0) + (o.cache_create || 0) + (o.cache_read || 0); };
    var comp = function (o) { return stackBar([{ k: "input", v: o.input || 0, c: "var(--s-test)" }, { k: "output", v: o.output || 0, c: "var(--accent)" }, { k: "cache create", v: o.cache_create || 0, c: "var(--info)" }, { k: "cache read", v: o.cache_read || 0, c: "var(--s-not)" }], tot(o)); };
    var acc = D.tasks.filter(function (t) { return t.status === "ACCEPTED"; }), accE = acc.filter(function (t) { return t.actual_effort && t.actual_effort.output_tokens != null; });
    var tst = D.tasks.filter(function (t) { return (t.status === "ACCEPTED" || t.status === "TESTED") && t.actual_effort && t.actual_effort.output_tokens != null; });
    var avg = function (xs) { return xs.length ? xs.reduce(function (a, t) { return a + t.actual_effort.output_tokens; }, 0) / xs.length : null; };
    var h = '<div class="grid">' + kpi("API responses", fmt(T.messages != null ? T.messages : sum("requests")), T.sessions != null ? T.sessions + " sessions" : "") + kpi("Input (uncached)", fmt(sum("input")), "") + kpi("Output", fmt(sum("output")), "newly generated") +
      kpi("Cache creation", fmt(sum("cache_create")), "") + kpi("Cache read", fmt(sum("cache_read")), "reused context, not generated") + kpi("Tool calls", sum("tool_calls") ? fmt(sum("tool_calls")) : "–", sum("tool_calls") ? "" : "not recorded") +
      kpi("Subagent runs", T.subagents != null ? T.subagents : D.agents.length, "") + kpi("Output / accepted task", accE.length ? fmt(avg(accE)) : "–", accE.length + " accepted tasks with mapped runs") +
      kpi("Output / tested+ task", tst.length ? fmt(avg(tst)) : "–", tst.length + " tasks") + "</div>";
    var roleNames = Object.keys(roles), rc = { orchestrator: "var(--sun)", subagent: "var(--accent)", runner: "var(--info)" };
    h += '<div class="grid-2">' + panel("Output tokens per day", stackedCols(days, roleNames.map(function (r) { return { name: r, color: rc[r] || "var(--s-test)", values: mk(r, "output") }; })) + legend(roleNames.map(function (r) { return [r, rc[r] || "var(--s-test)"]; })), esc(T.note || "Generated tokens only.")) +
      panel("Cache creation + uncached input per day", stackedCols(days, [{ name: "cache creation", color: "var(--info)", values: days.map(function (d) { return T.by_day[d].cache_create || 0; }) }, { name: "input (uncached)", color: "var(--s-test)", values: days.map(function (d) { return T.by_day[d].input || 0; }) }]) + legend([["cache creation", "var(--info)"], ["input", "var(--s-test)"]])) + "</div>";
    h += '<div class="grid-2">' + panel("Cache read per day", stackedCols(days, [{ name: "cache read", color: "var(--s-not)", values: days.map(function (d) { return T.by_day[d].cache_read || 0; }) }]), "Context re-read on every request; cheap relative to output. Shown separately and never added to output.") +
      panel("Composition by role", roleNames.map(function (r) { return "<h3>" + esc(r) + " · " + fmt(R(r).requests) + " responses</h3>" + comp(R(r)); }).join("") + legend([["input", "var(--s-test)"], ["output", "var(--accent)"], ["cache create", "var(--info)"], ["cache read", "var(--s-not)"]]),
        "Parent and child sessions are attributed once: subagent tokens are excluded from the orchestrator total.") + "</div>";
    var tk = Object.keys(T.by_task).filter(function (k) { return k !== "ORCHESTRATOR"; }).map(function (k) { return { label: k, value: T.by_task[k].output || 0, color: k === "UNALLOCATED" ? "var(--s-not)" : "var(--accent)" }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 30);
    var bb = obj(T.by_batch); if (!Object.keys(bb).length) { Object.keys(T.by_task).forEach(function (k) { var t = byId(k), b = t ? t.batch : (k === "ORCHESTRATOR" ? "ORCHESTRATOR" : "UNALLOCATED"); bb[b] = bb[b] || { output: 0 }; bb[b].output += T.by_task[k].output || 0; }); }
    h += '<div class="grid-2">' + panel("Output tokens by task (top 30)", hbars(tk, { lw: 120 }), "UNALLOCATED = runs that cannot be tied to a task; no association is invented.") +
      panel("Output tokens by batch", hbars(Object.keys(bb).map(function (k) { return { label: BATCH_NAME[k] || k, value: bb[k].output || 0, color: k === "UNALLOCATED" ? "var(--s-not)" : k === "ORCHESTRATOR" ? "var(--sun)" : "var(--accent)" }; }).sort(function (a, b) { return b.value - a.value; }), { lw: 170, lc: 26 })) + "</div>";
    var ag = D.agents.slice().sort(function (a, b) { return b.output - a.output; }).slice(0, 25);
    h += panel("Top agent runs by output", table(["Agent", "Description", "Task", "Type", "Day", "#Min", "#Output", "#Cache read"], ag.map(function (a) {
      return '<tr><td class="mono">' + esc(String(a.id).slice(0, 12)) + '</td><td class="clip">' + esc(a.desc) + "</td><td>" + (byId(a.task) ? chipLink(a.task) : esc(a.task)) + "</td><td>" + esc(a.category) + '</td><td class="mono nw">' + esc(a.day) + '</td><td class="num">' + num(a.minutes) + '</td><td class="num">' + fmt(a.output) + '</td><td class="num">' + fmt(a.cache_read) + "</td></tr>"; }), "No agent runs recorded."));
    var bm = T.by_model;
    h += panel("By model", table(["Model", "#Responses", "#Input", "#Output", "#Cache create", "#Cache read"], Object.keys(bm).map(function (k) { var o = bm[k]; return "<tr><td class=\"mono\">" + esc(k) + '</td><td class="num">' + fmt(o.requests) + '</td><td class="num">' + fmt(o.input) + '</td><td class="num">' + fmt(o.output) + '</td><td class="num">' + fmt(o.cache_create) + '</td><td class="num">' + fmt(o.cache_read) + "</td></tr>"; })),
      T.cost && T.cost.by_day_usd ? "Estimated cost basis: " + esc(T.cost.basis || "configured pricing") + ". Total ≈ US$" + esc(Object.keys(T.cost.by_day_usd).reduce(function (a, k) { return a + T.cost.by_day_usd[k]; }, 0).toFixed(2)) + " (ESTIMATED)." : "No monetary estimate: model-specific historical pricing is not configured.");
    $("#v-tokens").innerHTML = h;
  }

  /* ---------- F. Productivity ---------- */
  function productivity() {
    var B = D.benchmarks, P = obj(B.productivity), cats = Object.keys(B.agent_by_category), rr = B.runner || {};
    var pr = function (v) { return v == null ? "–" : (100 * v).toFixed(0) + "%"; };
    var h = '<div class="grid">' + kpi("Rework rate", pr(B.rework_rate), P.rework_tasks != null ? P.rework_tasks + " of " + P.patch_tasks_b1_b2 + " B1/B2 patch tasks" : "B1/B2 patch tasks") +
      kpi("First-pass acceptance", pr(P.first_pass_rate), P.first_pass_tested != null ? P.first_pass_tested + " tasks" : (P.first_pass_rate == null ? "not computed" : "")) +
      kpi("Regression rate", pr(P.regression_rate_u37h), P.regression_rate_u37h == null ? "not computed" : "U37H rounds with failing tests") +
      kpi("Runner rounds", num(rr.rounds), "rollback " + num(rr.rounds_with_rollback) + " · failing tests " + num(rr.tests_fail_rounds)) +
      kpi("Rollback frequency", rr.rounds ? pctTxt(rr.rounds_with_rollback || 0, rr.rounds) : "–", "of runner rounds") +
      kpi("Verify : implement", P.verify_to_impl_ratio == null ? "–" : esc(P.verify_to_impl_ratio) + "×", P.impl_agent_minutes != null ? fmt(P.impl_agent_minutes) + " agent-min vs " + fmt(P.verification_runner_minutes) + " runner-min" : "not computed") + "</div>";
    h += '<div class="grid-2">' + panel("Benchmarks by work type (subagents)", table(["Type", "#n", "#Median min", "#P80 min", "#Median output"], cats.map(function (c) { var b = B.agent_by_category[c]; return "<tr><td>" + esc(c) + '</td><td class="num">' + num(b.n) + '</td><td class="num">' + num(b.median_min) + '</td><td class="num">' + num(b.p80_min) + '</td><td class="num">' + fmt(b.median_output) + "</td></tr>"; })),
      "Wall minutes from first to last message of each run; types kept separate, never mixed into one benchmark.") +
      panel("Unity runner jobs (test / build duration)", hbars(Object.keys(B.runner_jobs).map(function (k) { var j = B.runner_jobs[k]; return { label: k + " (n=" + j.n + ")", value: j.median_min || 0, color: "var(--info)" }; }), { lw: 130, f: function (v) { return v + " min"; } }) +
        table(["Job", "#n", "#Median", "#P80", "#Total min"], Object.keys(B.runner_jobs).map(function (k) { var j = B.runner_jobs[k]; return "<tr><td>" + esc(k) + '</td><td class="num">' + num(j.n) + '</td><td class="num">' + num(j.median_min) + '</td><td class="num">' + num(j.p80_min) + '</td><td class="num">' + num(j.total_min) + "</td></tr>"; }))) + "</div>";
    var rd = B.runner_minutes_by_day, rdk = Object.keys(rd).sort();
    h += '<div class="grid-2">' + panel("Runner utilisation (busy minutes per day)", stackedCols(rdk, [{ name: "runner minutes", color: "var(--info)", values: rdk.map(function (k) { return rd[k]; }) }], { h: 180 }), "One serial Unity instance; 1,440 minutes = fully busy day.");
    var dbd = obj(B.done_by_day), dk = Object.keys(dbd).filter(Boolean).sort();
    h += panel("Tasks reaching TESTED/ACCEPTED per day", dk.length ? stackedCols(dk, [{ name: "tasks", color: "var(--s-acc)", values: dk.map(function (k) { return dbd[k]; }) }], { h: 180 }) : (function () {
      var c = {}; D.tasks.forEach(function (t) { if ((t.status === "TESTED" || t.status === "ACCEPTED") && t.actual_finish) { var k = String(t.actual_finish).slice(0, 10); c[k] = (c[k] || 0) + 1; } }); var ks = Object.keys(c).sort();
      return stackedCols(ks, [{ name: "tasks", color: "var(--s-acc)", values: ks.map(function (k) { return c[k]; }) }], { h: 180 }); })(), "By recorded actual finish date.") + "</div>";
    var dur = D.tasks.filter(function (t) { return t.actual_effort && t.actual_effort.agent_minutes != null; }).map(function (t) { return { label: t.id, value: t.actual_effort.agent_minutes, color: col(t.status) }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 30);
    h += panel("Engineering duration by task (agent minutes)", hbars(dur, { lw: 110, f: function (v) { return fmt(v) + " min"; } }), "Measured agent wall minutes mapped to each task; orchestrator time is not split by task.");
    var rec = D.rounds.slice(-15).reverse();
    h += panel("Recent runner rounds", table(["Round", "Date", "#Min", "Installed", "Rollback", "Tests (last)"], rec.map(function (r) { var tl = r.tests[r.tests.length - 1];
      return '<tr><td class="mono">' + esc(r.round) + '</td><td class="mono nw">' + esc(r.date) + '</td><td class="num">' + num(r.minutes) + '</td><td class="mono">' + esc(r.installed.join(" ") || "–") + '</td><td class="mono">' + esc(r.rollback.join(" ") || "–") + "</td><td>" + (tl ? '<span class="' + (tl.fail ? "var-pos" : "var-neg") + '">' + esc(tl.pass) + " pass / " + esc(tl.fail) + " fail</span>" : "–") + "</td></tr>"; }), "No rounds recorded."));
    $("#v-productivity").innerHTML = h;
  }

  /* ---------- G. Capacity ---------- */
  function capacity() {
    var c = D.capacity, fr = c.disk_free_gb;
    var h = '<div class="grid">' + kpi("Disk free", fr == null ? "–" : esc(fr) + " GB", "warn < " + num(c.warn_gb) + " · build gate ≥ " + num(c.build_gate_gb) + " · hard stop < " + num(c.hard_stop_gb)) +
      kpi("Runner", esc(c.runner_state || "–"), "single serial Unity instance") + kpi("Active agents", num(c.active_agents) + " / " + num(c.agent_cap), "cap per owner decision") +
      kpi("Agent utilisation", c.agent_cap ? pctTxt(c.active_agents || 0, c.agent_cap) : "–", "") +
      kpi("Parallel-ready tasks", c.parallel_tasks.length, "agents") + kpi("Runner-bound tasks", c.serial_tasks.length, "serial queue") + "</div>";
    if (fr != null && c.build_gate_gb) h += panel("Disk against the build gate", '<div class="bar" style="height:14px"><span style="width:' + Math.min(100, 100 * fr / c.build_gate_gb) + "%;background:" + (fr >= c.build_gate_gb ? "var(--good)" : fr >= c.warn_gb ? "var(--warn)" : "var(--crit)") + '"></span></div>', "Full bar = " + esc(c.build_gate_gb) + " GB (heavy Unity builds allowed).");
    var bo = obj(c.by_owner);
    h += '<div class="grid-2">' + panel("Can run in parallel (agents)", '<div class="chips">' + (c.parallel_tasks.map(chipLink).join("") || '<span class="note">none</span>') + "</div>") +
      panel("Needs the serial Unity runner", '<div class="chips">' + (c.serial_tasks.map(chipLink).join("") || '<span class="note">none</span>') + "</div>") + "</div>";
    if (Object.keys(bo).length) h += panel("Open work by owner / agent", hbars(Object.keys(bo).map(function (k) { return { label: k, value: bo[k] }; }).sort(function (a, b) { return b.value - a.value; }), { lw: 110 }));
    if (c.file_conflicts) h += panel("File ownership conflicts", '<p class="note">' + esc(c.file_conflicts) + "</p>");
    $("#v-capacity").innerHTML = h + '<p class="note">Observation only: the dashboard never starts jobs, deletes files or touches the runner.</p>';
  }

  /* ---------- H. Blockers, risks, decisions ---------- */
  var RK = { fstat: "open" };
  function risks() {
    var typ = { TRUE_BLOCKER: "True blockers", REWORK: "Needs rework", DECISION: "Decisions awaiting owner", DELIBERATE_HOLD: "Deliberate holds", WARNING: "Warnings" };
    var cols = { TRUE_BLOCKER: "var(--crit)", REWORK: "var(--s-rew)", DELIBERATE_HOLD: "var(--s-hold)", WARNING: "var(--warn)", DECISION: "var(--info)" };
    var known = Object.keys(typ), other = Array.from(new Set(D.risks.map(function (r) { return r.type; }).filter(function (t) { return known.indexOf(t) < 0; })));
    var h = '<div class="grid">' + known.concat(other).map(function (k) { return kpi(typ[k] || k || "Unclassified", D.risks.filter(function (r) { return r.type === k; }).length, ""); }).join("") + "</div>";
    h += known.concat(other).map(function (k) {
      var rows = D.risks.filter(function (b) { return b.type === k; }); if (!rows.length) return "";
      return panel((typ[k] || k || "Unclassified") + " (" + rows.length + ")", table(["ID", "Item", "Detail", "Severity", "Owner", "Plan", "MS"], rows.map(function (b) {
        var link = byId(b.task_id) ? '<a href="#register" data-task="' + esc(b.task_id) + '" class="mono">' + esc(b.id) + "</a>" : '<span class="mono">' + esc(b.id) + "</span>";
        return '<tr><td style="box-shadow:inset 3px 0 0 ' + (cols[k] || "var(--muted)") + '">' + link + "</td><td>" + esc(b.title) + '</td><td class="clip">' + esc(b.description) + (b.impact ? '<br><span class="note">Impact: ' + esc(b.impact) + "</span>" : "") + "</td><td>" + esc(b.severity || "–") + "</td><td>" + esc(b.owner || "–") + '</td><td class="clip">' + esc(b.plan || "–") + "</td><td>" + esc(b.milestone || "–") + "</td></tr>"; })));
    }).join("");
    var pend = D.decisions.filter(function (d) { return /pend|open|await|propos/i.test(d.status || ""); }), rest = D.decisions.filter(function (d) { return pend.indexOf(d) < 0; }).slice().reverse().slice(0, 40);
    var drow = function (d) { return '<tr><td class="mono">' + esc(d.id) + "</td><td>" + esc(d.topic) + '</td><td class="clip">' + esc(d.text) + "</td><td>" + esc(d.status) + "</td></tr>"; };
    h += panel("Pending owner decisions (" + pend.length + ")", table(["ID", "Topic", "Decision", "Status"], pend.map(drow), "No decision is marked pending."));
    h += panel("Decision register (latest 40 recorded)", table(["ID", "Topic", "Decision", "Status"], rest.map(drow)), "Parsed from the decision register; read-only here.");
    var closed = /VERIFIED|FIXED|CLOSED|DONE|ACCEPTED|DEFERRED|WONTFIX/i;
    var fl = D.findings.filter(function (f) { return RK.fstat === "all" || !closed.test(f.status || ""); });
    var fseg = '<div class="seg" role="group" aria-label="Findings filter"><button type="button" data-fstat="open" aria-pressed="' + (RK.fstat === "open") + '">Open</button><button type="button" data-fstat="all" aria-pressed="' + (RK.fstat === "all") + '">All</button></div>';
    h += panel("Auditor findings (" + fl.length + ")", table(["ID", "Severity", "Category", "Group", "Summary", "Status"], fl.map(function (f) { return '<tr><td class="mono nw">' + esc(f.id) + "</td><td>" + esc(f.severity) + "</td><td>" + esc(f.category) + '</td><td class="mono">' + esc(f.group || f.group_id || "–") + '</td><td class="clip">' + esc(f.summary) + "</td><td>" + esc(f.status) + "</td></tr>"; }), "No findings in this filter."), "Findings are a separate layer from tasks.", fseg);
    $("#v-risks").innerHTML = h;
    $$("[data-fstat]").forEach(function (b) { b.addEventListener("click", function () { RK.fstat = b.getAttribute("data-fstat"); risks(); }); });
  }

  /* ---------- I. Forecast ---------- */
  function forecast() {
    var F = D.forecast, fc = F.per_milestone;
    var rows = Object.keys(fc).map(function (k) { var f = fc[k]; return '<tr><td class="mono">' + esc(k) + '</td><td class="num">' + num(f.tasks) + '</td><td class="num">' + num(f.best_workdays) + '</td><td class="num">' + num(f.p50_workdays) + '</td><td class="num">' + num(f.p80_workdays) +
      '</td><td class="mono nw">' + esc(f.best_date || "–") + '</td><td class="mono nw">' + esc(f.p50_date || "–") + '</td><td class="mono nw">' + esc(f.p80_date || "–") + "</td></tr>"; });
    var cp = D.critical_path;
    var h = panel("Release forecast", table(["Up to", "#Open tasks", "#Best wd", "#P50 wd", "#P80 wd", "Best date", "P50 date", "P80 date"], rows, "No forecast computed."),
      '<span class="chip">' + esc(F.label || "ESTIMATED") + "</span> Monte Carlo over cumulative scope; P80 is the risk-adjusted scenario. wd = working days" + (F.resume_assumption ? " from " + esc(F.resume_assumption) : "") + ". Never a guaranteed date.");
    h += panel("Critical path (remaining work, P50)", '<div class="chips">' + (cp.path.map(chipLink).join(" → ") || '<span class="note">none</span>') + "</div>",
      cp.days_p50 != null ? "Longest dependency chain over open tasks: " + esc(cp.days_p50) + " working days of task time (before gates and runner queue)." : "");
    var mi = obj(F.measured_inputs);
    if (Object.keys(mi).length) h += panel("Measured inputs", '<dl class="kv">' + Object.keys(mi).map(function (k) { return "<dt>" + esc(k) + "</dt><dd class=\"num\">" + esc(mi[k] == null ? "–" : mi[k]) + "</dd>"; }).join("") + "</dl>");
    h += panel("Assumptions", "<ul>" + F.assumptions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>");
    $("#v-forecast").innerHTML = h;
  }

  /* ---------- sources + sync ---------- */
  function sources() {
    var li = obj(D.meta.last_ingestion), src = arr(D.meta.sources), iss = D.issues;
    var h = panel("Data freshness", '<dl class="kv"><dt>Dashboard computed</dt><dd class="mono">' + esc(D.meta.generated_at || "–") + '</dd><dt>Last successful sync</dt><dd class="mono">' + esc(li.finished_at || li.at || li.started_at || "–") + "</dd>" +
      (li.summary ? "<dt>Summary</dt><dd>" + esc(typeof li.summary === "string" ? li.summary : JSON.stringify(li.summary)) + "</dd>" : "") + "<dt>Scope</dt><dd>" + esc(D.meta.scope || "–") + "</dd></dl>" +
      '<div class="row-actions"><button class="btn" type="button" id="run-sync">Sync from project records</button></div><div id="sync-msg"></div>',
      "Sync re-reads trackers, logs and runner reports. It never modifies the source trackers, and manually edited fields are kept.");
    h += panel("Data sources", src.length ? "<ul>" + src.map(function (s) { return "<li>" + esc(typeof s === "string" ? s : (s.path || s.name || "") + (s.what ? " — " + s.what : "")) + "</li>"; }).join("") + "</ul>" : '<p class="note">Source list not provided by the server.</p>');
    var imp = arr(D.imports);
    if (imp.length) h += panel("Recent imports / syncs", table(["#", "At", "Kind", "Result"], imp.map(function (i) { return '<tr><td class="mono">' + esc(i.seq) + '</td><td class="mono nw">' + esc(String(i.at || i.started_at || "").slice(0, 16)) + "</td><td>" + esc(i.kind || i.source || "") + '</td><td class="clip">' + esc(i.summary || i.result || (i.ok === 0 ? "failed" : "ok")) + "</td></tr>"; })));
    h += panel("Reconciliation issues (" + iss.length + ")", iss.length ? table(["Type", "ID", "Detail"], iss.map(function (i) { return "<tr><td>" + esc(i.type) + '</td><td class="mono">' + esc(i.id) + '</td><td class="clip">' + esc(i.detail) + "</td></tr>"; })) : '<p class="note">No duplicate IDs, unknown dependencies or status conflicts in this build.</p>');
    h += panel("Status definitions", '<dl class="kv">' + [["NOT_STARTED", "No work recorded."], ["READY", "Dependencies met; can start."], ["IN_PROGRESS", "Work under way."], ["IMPLEMENTED", "Code or document change complete."], ["TESTED", "Required technical tests passed."], ["ACCEPTED", "Acceptance criteria and required reviews passed (owner/Auditor)."],
      ["BLOCKED", "Cannot proceed: external dependency."], ["ON_HOLD", "Paused by project decision."], ["DEFERRED", "Moved to a later phase."], ["CANCELLED", "Dropped; excluded from percentages."], ["REJECTED", "Failed review."], ["NEEDS_REWORK", "Corrective implementation required."]].map(function (d) { return "<dt>" + stTag(d[0]) + "</dt><dd>" + esc(d[1]) + "</dd>"; }).join("") + "</dl>");
    $("#v-sources").innerHTML = h;
    $("#run-sync").addEventListener("click", function (ev) {
      var b = ev.target, m = $("#sync-msg"); b.disabled = true; m.innerHTML = '<p class="note">Sync running… this can take a minute.</p>';
      api("POST", "/api/ingest", {}).then(function (r) { m.innerHTML = '<div class="ok">Sync finished.' + (r && (r.summary || r.message) ? " " + esc(typeof (r.summary || r.message) === "string" ? (r.summary || r.message) : JSON.stringify(r.summary)) : "") + "</div>"; return loadDashboard(); })
        .catch(function (err) { if (err && err.status === 401) return onApiError(err); m.innerHTML = '<div class="err">Sync failed. ' + esc(err && err.message) + "</div>"; })
        .then(function () { var bb = $("#run-sync"); if (bb) bb.disabled = false; });
    });
  }

  /* ---------- routing ---------- */
  var R = { overview: overview, register: register, timeline: timeline, milestones: milestones, tokens: tokens, productivity: productivity, capacity: capacity, risks: risks, forecast: forecast, sources: sources };
  function route() {
    if (!D) return;
    var v = (location.hash || "#overview").slice(1); if (v === "engineering") v = "tokens"; if (VIEWS.indexOf(v) < 0) v = "overview";
    $("#v-auth").hidden = true;
    VIEWS.forEach(function (k) { $("#v-" + k).hidden = k !== v; });
    $$(".tabs a").forEach(function (a) { if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    try { R[v](); } catch (e) { $("#v-" + v).innerHTML = '<div class="panel"><b>This view failed to render.</b><span class="note">' + esc(e && e.message) + "</span></div>"; if (window.console) console.error(e); }
  }
  window.addEventListener("hashchange", route);

  /* ---------- auth screens ---------- */
  function authShell(title, sub, fields, btn) {
    VIEWS.forEach(function (k) { $("#v-" + k).hidden = true; }); $("#tabs").hidden = true; $("#logout").hidden = true; $("#reload").hidden = true; $("#health").hidden = true; $("#fresh").textContent = "";
    var a = $("#v-auth"); a.hidden = false;
    a.innerHTML = '<div class="panel auth"><h2>' + esc(title) + '</h2><p class="note">' + sub + '</p><form id="auth-form" class="form">' + fields + '<div id="auth-msg"></div><button class="btn" type="submit">' + esc(btn) + "</button></form></div>";
    return $("#auth-form");
  }
  function showLogin(msg) {
    D = null;
    var f = authShell("Sign in", (window.RMCT_PUBLIC ? "Viewing is open. Sign in only to create or edit tasks." : "Private project dashboard. Access is limited to the project owner."), '<label>Username<input name="username" autocomplete="username" autocapitalize="none" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label>', "Sign in");
    if (msg) $("#auth-msg").innerHTML = (msg === "Signed out." ? '<div class="ok">' : '<div class="err">') + esc(msg) + "</div>";
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); var b = f.querySelector("button"), m = $("#auth-msg"), u = f.username.value.trim(), p = f.password.value;
      if (!u || !p) { m.innerHTML = '<div class="err">Enter username and password.</div>'; return; }
      b.disabled = true; m.innerHTML = '<p class="note">Signing in…</p>';
      api("POST", "/api/login", { username: u, password: p }).then(function () { return boot(); })
        .catch(function (e) { b.disabled = false; m.innerHTML = '<div class="err">' + esc(e.status === 401 || e.status === 403 ? "Wrong username or password." : e.status === 429 ? "Too many attempts. Wait a few minutes and try again." : "Sign-in failed. " + e.message) + "</div>"; });
    });
    var u = f.querySelector('[name="username"]'); if (u && u.focus) u.focus();
  }
  function showSetup(token) {
    var f = authShell("First-run setup", "Create the owner account. This link works once and expires.", '<label>Username<input name="username" autocomplete="username" autocapitalize="none" required minlength="3"></label><label>Password (min. 12 characters)<input name="password" type="password" autocomplete="new-password" required minlength="12"></label><label>Repeat password<input name="password2" type="password" autocomplete="new-password" required></label>', "Create account");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); var b = f.querySelector("button"), m = $("#auth-msg"), u = f.username.value.trim(), p = f.password.value, p2 = f.password2.value;
      var errs = []; if (u.length < 3) errs.push("Username needs at least 3 characters."); if (p.length < 12) errs.push("Password needs at least 12 characters."); if (p !== p2) errs.push("Passwords do not match.");
      if (errs.length) { m.innerHTML = '<div class="err">' + errs.map(esc).join("<br>") + "</div>"; return; }
      b.disabled = true; m.innerHTML = '<p class="note">Creating account…</p>';
      api("POST", "/api/setup", { token: token, username: u, password: p }).then(function () {
        try { history.replaceState(null, "", location.pathname + (location.hash || "")); } catch (e) { /* ignore */ }
        return api("POST", "/api/login", { username: u, password: p }).then(function () { return boot(); }, function () { showLogin(); });
      }).catch(function (e) { b.disabled = false; m.innerHTML = '<div class="err">' + esc(e.status === 400 || e.status === 403 || e.status === 410 ? "Setup refused: " + e.message + ". The link may be used or expired." : "Setup failed. " + e.message) + "</div>"; });
    });
  }
  function showFatal(msg) {
    VIEWS.forEach(function (k) { $("#v-" + k).hidden = true; }); var a = $("#v-auth"); a.hidden = false;
    a.innerHTML = '<div class="panel auth"><h2>Cannot reach the dashboard</h2><div class="err">' + esc(msg) + '</div><p class="note">No figures are shown until live data loads.</p><div class="row-actions"><button class="btn" type="button" id="retry">Retry</button></div></div>';
    $("#retry").addEventListener("click", boot);
  }

  /* ---------- data load ---------- */
  function loadDashboard() {
    $("#fresh").textContent = "loading…";
    return api("GET", "/api/dashboard").then(function (d) {
      if (!d || !Array.isArray(d.tasks)) throw new Error("dashboard payload has no task list");
      D = normalize(d); IDX = {}; D.tasks.forEach(function (t) { IDX[t.id] = t; });
      var li = obj(D.meta.last_ingestion), ts = li.finished_at || li.at || D.meta.generated_at || "";
      $("#fresh").textContent = ts ? "synced " + String(ts).replace("T", " ").slice(0, 16) + " UTC" : "sync time unknown";
      var hp = $("#health"); hp.outerHTML = healthPill(); $("#health").hidden = false;
      $("#tabs").hidden = false; $("#reload").hidden = false; $("#logout").hidden = false;
      $("#logout").textContent = ME && ME.username ? "Sign out" : "Sign in to edit";
      route();
    }).catch(function (e) { if (e && e.status === 401) { showLogin(); return; } D = null; showFatal("Dashboard data could not be loaded: " + (e && e.message)); });
  }
  function boot() {
    var m = /[?&]setup=([^&#]+)/.exec(location.search || "");
    if (m) { showSetup(decodeURIComponent(m[1])); return Promise.resolve(); }
    return api("GET", "/api/me").then(function (me) { ME = me || {}; window.RMCT_PUBLIC = !!ME.public_read; return loadDashboard(); })
      .catch(function (e) { if (e && e.status === 401) showLogin(); else showFatal("Server not reachable: " + (e && e.message)); });
  }
  $("#reload").addEventListener("click", function () { loadDashboard(); });
  $("#logout").addEventListener("click", function () {
    if (!(ME && ME.username)) { showLogin(); return; }
    api("POST", "/api/logout", {}).catch(function () { return null; }).then(function () { ME = null; if (window.RMCT_PUBLIC) { boot(); } else { showLogin("Signed out."); } });
  });

  window.RMCT = { tl: TL, normalize: normalize, setData: function (d) { D = normalize(d); IDX = {}; D.tasks.forEach(function (t) { IDX[t.id] = t; }); }, views: R, openTask: openTask, openForm: openForm, route: route, showLogin: showLogin, showSetup: showSetup };
  if (!window.RMCT_NO_BOOT) boot();
})();
