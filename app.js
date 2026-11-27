/* Renewable Manager Command Center — vanilla client. Reads data/dashboard.json (static GitHub Pages mode) or
   /api/dashboard (VPS server mode). Contract: docs/DATA_CONTRACT.md (v3: pm + forecast); v1 keys are a labelled fallback.
   Anything not recorded renders as NOT_RECORDED — this file never invents values or dates. */
(function (root) {
  "use strict";
  var NR = "NOT_RECORDED";

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function obj(o) { return o && typeof o === "object" && !Array.isArray(o) ? o : {}; }
  function arr(a) { return Array.isArray(a) ? a : []; }
  function has(o, k) { return o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k); }
  function isNR(v) { return v == null || v === "" || v === NR || v === "UNKNOWN"; }
  function nr(v) { return '<span class="nr">' + esc(v === "UNKNOWN" ? "UNKNOWN" : NR) + "</span>"; }
  function val(v, fmt) { return isNR(v) ? nr(v) : esc(fmt ? fmt(v) : v); }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }
  function int(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  function compact(n) { n = Number(n); if (!isFinite(n)) return ""; var a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toFixed(1) + "B" : a >= 1e6 ? (n / 1e6).toFixed(1) + "M" : a >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n)); }
  function pct(n) { return n == null ? null : Math.round(n * 10) / 10; }
  function ts(s) { if (isNR(s)) return null; var d = new Date(/^\d{4}-\d\d-\d\d$/.test(s) ? s + "T00:00:00Z" : s); return isNaN(d) ? null : d.getTime(); }
  function fmtDate(s) { var t = ts(s); if (t == null) return null; var d = new Date(t); return d.getUTCDate() + " " + "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function fmtDT(s) { var t = ts(s); if (t == null) return null; var d = new Date(t); if (/^\d{4}-\d\d-\d\d$/.test(s)) return fmtDate(s); function p(n) { return n < 10 ? "0" + n : "" + n; } return fmtDate(s) + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + " UTC"; }
  function ago(s, now) { var t = ts(s); if (t == null) return ""; var m = Math.round((now - t) / 6e4); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; var h = Math.round(m / 60); if (h < 48) return h + " h ago"; return Math.round(h / 24) + " d ago"; }
  function dateCell(s) { var f = fmtDT(s); return f ? esc(f) : nr(s); }

  var COLORS = { NOT_STARTED: "#9aa3cf", READY: "#7cc4ff", IN_PROGRESS: "#6aa8ff", IMPLEMENTED: "#a58bff", TESTED: "#b195ff", ACCEPTED: "#2fd3c3",
    VISUALLY_ACCEPTED: "#2fd3c3", DONE: "#5fe39a", BLOCKED: "#ff6b78", ON_HOLD: "#ffb454", DEFERRED: "#d9b3ff", CANCELLED: "#8f96bb", REJECTED: "#ff8fa0",
    NEEDS_REWORK: "#ff9f5a", NEEDS_RECHECK: "#ffb454", NOT_TESTED: "#9aa3cf", FAIL: "#ff6b78", PASS: "#5fe39a", OK: "#5fe39a", OPEN: "#ff6b78", RESOLVED: "#5fe39a",
    P0: "#ff6b78", P1: "#ffb454", P2: "#f6c85a", P3: "#9aa3cf", FRESH: "#5fe39a", STALE: "#ffb454", FAILED: "#ff6b78", RED: "#ff6b78", AMBER: "#ffb454", GREEN: "#5fe39a", PAUSED: "#ffb454",
    PARTIAL: "#ffb454", UNVERIFIED: "#ff9f5a", CONFIRMED: "#5fe39a", RECORDED: "#7cc4ff", NOT_CONNECTED: "#9aa3cf", "N/A": "#8f96bb",
    QA_PASS: "#b195ff", DIRECTOR_ACCEPTED: "#2fd3c3", HOLD: "#ffb454", PLANNED: "#9aa3cf", REWORK: "#ff9f5a", WAITING: "#ffb454", FUTURE: "#9aa3cf", INSUFFICIENT_DATA: "#ffb454", PROVISIONAL: "#ffb454",
    VALIDATED: "#5fe39a", INVALID: "#ff6b78", HELD: "#ffb454", FREE: "#5fe39a", UNQUALIFIED: "#ffb454", PASS_WITH_WARNINGS: "#ffb454", LAUNCH: "#7cc4ff", UNKNOWN: "#9aa3cf",
    APPROVED: "#2fd3c3", PROPOSED: "#7cc4ff", NOT_AVAILABLE: "#9aa3cf", NOT_COMPUTED: "#9aa3cf", NEXT_MILESTONE: "#f6c85a", VALIDATION_FAILED: "#ff6b78", SOURCE_MISMATCH: "#ff6b78", RECONCILIATION_FAILED: "#ff6b78", SYNC_FAILED: "#ff6b78",
    TECHNICALLY_READY_PENDING_ACCEPTANCE: "#b195ff", NOT_TECHNICALLY_READY: "#9aa3cf", OWNER_ACCEPTANCE: "#2fd3c3", AUDITOR_ACCEPTANCE: "#7cc4ff", MISSING_EVIDENCE: "#ffb454", DEPENDENCY: "#ff9f5a" };
  function col(s) { return COLORS[String(s || "").toUpperCase().replace(/ /g, "_")] || "#b3badf"; }
  function label(s) { return String(s).replace(/_/g, " "); }
  function tag(s) { return isNR(s) ? nr(s) : '<span class="tag" style="color:' + col(s) + '">' + esc(label(s)) + "</span>"; }
  function sw(c) { return '<i class="sw" style="background:' + c + '"></i>'; }

  /* ---------- doc links ---------- */
  function docPathOf(o) { o = obj(o); if (!isNR(o.doc)) return String(o.doc); var s = o.source; if (typeof s === "string" && /\.md(:\d+)?$/.test(s)) return s; return null; }
  function docBtn(p, text) {
    if (!p) return '<button class="doclink" type="button" disabled title="No doc recorded for this item">Doc ' + esc(NR) + "</button>";
    return '<button class="doclink" type="button" data-doc="' + esc(p) + '">' + esc(text || "Open doc") + "</button>";
  }
  function resolveDoc(D, p) {
    p = String(p).replace(/:\d+$/, "");
    var files = arr(obj(D && D.docs).files), f = files.filter(function (x) { return x && (x.path === p || x.public_path === p); })[0];
    if (f && f.public_path) return { url: f.public_path, title: f.title || p, indexed: true };
    var url = /^docs\//.test(p) ? p : "docs/" + p; if (!/\.md$/.test(url)) url += ".md";
    return { url: url, title: p, indexed: false };
  }

  /* ---------- safe Markdown renderer (escape first, then a fixed set of constructs) ---------- */
  function joinPath(base, rel) {
    var parts = (base ? base.split("/").slice(0, -1) : []).concat(rel.split("/")), out = [];
    parts.forEach(function (x) { if (x === "..") out.pop(); else if (x && x !== ".") out.push(x); });
    return out.join("/");
  }
  function inl(t, base) {
    var codes = [];
    var s = esc(t).replace(/`([^`]+)`/g, function (_, c) { codes.push("<code>" + c + "</code>"); return "\u0000" + (codes.length - 1) + "\u0000"; });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, function (_, a) { return "[image: " + a + "]"; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g, function (_, txt, url) {
      var raw = url.replace(/&amp;/g, "&");
      if (/^\s*(javascript|data|vbscript|file):/i.test(raw)) return txt;
      if (/^https?:\/\//i.test(raw)) return '<a href="' + esc(raw) + '" target="_blank" rel="noopener noreferrer">' + txt + "</a>";
      if (/^#/.test(raw)) return txt;
      var m = /^([^#?]+\.md)(#.*)?$/.exec(raw);
      if (m) return '<a href="#" data-doc="' + esc(joinPath(base, m[1])) + '">' + txt + "</a>";
      return txt + ' <span class="dim">(' + esc(raw) + ")</span>";
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, "$1<em>$2</em>").replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, "$1<em>$2</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>");
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
  }
  function splitRow(l) { l = l.trim().replace(/^\|/, "").replace(/\|$/, ""); var cells = [], cur = ""; for (var i = 0; i < l.length; i++) { if (l[i] === "\\" && l[i + 1] === "|") { cur += "|"; i++; } else if (l[i] === "|") { cells.push(cur.trim()); cur = ""; } else cur += l[i]; } cells.push(cur.trim()); return cells; }
  function md(src, base) {
    var L = String(src || "").replace(/\r\n?/g, "\n").split("\n"), out = [], i = 0;
    function isBlock(l) { return /^\s*```/.test(l) || /^#{1,6}\s/.test(l) || /^\s*>/.test(l) || /^\s*([-*+]|\d+[.)])\s+/.test(l) || /^\s*\|/.test(l) || /^\s*([-*_])(\s*\1){2,}\s*$/.test(l); }
    while (i < L.length) {
      var l = L[i], m;
      if (/^\s*$/.test(l)) { i++; continue; }
      if (/^\s*```/.test(l)) { var b = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) b.push(L[i++]); i++; out.push("<pre><code>" + esc(b.join("\n")) + "</code></pre>"); continue; }
      if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { var n = m[1].length; out.push("<h" + n + ">" + inl(m[2].replace(/\s+#+\s*$/, ""), base) + "</h" + n + ">"); i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < L.length && /^\s*\|?\s*:?-{2,}/.test(L[i + 1])) {
        var head = splitRow(l), rows = []; i += 2;
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push(splitRow(L[i++]));
        out.push('<div class="tw"><table><thead><tr>' + head.map(function (c) { return "<th>" + inl(c, base) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inl(c, base) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>");
        continue;
      }
      if (/^\s*>/.test(l)) { var q = []; while (i < L.length && /^\s*>/.test(L[i])) q.push(L[i++].replace(/^\s*>\s?/, "")); out.push("<blockquote>" + md(q.join("\n"), base) + "</blockquote>"); continue; }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        var stack = [], html = "";
        while (i < L.length && (m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(L[i]))) {
          var ind = m[1].replace(/\t/g, "  ").length, type = /\d/.test(m[2]) ? "ol" : "ul", text = m[3]; i++;
          while (i < L.length && /^\s{2,}\S/.test(L[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(L[i])) text += " " + L[i++].trim();
          while (stack.length && ind < stack[stack.length - 1].ind) { html += "</li></" + stack.pop().type + ">"; }
          if (!stack.length || ind > stack[stack.length - 1].ind) { stack.push({ ind: ind, type: type }); html += "<" + type + "><li>"; }
          else html += "</li><li>";
          html += inl(text.replace(/^\[( |x|X)\]\s+/, function (_, c) { return c === " " ? "☐ " : "☑ "; }), base);
        }
        while (stack.length) html += "</li></" + stack.pop().type + ">";
        out.push(html); continue;
      }
      var p = []; while (i < L.length && !/^\s*$/.test(L[i]) && !(p.length && isBlock(L[i]))) p.push(L[i++].trim());
      out.push("<p>" + inl(p.join(" "), base) + "</p>");
    }
    return out.join("\n");
  }

  /* ---------- model (v2 first, v1 fallback, never invented) ---------- */
  var DELIVERY = ["IMPLEMENTED", "TESTED", "ACCEPTED"], FLOW = ["IN_PROGRESS", "READY", "NOT_STARTED"], STOP = ["BLOCKED", "ON_HOLD", "NEEDS_REWORK", "DEFERRED", "REJECTED", "CANCELLED"];
  function statuses(D) { var s = arr(obj(D.meta).statuses); return s.length ? s : DELIVERY.concat(FLOW, STOP); }
  function counts(D) {
    var sc = obj(D.status_count), tasks = arr(D.tasks), c = {};
    statuses(D).forEach(function (s) { c[s] = has(sc, s) ? sc[s] : 0; });
    Object.keys(sc).forEach(function (s) { c[s] = sc[s]; });
    var vis = tasks.some(function (t) { return has(t, "visual"); }), done = tasks.some(function (t) { return has(t, "done"); });
    c.VISUALLY_ACCEPTED = vis ? tasks.filter(function (t) { return t.visual === "VISUALLY_ACCEPTED"; }).length : NR;
    c.DONE = done ? tasks.filter(function (t) { return t.done === true; }).length : NR;
    return c;
  }
  function denom(D, c) {
    var d = obj(obj(D.meta).denominator);
    if (num(d.tasks_total) != null) return { n: d.tasks_total, rule: d.rule || NR, v2: true };
    var all = Object.keys(obj(D.status_count)).reduce(function (a, k) { return a + (num(D.status_count[k]) || 0); }, 0);
    return { n: all - (num(c.CANCELLED) || 0), rule: "all tasks − CANCELLED (v1 formula: meta.formulas)", v2: false };
  }
  function syncInfo(D, now, fetchErr) {
    var m = obj(D.meta), s = m.sync, r = { v2: false, problems: [] };
    if (s && typeof s === "object") {
      r.v2 = true; r.state = s.state || "UNKNOWN"; r.last_success = s.last_success; r.last_attempt = s.last_attempt; r.trigger = s.trigger; r.error = s.error;
      r.stale_after_min = s.stale_after_min; r.consistency = s.consistency; r.sources = arr(s.sources);
      var t = ts(s.last_success), lim = num(s.stale_after_min);
      if (r.state === "FRESH" && t != null && lim != null && now - t > lim * 6e4) { r.state = "STALE"; r.problems.push("Last successful sync is older than " + lim + " min (checked in this browser)."); }
      var cs = obj(s.consistency);
      if (cs.ok === false) { if (r.state === "FRESH") r.state = "STALE"; arr(cs.problems).forEach(function (p) { r.problems.push("Consistency: " + p); }); }
    } else {
      var li = obj(m.last_ingestion); r.state = NR; r.last_success = li.ok ? li.finished_at : null; r.last_attempt = li.finished_at || m.generated_at; r.trigger = li.trigger; r.error = li.ok === 0 ? li.message : null;
    }
    if (fetchErr) { r.state = "FAILED"; r.problems.unshift("This page could not refresh the dashboard data: " + fetchErr + ". Showing the last data it loaded."); }
    return r;
  }
  function workstreams(D) {
    if (Array.isArray(D.workstreams)) return { v2: true, list: D.workstreams };
    var by = {}, order = [];
    arr(D.tasks).forEach(function (t) { var w = t.workstream || NR; if (!by[w]) { by[w] = { id: w, name: w, tasks: [], counts: {}, blockers: [], dependencies: [], recent: [], latest_evidence: [], doc: null }; order.push(w); } var x = by[w]; x.tasks.push(t.id); x.counts[t.status] = (x.counts[t.status] || 0) + 1; if (t.status === "BLOCKED") x.blockers.push(t.id); });
    order.forEach(function (w) { var x = by[w], c = x.counts, tot = x.tasks.length - (c.CANCELLED || 0); function p(n) { return tot ? Math.round(1000 * n / tot) / 10 : null; }
      x.pct_implemented = p((c.IMPLEMENTED || 0) + (c.TESTED || 0) + (c.ACCEPTED || 0)); x.pct_tested = p((c.TESTED || 0) + (c.ACCEPTED || 0)); x.pct_accepted = p(c.ACCEPTED || 0); });
    return { v2: false, list: order.map(function (w) { return by[w]; }) };
  }
  function blockers(D) {
    if (Array.isArray(D.blockers)) return { v2: true, list: D.blockers };
    return { v2: false, list: arr(D.risks).map(function (r) { return { id: r.id, priority: NR, title: r.title + (r.description ? " — " + r.description : ""), workstream: NR, dependencies: [], owner: r.owner || NR,
      identified: r.identified_at, status: r.status, active: r.status !== "RESOLVED", resolved: NR, next_action: r.plan || NR, doc: docPathOf(r) || docPathOf(arr(D.tasks).filter(function (t) { return t.id === r.task_id; })[0]), type: r.type, severity: r.severity, task: r.task_id }; }) };
  }
  function isActiveWs(w) { var c = obj(w.counts); return (c.IN_PROGRESS || 0) > 0; }
  function prioRank(p) { var m = /^P(\d)$/.exec(p || ""); return m ? +m[1] : 9; }
  function critical(D) { var b = blockers(D); return b.list.filter(function (x) { return x.active !== false && (x.priority === "P0" || (!b.v2 && x.type === "TRUE_BLOCKER")); }); }

  /* ---------- shared widgets ---------- */
  function stackBar(c, keys, h) {
    var tot = keys.reduce(function (a, k) { return a + (num(c[k]) || 0); }, 0);
    if (!tot) return '<div class="bar"' + (h ? ' style="height:' + h + 'px"' : "") + "></div>";
    return '<div class="bar" role="img" aria-label="' + esc(keys.filter(function (k) { return c[k]; }).map(function (k) { return label(k) + " " + c[k]; }).join(", ")) + '"' + (h ? ' style="height:' + h + 'px"' : "") + ">" +
      keys.map(function (k) { var n = num(c[k]) || 0; return n ? '<i style="width:' + (100 * n / tot) + "%;background:" + col(k) + '"></i>' : ""; }).join("") + "</div>";
  }
  function legend(c, keys) { return '<div class="legend">' + keys.filter(function (k) { return num(c[k]); }).map(function (k) { return "<span>" + sw(col(k)) + esc(label(k)) + " " + c[k] + "</span>"; }).join("") + "</div>"; }
  function progRow(name, p, color, sub) {
    return '<div class="prog-row"><span>' + esc(name) + (sub ? ' <span class="dim small">' + esc(sub) + "</span>" : "") + "</span><b>" + (p == null || isNR(p) ? nr(p) : esc(p + "%")) + "</b>" +
      '<div class="bar"><i style="width:' + (num(p) || 0) + "%;background:" + color + '"></i></div></div>';
  }
  function kpi(v, l, s, color) { var txt = typeof v === "string" && !/^[\d.,%\s+-]+$/.test(v) && v.length > 8; if (txt && !isNR(v)) v = label(v); return '<div class="kpi"><div class="v' + (txt ? " txt" : "") + '"' + (color ? ' style="color:' + color + '"' : "") + ">" + (isNR(v) ? nr(v) : esc(v)) + '</div><div class="l">' + esc(l) + "</div>" + (s ? '<div class="s">' + s + "</div>" : "") + "</div>"; }
  function card(key, title, body, opts) { opts = opts || {}; return { key: key, html: '<section class="card ' + (opts.cls || "") + '" data-key="' + esc(key) + '"><div class="card-head"><h2>' + esc(title) + "</h2>" + (opts.right || "") + "</div>" + body + "</section>" }; }
  function fallbackNote(what) { return '<p class="note">v2 key <span class="mono">' + esc(what) + "</span> " + nr() + " — showing the v1 record instead (labelled).</p>"; }
  function list(items, fn, empty) { items = arr(items); return items.length ? '<ul class="list">' + items.map(fn).join("") + "</ul>" : '<p class="empty">' + (empty || "None recorded.") + "</p>"; }
  function paths(p) { p = arr(p); return p.length ? p.map(function (x) { return '<span class="mono">' + esc(x) + "</span>"; }).join("<br>") : nr(); }

  /* ---------- A: executive overview ---------- */
  function vOverview(D, now, ctx) {
    var c = counts(D), dn = denom(D, c), sy = syncInfo(D, now, ctx.fetchErr), ws = workstreams(D), crit = critical(D), out = [];
    var all = statuses(D), keys = ["ACCEPTED", "TESTED", "IMPLEMENTED", "IN_PROGRESS", "READY", "NOT_STARTED", "NEEDS_REWORK", "BLOCKED", "ON_HOLD", "DEFERRED", "REJECTED", "CANCELLED"].filter(function (k) { return all.indexOf(k) >= 0 || num(c[k]); });
    function n(k) { return num(c[k]) || 0; }
    var impl = n("IMPLEMENTED") + n("TESTED") + n("ACCEPTED"), tested = n("TESTED") + n("ACCEPTED");
    function p(x) { return dn.n > 0 ? pct(100 * x / dn.n) : null; }
    var ms = arr(D.milestones), next = ms.filter(function (m) { return !m.complete; })[0];
    var phase = !isNR(obj(D.meta).phase) ? obj(D.meta).phase : null;
    out.push(card("ov-head", "Mission status",
      '<div class="kpis six">' +
      kpi(num(c.DONE) != null ? c.DONE : NR, "Done", "accepted + visual ok", col("DONE")) +
      kpi(n("ACCEPTED"), "Accepted", "", col("ACCEPTED")) +
      kpi(c.VISUALLY_ACCEPTED, "Visually accepted", "", col("VISUALLY_ACCEPTED")) +
      kpi(n("TESTED"), "Tested", "", col("TESTED")) +
      kpi(n("IMPLEMENTED"), "Implemented", "", col("IMPLEMENTED")) +
      kpi(n("IN_PROGRESS"), "In progress", "", col("IN_PROGRESS")) +
      kpi(n("BLOCKED"), "Blocked", "", col("BLOCKED")) +
      kpi(n("ON_HOLD"), "On hold", "", col("ON_HOLD")) +
      kpi(n("NOT_STARTED"), "Not started", "", col("NOT_STARTED")) +
      kpi(ws.list.filter(isActiveWs).length, "Active workstreams", ws.v2 ? "" : "derived from tasks (v1)", "#b195ff") +
      kpi(crit.length, "Critical blockers", blockers(D).v2 ? "active P0" : "open TRUE_BLOCKER (v1)", "#ff6b78") +
      kpi(dn.n, "Tasks in scope", esc(dn.v2 ? "meta.denominator" : "v1 denominator")) +
      "</div>" +
      '<div style="margin-top:14px">' + stackBar(c, keys, 14) + legend(c, keys) + "</div>" +
      '<div class="note">Other statuses: ' + ["READY", "NEEDS_REWORK", "DEFERRED", "REJECTED", "CANCELLED"].map(function (k) { return esc(label(k)) + " " + n(k); }).join(" · ") + "</div>"));
    out.push(card("ov-progress", "Delivery progress",
      '<div class="prog">' + progRow("Implemented or better", p(impl), col("IMPLEMENTED")) + progRow("Tested or better", p(tested), col("TESTED")) +
      progRow("Accepted", p(n("ACCEPTED")), col("ACCEPTED")) + progRow("Done (accepted + visual)", num(c.DONE) != null ? p(c.DONE) : NR, col("DONE")) + "</div>" +
      '<p class="note">Denominator ' + esc(dn.n) + " · rule: " + esc(dn.rule) + "</p>"));
    out.push(card("ov-phase", "Current phase",
      '<div class="prog">' + (phase ? "<div><b>" + esc(phase) + "</b></div>" : '<div>Phase ' + nr() + ' <span class="dim small">(meta.phase)</span></div>') +
      '<div class="small muted">Scope: ' + val(obj(D.meta).scope) + "</div>" +
      (next ? '<div><span class="tag" style="color:#f6c85a">NEXT MILESTONE</span> <b>' + esc(next.id) + "</b> " + esc(next.name) + '</div><div class="small muted">Baseline ' + dateCell(next.baseline || next.planned_p50) + " · " + esc(next.pct_accepted != null ? next.pct_accepted + "% accepted" : "") + "</div>" : '<div class="empty">No open milestone recorded.</div>') +
      '<div class="row">Health ' + tag(obj(D.health).value) + "</div></div>", { right: docBtn(next && docPathOf(next), "Milestone doc") }));
    out.push(card("ov-sync", "Data sync",
      '<div class="prog"><div class="row">State ' + tag(sy.state) + (sy.v2 ? "" : ' <span class="dim small">meta.sync not published yet (v1 data)</span>') + "</div>" +
      '<div class="small">Last success: ' + dateCell(sy.last_success) + ' <span class="dim">' + esc(ago(sy.last_success, now)) + "</span></div>" +
      '<div class="small">Last attempt: ' + dateCell(sy.last_attempt) + " · trigger " + val(sy.trigger) + "</div>" +
      (sy.v2 ? '<div class="small">Stale after: ' + val(sy.stale_after_min, function (x) { return x + " min"; }) + " · consistency " + (obj(sy.consistency).ok === true ? tag("OK") : obj(sy.consistency).ok === false ? tag("FAIL") : nr()) + "</div>" : "") +
      (sy.error ? '<div class="small t-red">Error: ' + esc(sy.error) + "</div>" : "") +
      '<div class="small dim">Page fetched ' + esc(ctx.fetchedAt ? fmtDT(new Date(ctx.fetchedAt).toISOString()) : "—") + " · auto refresh every 60 s</div></div>"));
    var cb = crit.slice().sort(function (a, b) { return prioRank(a.priority) - prioRank(b.priority); });
    out.push(card("ov-crit", "Critical blockers", list(cb, function (b) { return "<li><div class=\"row sb\"><span class=\"row\">" + tag(b.priority) + " <b>" + esc(b.id) + "</b></span>" + docBtn(docPathOf(b)) + "</div><div>" + esc(b.title) + '</div><div class="small muted">Next: ' + val(b.next_action) + "</div></li>"; }, "No critical blocker recorded."), { cls: cb.length ? "crit" : "" }));
    return { title: "Executive overview", sub: esc(obj(D.meta).scope || ""), cards: out, grid: "grid two" };
  }

  /* ---------- B: workstreams ---------- */
  function vWorkstreams(D, now, ctx) {
    var ws = workstreams(D), tasks = {}, acts = {};
    arr(D.tasks).forEach(function (t) { tasks[t.id] = t; });
    arr(D.activity).forEach(function (a) { if (a.id) acts[a.id] = a; });
    var keys = ["ACCEPTED", "TESTED", "IMPLEMENTED", "IN_PROGRESS", "READY", "NOT_STARTED", "NEEDS_REWORK", "BLOCKED", "ON_HOLD", "DEFERRED", "REJECTED", "CANCELLED"];
    var cards = ws.list.map(function (w, i) {
      var c = obj(w.counts), tl = arr(w.tasks);
      var body = stackBar(c, keys) + legend(c, keys) +
        '<div class="prog" style="margin-top:12px">' + progRow("Implemented", w.pct_implemented, col("IMPLEMENTED")) + progRow("Tested", w.pct_tested, col("TESTED")) + progRow("Accepted", w.pct_accepted, col("ACCEPTED")) + "</div>" +
        '<div class="small" style="margin-top:10px">Blockers: ' + (arr(w.blockers).length ? arr(w.blockers).map(function (b) { return '<span class="tag" style="color:#ff6b78">' + esc(b) + "</span>"; }).join(" ") : '<span class="dim">none</span>') + "</div>" +
        '<div class="small">Depends on: ' + (ws.v2 ? (arr(w.dependencies).length ? esc(arr(w.dependencies).join(", ")) : '<span class="dim">none</span>') : nr()) + "</div>" +
        '<div class="small">Latest evidence: ' + (ws.v2 ? paths(w.latest_evidence) : nr()) + "</div>" +
        (ws.v2 ? '<div class="small">Recent: ' + (arr(w.recent).length ? arr(w.recent).slice(0, 3).map(function (id) { var a = acts[id]; return a ? esc(a.summary || a.ref || id) : esc(id); }).join(" · ") : '<span class="dim">none</span>') + "</div>" : "") +
        '<details class="toggle"' + (ctx.ui.open["ws:" + w.id] ? " open" : "") + ' data-open="ws:' + esc(w.id) + '"><summary>' + tl.length + " tasks</summary>" +
        list(tl, function (id) { var t = tasks[id] || { id: id }; return '<li><div class="row sb"><span><b class="mono">' + esc(id) + "</b> " + esc(t.title || "") + '</span><span class="row">' + tag(t.status) + (has(t, "visual") ? tag(t.visual) : "") + "</span></div></li>"; }) + "</details>";
      return card("ws-" + i, w.name || w.id, body, { cls: "ws", right: docBtn(docPathOf(w)) });
    });
    if (!ws.list.length) cards.push(card("ws-empty", "Workstreams", '<p class="empty">No workstream recorded.</p>'));
    return { title: "Workstreams", sub: ws.v2 ? "From workstreams[]" : "workstreams[] " + NR + " — grouped from tasks[].workstream (v1 fallback)", cards: cards, grid: "grid three" };
  }

  /* C (legacy timeline with uncalibrated P50/P80 and a 'critical path' label) was replaced by vForecast (SKILL v1.1 §9A, §18). */

  /* ---------- D: engineering & QA ---------- */
  function lastTests(r) { var t = arr(r.tests); return t.length ? t[t.length - 1] : null; }
  function vQA(D, now, ctx) {
    var out = [], qa = D.qa && typeof D.qa === "object" ? D.qa : null, pt = Array.isArray(D.patches) ? D.patches : null;
    if (pt) {
      var cc = {}, vc = {}; pt.forEach(function (p) { cc[p.status_code] = (cc[p.status_code] || 0) + 1; vc[p.status_visual] = (vc[p.status_visual] || 0) + 1; });
      out.push(card("qa-patch-sum", "Patches: code vs visual", '<div class="small muted">Code status</div>' + stackBar(cc, Object.keys(cc), 12) + legend(cc, Object.keys(cc)) +
        '<div class="small muted" style="margin-top:12px">Visual status</div>' + stackBar(vc, Object.keys(vc), 12) + legend(vc, Object.keys(vc))));
      out.push(card("qa-patches", "Patches (" + pt.length + ")", '<div class="scroll-x"><table class="t"><thead><tr><th>Patch</th><th>Task</th><th>Code</th><th>Visual</th><th>Round</th><th>Commit</th><th>Doc</th></tr></thead><tbody>' +
        pt.map(function (p) { return '<tr><td class="mono">' + esc(p.id) + "</td><td>" + val(p.task) + "</td><td>" + tag(p.status_code) + "</td><td>" + tag(p.status_visual) + "</td><td>" + val(p.round) + '</td><td class="mono">' + val(p.commit) + "</td><td>" + docBtn(docPathOf(p) || (isNR(p.manifest) ? null : p.manifest), "Doc") + "</td></tr>"; }).join("") + "</tbody></table></div>", { cls: "span-all" }));
    } else out.push(card("qa-patches", "Patches", '<p>patches[] ' + nr() + '</p><p class="note">Code vs visual status per patch appears once the data layer publishes patches[].</p>'));
    var rounds;
    if (qa && Array.isArray(qa.rounds)) {
      rounds = qa.rounds.map(function (r) { return { id: r.id, date: r.date, em: r.editmode, build: r.build, uidev: r.uidev, perf: r.perfshot, locks: r.locks, doc: r.doc, v2: true }; });
    } else {
      rounds = arr(D.rounds).filter(function (r) { return r.era === "U37H" || arr(r.tests).length; }).map(function (r) {
        var t = lastTests(r); return { id: r.round, date: r.end_ts || r.day, em: t, build: null, uidev: null, perf: null, doc: null, v2: false, rollback: arr(r.rollback), rejected: arr(r.rejected_final), jobs: arr(r.jobs).map(function (j) { return j.job; }) };
      });
    }
    rounds.sort(function (a, b) { return (ts(b.date) || 0) - (ts(a.date) || 0); });
    var withEm = rounds.filter(function (r) { return r.em && num(r.em.pass) != null; }).slice(0, 24).reverse();
    var chart = '<p class="empty">No EditMode result recorded.</p>';
    if (withEm.length) {
      var W = 640, H = 150, bw = (W - 20) / withEm.length, mx = Math.max.apply(null, withEm.map(function (r) { return (r.em.pass || 0) + (r.em.fail || 0); })) || 1;
      chart = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="EditMode results per round">' + withEm.map(function (r, i) {
        var hp = 110 * (r.em.pass || 0) / mx, hf = r.em.fail ? Math.max(4, 110 * r.em.fail / mx) : 0, x0 = 10 + i * bw;
        return '<rect x="' + (x0 + 1) + '" y="' + (120 - hp) + '" width="' + Math.max(2, bw - 3) + '" height="' + hp + '" rx="2" fill="#45e3d4" opacity=".8"><title>' + esc(r.id + ": pass " + r.em.pass + ", fail " + (r.em.fail || 0)) + "</title></rect>" +
          (hf ? '<rect x="' + (x0 + 1) + '" y="' + (120 - hp - hf) + '" width="' + Math.max(2, bw - 3) + '" height="' + hf + '" rx="2" fill="#ff6b78"/>' : "") +
          (i % Math.ceil(withEm.length / 8) === 0 ? '<text x="' + (x0 + bw / 2) + '" y="140" text-anchor="middle">' + esc(r.id) + "</text>" : "");
      }).join("") + "</svg>" + '<div class="legend"><span>' + sw("#45e3d4") + "Pass</span><span>" + sw("#ff6b78") + "Fail</span></div>";
    }
    out.push(card("qa-chart", "EditMode per round", chart + (qa ? "" : fallbackNote("qa.rounds"))));
    function emCell(e) { return e && num(e.pass) != null ? '<span class="t-ok">' + e.pass + "</span> / " + (e.fail ? '<span class="t-bad">' + e.fail + "</span>" : "0") + ' <span class="dim small">skip ' + (e.skip || 0) + " · inc " + (e.inconclusive || 0) + "</span>" : nr(); }
    function uiCell(u) { if (!u || typeof u !== "object") return nr(); var k = Object.keys(u); return k.length ? k.map(function (p) { var x = obj(u[p]); return esc(p) + " " + esc(x.issues != null ? x.issues : "?") + " issues / " + esc(x.screens != null ? x.screens : "?"); }).join("<br>") : nr(); }
    function lockCell(l) { return l && typeof l === "object" ? tag(l.state) + (l.failed ? ' <span class="t-bad small">' + esc(l.failed) + " failed</span>" : "") : nr(); }
    function perfCell(p) { return p && typeof p === "object" ? "pass " + esc(p.pass) + " · fail " + esc(p.fail) + " · precond " + esc(p.precondition_fail) : nr(); }
    out.push(card("qa-rounds", "Rounds", '<div class="scroll-x"><table class="t"><thead><tr><th>Round</th><th>Date</th><th>EditMode pass/fail</th><th>Build</th><th>UI dev</th><th>PerfShot</th><th>Regression lock</th><th>Doc</th></tr></thead><tbody>' +
      rounds.slice(0, ctx.ui.open["qa:all"] ? 400 : 15).map(function (r) { return '<tr><td class="mono">' + esc(r.id) + "</td><td>" + dateCell(r.date) + "</td><td>" + emCell(r.em) + "</td><td>" + (r.build ? tag(r.build) : nr()) + "</td><td>" + uiCell(r.uidev) + "</td><td>" + perfCell(r.perf) + "</td><td>" + lockCell(r.locks) + "</td><td>" + docBtn(r.doc, "Doc") + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (rounds.length > 15 ? '<button class="btn small" type="button" data-toggle="qa:all">' + (ctx.ui.open["qa:all"] ? "Show latest 15" : "Show all " + rounds.length) + "</button>" : "") + (qa ? "" : fallbackNote("qa.rounds")), { cls: "span-all" }));
    var fails = [];
    rounds.forEach(function (r) {
      if (r.em && r.em.fail) fails.push({ id: r.id, date: r.date, what: "EditMode " + r.em.fail + " failed", doc: r.doc });
      if (r.build === "FAIL") fails.push({ id: r.id, date: r.date, what: "Build failed", doc: r.doc });
      if (r.perf && (r.perf.fail || r.perf.precondition_fail)) fails.push({ id: r.id, date: r.date, what: "PerfShot fail " + (r.perf.fail || 0) + " · precondition fail " + (r.perf.precondition_fail || 0), doc: r.doc });
      if (r.locks && r.locks.failed) fails.push({ id: r.id, date: r.date, what: "Regression lock FAIL: " + arr(r.locks.items).slice(0, 4).map(function (i) { return i.source + " " + i.metric + "=" + i.value; }).join("; ") + (r.locks.failed > 4 ? " …" : ""), doc: r.doc });
      if (r.rollback && r.rollback.length) fails.push({ id: r.id, date: r.date, what: "Rollback: " + r.rollback.join(", "), doc: null });
      if (r.rejected && r.rejected.length) fails.push({ id: r.id, date: r.date, what: "Rejected: " + r.rejected.join(", "), doc: null });
    });
    arr(qa && qa.visual_audits).forEach(function (v) { if (v.verdict === "FAIL") fails.push({ id: v.shot, date: null, what: "Visual audit FAIL (patch " + (v.patch || NR) + ")", doc: v.doc }); });
    out.push(card("qa-fail", "Failed validations", list(fails.slice(0, 20), function (f) { return '<li><div class="row sb"><b class="mono">' + esc(f.id) + "</b>" + docBtn(f.doc, "Doc") + '</div><div class="t-bad">' + esc(f.what) + '</div><div class="small dim">' + (f.date ? esc(fmtDT(f.date) || f.date) : "") + "</div></li>"; }, "No failed validation recorded.")));
    out.push(card("qa-visual", "Visual audits", qa && Array.isArray(qa.visual_audits) ? list(qa.visual_audits, function (v) { return '<li><div class="row sb"><span class="mono">' + esc(v.shot) + "</span>" + tag(v.verdict) + '</div><div class="row sb small"><span class="muted">patch ' + val(v.patch) + "</span>" + docBtn(v.doc, "Doc") + "</div></li>"; }) : "<p>qa.visual_audits " + nr() + "</p>"));
    return { title: "Engineering & QA", sub: "Code status and visual status are separate gates", cards: out, grid: "grid two" };
  }

  /* ---------- E: blockers & risks ---------- */
  function vBlockers(D, now, ctx) {
    var b = blockers(D), act = b.list.filter(function (x) { return x.active !== false; }).sort(function (a, c) { return prioRank(a.priority) - prioRank(c.priority); }), res = b.list.filter(function (x) { return x.active === false; });
    function item(x) {
      return '<li><div class="row sb"><span class="row">' + tag(x.priority) + " <b class=\"mono\">" + esc(x.id) + "</b>" + (x.type ? '<span class="tag" style="color:#b195ff">' + esc(label(x.type)) + "</span>" : "") + (x.severity ? tag(x.severity === "HIGH" ? "RED" : x.severity === "MEDIUM" ? "AMBER" : x.severity) : "") + "</span>" + docBtn(docPathOf(x)) + "</div>" +
        "<div>" + esc(x.title) + '</div><div class="small muted">Workstream ' + val(x.workstream) + " · owner " + val(x.owner) + " · identified " + dateCell(x.identified) + (x.active === false ? " · resolved " + dateCell(x.resolved) : "") + "</div>" +
        '<div class="small">Status ' + tag(x.status) + (arr(x.dependencies).length ? " · depends on " + esc(x.dependencies.join(", ")) : "") + '</div><div class="small">Next action: ' + val(x.next_action) + "</div></li>";
    }
    var p0 = act.filter(function (x) { return x.priority === "P0" || (!b.v2 && x.type === "TRUE_BLOCKER"); }), rest = act.filter(function (x) { return p0.indexOf(x) < 0; });
    var out = [];
    out.push(card("bl-p0", b.v2 ? "P0 — critical" : "Critical (open TRUE_BLOCKER)", list(p0, item, "No critical blocker open.") + (b.v2 ? "" : fallbackNote("blockers")), { cls: p0.length ? "crit span-all" : "span-all" }));
    out.push(card("bl-open", "Other open blockers & risks (" + rest.length + ")", list(rest, item, "None open.")));
    var h = obj(D.health), f = obj(h.facts);
    out.push(card("bl-health", "Health rule", '<div class="row">Current ' + tag(h.value) + "</div>" + list(h.rules, function (r) { return '<li class="small">' + esc(r) + "</li>"; }) +
      '<p class="small">Blocked: ' + (arr(f.blocked).length ? esc(f.blocked.join(", ")) : "none") + " · on critical path: " + (arr(f.critical_blocked).length ? esc(f.critical_blocked.join(", ")) : "none") + "</p>"));
    out.push(card("bl-res", "Resolved history (" + res.length + ")", '<button class="btn small" type="button" data-toggle="bl:res">' + (ctx.ui.open["bl:res"] ? "Hide resolved" : "Show resolved") + "</button>" +
      (ctx.ui.open["bl:res"] ? '<div style="margin-top:10px">' + list(res, item, "No resolved blocker recorded.") + "</div>" : ""), { cls: "span-all" }));
    return { title: "Blockers & risks", sub: b.v2 ? "From blockers[]" : "blockers[] " + NR + " — v1 risks shown", cards: out, grid: "grid two" };
  }

  /* ---------- F: resources & agents ---------- */
  function vResources(D, now, ctx) {
    var cap = D.capacity && typeof D.capacity === "object" ? D.capacity : null, tk = D.tokens && typeof D.tokens === "object" ? D.tokens : null, ag = Array.isArray(D.agents) ? D.agents : null, out = [];
    out.push(card("rs-cap", "Capacity", cap ? '<div class="kpis">' + kpi(num(cap.disk_free_gb) != null ? cap.disk_free_gb + " GB" : NR, "Free disk", "gate " + esc(cap.build_gate_gb) + " GB · stop " + esc(cap.hard_stop_gb) + " GB", num(cap.disk_free_gb) != null && cap.disk_free_gb < (cap.build_gate_gb || 0) ? "#ff6b78" : "#5fe39a") +
      kpi(isNR(cap.active_agents) ? NR : cap.active_agents + " / " + cap.agent_cap, "Agents active / cap", "") + kpi(cap.runner_state, "Unity runner", "") + kpi(arr(cap.parallel_tasks).length, "Parallel-safe tasks", "serial " + arr(cap.serial_tasks).length) + "</div>" +
      '<div class="small" style="margin-top:10px">Tasks by owner: ' + Object.keys(obj(cap.by_owner)).map(function (k) { return esc(k) + " " + esc(cap.by_owner[k]); }).join(" · ") + "</div>" + (cap.file_conflicts ? '<p class="note">File conflicts: ' + esc(cap.file_conflicts) + "</p>" : "") : "<p>capacity " + nr() + "</p>"));
    if (tk && obj(tk.by_day) && Object.keys(obj(tk.by_day)).length) {
      var days = Object.keys(tk.by_day).sort().slice(-14), mx = Math.max.apply(null, days.map(function (d) { return num(tk.by_day[d].output) || 0; })) || 1, W = 640, H = 170, bw = (W - 20) / days.length;
      var svg = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Output tokens per day">' + days.map(function (d, i) {
        var v = num(tk.by_day[d].output) || 0, h = 120 * v / mx, x0 = 10 + i * bw;
        return '<rect x="' + (x0 + bw * .15) + '" y="' + (130 - h) + '" width="' + bw * .7 + '" height="' + h + '" rx="3" fill="url(#tkg)"><title>' + esc(d + ": " + int(v) + " output tokens, " + int(tk.by_day[d].requests) + " requests") + '</title></rect><text x="' + (x0 + bw / 2) + '" y="' + (125 - h) + '" text-anchor="middle">' + esc(compact(v)) + '</text><text x="' + (x0 + bw / 2) + '" y="150" text-anchor="middle">' + esc(d.slice(5)) + "</text>";
      }).join("") + '<defs><linearGradient id="tkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b195ff"/><stop offset="1" stop-color="#45e3d4"/></linearGradient></defs></svg>';
      out.push(card("rs-tok", "Output tokens per day", svg + list(tk.gaps, function (g) { return '<li class="small">' + esc(g) + "</li>"; }, "") + (tk.note ? '<p class="note">' + esc(tk.note) + "</p>" : "") + '<p class="note">Cost: ' + val(tk.cost) + "</p>", { cls: "span-all" }));
    } else out.push(card("rs-tok", "Tokens", "<p>tokens " + nr() + "</p>"));
    if (ag && ag.length) {
      var recent = ag.slice().sort(function (a, b) { return (ts(b.last_ts) || 0) - (ts(a.last_ts) || 0); });
      out.push(card("rs-ag", "Agent runs (" + ag.length + " recorded)", '<div class="scroll-x"><table class="t"><thead><tr><th>Agent run</th><th>Task</th><th>Minutes</th><th>Output tokens</th><th>Last seen</th></tr></thead><tbody>' +
        recent.slice(0, ctx.ui.open["ag:all"] ? 300 : 12).map(function (a) { return "<tr><td>" + esc(a.description || a.agent_id) + '<div class="dim small">' + esc(a.agent_type || "") + "</div></td><td class=\"mono\">" + val(a.task_id) + "</td><td>" + val(a.minutes) + "</td><td>" + val(num(a.output) != null ? int(a.output) : null) + "</td><td>" + dateCell(a.last_ts) + "</td></tr>"; }).join("") +
        "</tbody></table></div>" + (ag.length > 12 ? '<button class="btn small" type="button" data-toggle="ag:all">' + (ctx.ui.open["ag:all"] ? "Show latest 12" : "Show all " + ag.length) + "</button>" : ""), { cls: "span-all" }));
    } else out.push(card("rs-ag", "Agents", "<p>agents " + nr() + "</p>"));
    return { title: "Resources & agents", sub: "Only recorded values; unrecorded fields show NOT_RECORDED", cards: out, grid: "grid two" };
  }

  /* ---------- G: activity feed ---------- */
  function actItems(D) {
    return arr(D.activity).map(function (a) {
      if (has(a, "kind") || has(a, "summary")) return { v2: true, id: a.id, at: a.at, kind: a.kind || NR, ref: a.ref, from: a.from, to: a.to, summary: a.summary, evidence: arr(a.evidence), doc: a.doc };
      return { v2: false, id: a.hash, at: a.at, kind: a.repo ? "commit:" + a.repo : NR, ref: a.hash, summary: a.subject, evidence: [], doc: null };
    }).sort(function (a, b) { return (ts(b.at) || 0) - (ts(a.at) || 0); });
  }
  var KIND_COL = { task_status: "#45e3d4", patch: "#b195ff", test: "#6aa8ff", build: "#7cc4ff", capture: "#2fd3c3", audit: "#ffb454", acceptance: "#5fe39a", blocker: "#ff6b78", milestone: "#f6c85a", decision: "#f6c85a", forecast: "#f6c85a", session: "#9aa3cf" };
  function vActivity(D, now, ctx) {
    var it = actItems(D), kinds = [], f = ctx.ui.filter || "all";
    it.forEach(function (a) { if (kinds.indexOf(a.kind) < 0) kinds.push(a.kind); });
    var shown = f === "all" ? it : it.filter(function (a) { return a.kind === f; });
    var chips = '<div class="chips" role="group" aria-label="Filter by kind">' + ["all"].concat(kinds).map(function (k) { return '<button class="chip" type="button" data-filter="' + esc(k) + '" aria-pressed="' + (k === f) + '">' + esc(label(k)) + "</button>"; }).join("") + "</div>";
    var body = chips + '<ul class="list feed">' + (shown.length ? shown.slice(0, 120).map(function (a) {
      var c = KIND_COL[a.kind] || "#9aa3cf";
      return '<li><span class="dot" style="color:' + c + '"></span><div><div class="row sb"><span class="row"><span class="tag" style="color:' + c + '">' + esc(label(a.kind)) + "</span><b class=\"mono\">" + val(a.ref) + "</b></span>" + docBtn(a.doc, "Doc") + "</div>" +
        "<div>" + val(a.summary) + "</div>" + (a.v2 && (!isNR(a.from) || !isNR(a.to)) ? '<div class="small">' + (isNR(a.from) ? '<span class="dim">—</span>' : tag(a.from)) + " → " + (isNR(a.to) ? nr(a.to) : tag(a.to)) + "</div>" : "") +
        '<div class="small dim">' + dateCell(a.at) + " · " + esc(ago(a.at, now)) + "</div>" + (a.evidence.length ? '<div class="small">Evidence: ' + paths(a.evidence) + "</div>" : "") + "</div></li>";
    }).join("") : '<li class="empty">No activity recorded.</li>') + "</ul>" + (it.some(function (a) { return !a.v2; }) ? '<p class="note">v1 entries are git commits (what = subject, ref = hash); from→to, evidence and doc ' + nr() + ".</p>" : "");
    return { title: "Activity", sub: "Newest first · " + it.length + " recorded events", cards: [card("act", "Activity feed", body, { cls: "span-all" })], grid: "grid" };
  }

  /* ---------- H: release management (projection of docs/release/RELEASE_REGISTER.md + GOOGLE_PLAY_RELEASE_PLAN.md) ---------- */
  function relTable(cols, rows, fn, empty) {
    rows = arr(rows);
    if (!rows.length) return '<p class="empty">' + esc(empty || "None recorded.") + "</p>";
    return '<div class="scroll-x"><table class="t"><thead><tr>' + cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(fn).join("") + "</tbody></table></div>";
  }
  function cell(v) { return "<td>" + (isNR(v) || v === "—" ? nr(v) : esc(v)) + "</td>"; }
  function relSummary(s) { s = obj(s); var c = obj(s.counts); return '<div class="legend">' + Object.keys(c).map(function (k) { return "<span>" + sw(col(k)) + esc(label(k)) + " " + c[k] + "</span>"; }).join("") + "</div>"; }
  function statusRows(items) { return relTable(["Item", "Status", "Evidence"], items, function (r) { return '<tr><td>' + esc(r.Item) + (r.Requirement ? '<div class="dim small">' + esc(r.Requirement) + "</div>" : "") + (r.Value ? '<div class="dim small">' + esc(r.Value) + "</div>" : "") + "</td><td>" + tag(r.status) + "</td><td class=\"small\">" + (r.evidence_ok ? esc(r.Evidence) : '<span class="t-bad">' + esc(r.Evidence || "no evidence") + "</span>") + "</td></tr>"; }); }
  function vRelease(D, now, ctx) {
    var R = obj(D.release), out = [];
    if (!has(D, "release") || R.state !== "RECORDED") return { title: "Release management", sub: "release " + NR, cards: [card("rel-none", "Release records", "<p>release " + nr(R.state) + " — expected docs/release/RELEASE_REGISTER.md and GOOGLE_PLAY_RELEASE_PLAN.md.</p>", { cls: "span-all" })], grid: "grid" };
    function dl(k) { return docBtn(obj(R[k]).doc, "Doc"); }
    var tl = obj(R.timeline), ct = obj(R.closed_testing), pa = obj(R.production_access), ts_ = obj(R.testers);
    out.push(card("rel-tl", "1 · Release timeline (PROVISIONAL)", relTable(["Phase", "Target", "Gate", "Status", "Evidence"], tl.phases, function (p) { return "<tr><td><b class=\"mono\">" + esc(p.Phase) + "</b> " + esc(p.Name) + "</td>" + cell(p.Target) + '<td class="mono">' + esc(p.Gate) + "</td><td>" + tag(p.status) + "</td>" + cell(p.Evidence) + "</tr>"; }) +
      '<div class="small" style="margin-top:8px">Separate gates: ' + arr(R.gates).map(function (g) { return '<span class="mono">' + esc(g.id) + "</span> " + tag(g.passed ? "PASS" : "NOT_STARTED"); }).join(" · ") + '</div><p class="note">Dates are planning anchors; release follows readiness. Engineering complete ≠ Play compliance ≠ closed testing ≠ production access ≠ soft launch ≠ rollout.</p>', { cls: "span-all", right: dl("timeline") }));
    var sc = obj(R.status_cards);
    out.push(card("rel-cards", "Release readiness status", arr(sc.items).length ? '<div class="relcards">' + arr(sc.items).map(function (c) {
      return '<div class="relcard" data-card="' + esc(c.id) + '"><div class="relcard-h">' + esc(c.title) + "</div><div>" + tag(c.status) + "</div>" +
        (c.derived && c.derived !== c.status ? '<div class="small dim">register-derived: ' + tag(c.derived) + "</div>" : "") +
        (c.basis ? '<div class="small">' + esc(c.basis) + "</div>" : "") +
        (arr(c.missing).length ? '<div class="small dim">Missing: ' + arr(c.missing).map(esc).join(", ") + "</div>" : "") +
        '<div class="small dim">' + (c.evidence_ok ? "Evidence: " + esc(c.evidence) : '<span class="t-bad">no evidence</span>') + "</div></div>";
    }).join("") + "</div>" + '<p class="note">Projection of the release Markdown (addendum status cards first, register-derived status shown when it differs). A DONE the register does not support is shown as UNVERIFIED. Production access is never guaranteed after 14 days.</p>' : '<p class="empty">' + nr() + "</p>", { cls: "span-all", right: docBtn(sc.doc, "Doc") }));
    out.push(card("rel-ready", "2 · Play Console readiness", relSummary(obj(R.readiness).summary) + statusRows(obj(R.readiness).items), { right: dl("readiness") }));
    out.push(card("rel-acct", "3 · Account verification", relSummary(obj(R.account).summary) + statusRows(obj(R.account).items) + '<p class="note">UNVERIFIED rows need the owner to confirm in Play Console.</p>', { right: dl("account") }));
    out.push(card("rel-test", "4 · Tester recruitment", '<div class="kpis">' + kpi(ts_.invited, "Invited", "invitations do not count") + kpi((ts_.opted_in || 0) + " / " + (ts_.target || 12), "Opted in now", "pseudonymous IDs only", (ts_.opted_in || 0) >= (ts_.target || 12) ? "#5fe39a" : "#ffb454") + "</div>" +
      relTable(["ID", "Invited", "Opted in", "Opted out", "Active days", "Last build", "Feedback"], ts_.items, function (t) { return '<tr><td class="mono">' + esc(t.id) + "</td>" + cell(t.invited) + cell(t.opted_in) + cell(t.opted_out) + cell(t.active_days) + cell(t.last_build) + cell(t.feedback_count) + "</tr>"; }, "No tester recorded yet."), { right: dl("testers") }));
    var day = num(ct.consecutive_days) || 0, req = ct.required_days || 14;
    out.push(card("rel-ct", "5 · Closed testing progress", '<div class="kpis">' + kpi(Math.min(day, req) + " / " + req, "Consecutive days with ≥ " + (ct.required_testers || 12) + " opted in", "starts on first day with ≥ 12 opted in", day >= req ? "#5fe39a" : "#ffb454") +
      kpi(ct.testers_14d + " / " + (ct.required_testers || 12), "Testers opted in ≥ 14 days", "") + kpi(ct.start, "Counter start", "recorded: " + esc(ct.recorded_start)) + kpi(ct.qualified ? ct.qualified_date : "NOT_STARTED", "Qualified", "", ct.qualified ? "#5fe39a" : null) + "</div>" +
      progRow("14-day window", Math.round(100 * Math.min(day, req) / req), "#45e3d4", "") + '<p class="small">Track: ' + tag(ct.track) + "</p>", { right: dl("closed_testing") }));
    out.push(card("rel-pa", "6 · Production access", '<div class="row">Eligible ' + tag(pa.eligible ? "PASS" : "NOT_STARTED") + " · granted " + tag(pa.granted ? "DONE" : "NOT_STARTED") + "</div>" +
      relTable(["Date", "Event", "Result", "Evidence"], pa.log, function (r) { return "<tr>" + cell(r.Date) + cell(r.Event) + cell(r.Result) + cell(r.Evidence) + "</tr>"; }, "No application recorded.") +
      list(pa.rules, function (r) { return '<li class="small"><span class="mono">' + esc(r.ID) + "</span> " + tag(r.status) + " " + esc(r.Rule) + ' <span class="dim">' + esc(r.Source) + "</span></li>"; }, ""), { right: dl("production_access") }));
    out.push(card("rel-list", "7 · Store listing checklist", relSummary(obj(R.listing).summary) + statusRows(obj(R.listing).items), { right: dl("listing") }));
    out.push(card("rel-mk", "8 · Soft-launch markets", relTable(["Market", "Code", "Phase", "Availability", "Rollout %", "Status"], obj(R.markets).items, function (m) { return "<tr>" + cell(m.Market) + '<td class="mono">' + esc(m["Country code"]) + "</td>" + cell(m.Phase) + cell(m.Availability) + cell(m["Rollout %"]) + "<td>" + tag(m.status) + "</td></tr>"; }) + '<p class="note">Staged rollout applies to updates only; the first production release cannot be staged.</p>', { right: dl("markets") }));
    out.push(card("rel-rc", "9 · Release candidates", relTable(["RC", "Version", "Code", "Commit", "Track", "Build evidence", "Status"], obj(R.rc).items, function (r) { return '<tr><td class="mono">' + esc(r.RC) + "</td>" + cell(r["Version name"]) + cell(r["Version code"]) + '<td class="mono">' + esc(r.Commit) + "</td>" + cell(r.Track) + cell(r["Build evidence"]) + "<td>" + tag(r.status) + "</td></tr>"; }, "No release candidate yet (no AAB built)."), { right: dl("rc") }));
    out.push(card("rel-kpi", "10 · Launch KPIs — target vs actual", relTable(["KPI", "Target", "Actual", "Source"], obj(R.kpis).items, function (k) { return "<tr>" + cell(k.kpi) + cell(k.target) + "<td>" + (isNR(k.actual) ? nr(k.actual) : esc(k.actual)) + "</td><td>" + tag(k.source) + "</td></tr>"; }), { cls: "span-all", right: dl("kpis") }));
    var pr = arr(R.problems);
    if (pr.length) out.push(card("rel-pr", "Record problems", list(pr, function (x) { return '<li class="small t-bad">' + esc(x) + "</li>"; }), { cls: "span-all crit" }));
    return { title: "Release management", sub: "Google Play · projection of the release Markdown records as of " + esc(R.as_of), cards: out, grid: "grid two" };
  }

  /* ---------- Mission Control modules (SKILL v1.1 §6–§12). Generic: every value comes from the `pm` and `forecast`
     keys (DATA_CONTRACT v3); no project-specific logic. Missing data renders as NOT_RECORDED / UNKNOWN. ---------- */
  var BUCKETS_DEFAULT = ["DONE", "DIRECTOR_ACCEPTED", "QA_PASS", "IMPLEMENTED", "IN_PROGRESS", "READY", "PLANNED", "REWORK", "BLOCKED", "HOLD"];
  function PM(D) { return obj(D.pm); }
  function built(D) { return PM(D).state === "BUILT"; }
  function FC(D) { return obj(D.forecast); }
  function fcEngine(F) { return obj(F).schema === "rmct.forecast/1"; }
  function bucketsOf(D) { var b = arr(obj(PM(D).status_mapping).buckets); return b.length ? b : BUCKETS_DEFAULT; }
  function nodes(D) { return arr(PM(D).nodes); }
  function nodeMap(D) { var m = {}; nodes(D).forEach(function (n) { m[n.id] = n; }); return m; }
  function ids(a, max) { a = arr(a); if (!a.length) return '<span class="dim">none</span>'; var s = a.slice(0, max || 12).map(function (x) { return '<button class="idlink" type="button" data-node="' + esc(x) + '">' + esc(x) + "</button>"; }).join(" "); return s + (a.length > (max || 12) ? ' <span class="dim small">+' + (a.length - (max || 12)) + " more</span>" : ""); }
  function kv(rows) { return '<dl class="kv">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>"; }
  function more(key, title, body, ctx) { return '<details class="toggle more"' + (ctx && ctx.ui.open[key] ? " open" : "") + ' data-open="' + esc(key) + '"><summary>' + esc(title) + '</summary><div class="more-in">' + body + "</div></details>"; }
  function notBuilt(D, key, title) { return card(key, title, "<p>pm " + nr(PM(D).state || NR) + ' — the Mission Control layer is not in this snapshot.</p><p class="note">' + esc(PM(D).note || "Expected key `pm` (DATA_CONTRACT v3).") + "</p>", { cls: "span-all" }); }
  /* progress semantics (owner directive 22 Nov 2026): three mutually exclusive segments from pm.progress (one classifier in rmct/pm/progress.py) */
  var SEG = ["ACCEPTED", "TECHNICALLY_READY_PENDING_ACCEPTANCE", "NOT_TECHNICALLY_READY"];
  var SEG_SHORT = { ACCEPTED: "Accepted", TECHNICALLY_READY_PENDING_ACCEPTANCE: "Awaiting acceptance", NOT_TECHNICALLY_READY: "Not technically ready" };
  var SEG_COL = { ACCEPTED: "#5fe39a", TECHNICALLY_READY_PENDING_ACCEPTANCE: "#b195ff", NOT_TECHNICALLY_READY: "#5b6390" };
  function PG(D) { return obj(PM(D).progress); }
  function hasPG(D) { return arr(PG(D).segments).length === 3; }
  function segCounts(segs) { var c = {}; arr(segs).forEach(function (s) { c[s.id] = s.count; }); return c; }
  function segBar(segs, h) {
    var c = segCounts(segs), tot = SEG.reduce(function (a, k) { return a + (num(c[k]) || 0); }, 0);
    if (!tot) return '<p class="empty">No launch task in this group.</p>';
    return '<div class="segbar" role="img" aria-label="' + esc(SEG.map(function (k) { return SEG_SHORT[k] + " " + (c[k] || 0); }).join(", ")) + '"' + (h ? ' style="height:' + h + 'px"' : "") + ">" +
      SEG.map(function (k) { var n = num(c[k]) || 0; return n ? '<i style="width:' + (100 * n / tot) + "%;background:" + SEG_COL[k] + '"' + (k === "NOT_TECHNICALLY_READY" ? ' class="lt"' : "") + ">" + (100 * n / tot >= 9 ? esc(n) : "") + "</i>" : ""; }).join("") + "</div>" +
      '<div class="legend">' + SEG.map(function (k) { return "<span>" + sw(SEG_COL[k]) + esc(SEG_SHORT[k]) + " <b>" + esc(c[k] || 0) + "</b></span>"; }).join("") + "</div>";
  }
  function segTag(s) { return isNR(s) ? nr(s) : '<span class="tag" style="color:' + col(s) + '">' + esc(SEG_SHORT[s] || label(s)) + "</span>"; }
  function ecNote(ec) { var n = obj(obj(ec).note); return n.text ? '<div class="small dim">Note: ' + esc(n.text) + (n.source ? " (" + esc(n.source) + ")" : "") + "</div>" : ""; }
  function progressNote(D) { var P = PG(D); return '<p class="note">Engineering completion = technically ready (accepted + awaiting acceptance) ÷ launch tasks. Formal acceptance = DONE only (rule unchanged). Awaiting acceptance is finished engineering waiting for a gate, not unfinished work. Reconciliation ' + tag(obj(P.reconciliation).ok ? "OK" : "FAIL") + ' <span class="mono small">' + esc(obj(P.reconciliation).equation || "") + "</span></p>"; }
  var CAT_SHORT = { OWNER_ACCEPTANCE: "Owner acceptance", AUDITOR_ACCEPTANCE: "Auditor / technical test", MISSING_EVIDENCE: "Missing evidence", DEPENDENCY: "Dependency" };
  function catTag(c) { return '<span class="tag" style="color:' + col(c) + '">' + esc(CAT_SHORT[c] || label(c)) + "</span>"; }
  function queueCounts(D) { var q = obj(PM(D).acceptance_queue), b = obj(q.by_primary); return '<div class="kpis">' + ["DEPENDENCY", "AUDITOR_ACCEPTANCE", "MISSING_EVIDENCE", "OWNER_ACCEPTANCE"].map(function (k) { return kpi(num(b[k]) != null ? b[k] : NR, CAT_SHORT[k], "", col(k)); }).join("") + "</div>"; }
  function pctOf(n, d) { return d ? Math.round(1000 * n / d) / 10 : null; }
  function genericTable(rows, cap) {
    rows = arr(rows).filter(function (r) { return r && typeof r === "object"; }); if (!rows.length) return '<p class="empty">None recorded.</p>';
    var cols = []; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (cols.indexOf(k) < 0) cols.push(k); }); });
    function cell(v) { return v == null || v === "" ? nr() : Array.isArray(v) ? esc(v.join(", ")) : typeof v === "object" ? esc(JSON.stringify(v)) : /^[A-Z][A-Z_]{2,}$/.test(String(v)) ? tag(v) : esc(v); }
    return '<div class="scroll-x"><table class="t"><thead><tr>' + cols.map(function (c) { return "<th>" + esc(label(c)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.slice(0, cap || rows.length).map(function (r) { return "<tr>" + cols.map(function (c) { return "<td>" + cell(r[c]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }

  /* alerts: never hidden behind Details (SKILL §7) */
  function alerts(D, now, ctx) {
    var sy = syncInfo(D, now, ctx && ctx.fetchErr), out = [], P = PM(D), probs = arr(obj(sy.consistency).problems);
    var valFail = (sy.state === "FAILED" && /VALIDATION FAILED|ValidationFailed/i.test(String(sy.error || ""))) || arr(obj(P.validation).severe).length > 0;
    if (valFail) out.push({ cls: "failed", title: "VALIDATION FAILED", msg: "The source failed validation; the figures below are the last verified snapshot, not the current state. " + (sy.error ? "Error: " + sy.error : arr(obj(P.validation).severe).join("; ")) });
    else if (sy.state === "FAILED") out.push({ cls: "failed", title: "Sync FAILED", msg: (sy.error ? "Sync error: " + sy.error + ". " : "") + sy.problems.join(" ") });
    if (sy.state === "STALE") out.push({ cls: "stale", title: "STALE", msg: "This snapshot is not current. " + sy.problems.join(" ") });
    if (obj(P.reconciliation).ok === false || obj(obj(P.progress).reconciliation).ok === false) out.push({ cls: "failed", title: "RECONCILIATION FAILED", msg: "Exclusive status buckets do not add up to the executable count." });
    var mm = probs.filter(function (p) { return /SOURCE MISMATCH/i.test(p); }).map(String);
    var regSha = obj(obj(P.sources).register).sha256, regPath = obj(obj(P.sources).register).path;
    if (regSha) {
      arr(obj(obj(D.meta).sync).sources).forEach(function (s) { if (s && s.path === regPath && s.sha256 && s.sha256 !== regSha) mm.push("meta.sync source hash " + String(s.sha256).slice(0, 12) + " ≠ pm source hash " + String(regSha).slice(0, 12) + "."); });
      var fsha = obj(FC(D).adapter).register_sha256; if (fsha && fsha !== regSha) mm.push("forecast was computed from register " + String(fsha).slice(0, 12) + ", pm from " + String(regSha).slice(0, 12) + ".");
    }
    if (mm.length) out.push({ cls: "failed", title: "SOURCE MISMATCH", msg: "The rendered data does not come from a single source revision. " + mm.join(" ") });
    return out;
  }
  function provLine(D, now) {
    var P = PM(D), s = obj(P.sources), sy = obj(obj(D.meta).sync), rec = obj(P.reconciliation);
    var when = s.generated_at || sy.last_success, rev = obj(s.register).revision;
    return "Updated " + (fmtDT(when) ? esc(fmtDT(when)) + ' <span class="dim">(' + esc(ago(when, now)) + ")</span>" : nr()) + " · source " + (rev ? '<span class="mono">' + esc(rev) + "</span>" : nr()) +
      " · reconciliation " + (rec.ok === true ? tag("OK") : rec.ok === false ? tag("FAIL") : nr()) + " · validation " + (s.validation ? tag(s.validation) : nr());
  }

  /* ---- Mission Control / Overview ---- */
  function topImpact(D) {
    return arr(PM(D).dependency_impact).slice().sort(function (a, b) {
      return arr(b.exclusively_blocked).length - arr(a.exclusively_blocked).length || (arr(b.direct).length + arr(b.transitive).length) - (arr(a.direct).length + arr(a.transitive).length);
    });
  }
  function msRule(g) {
    var o = arr(g.outstanding_exit_criteria), u = arr(g.untracked_exit_criteria), r = g.rollup_rule;
    return (o.length ? '<div class="small">' + tag("OUTSTANDING EXIT") + " " + o.map(esc).join(" · ") + "</div>" : "") +
      (u.length ? '<div class="small dim">Exit criteria not linked to a task (not counted as met): ' + u.map(esc).join(" · ") + "</div>" : "") +
      (r ? '<div class="small dim">Rollup: ' + esc(arr(r.not_technically_ready_buckets).join(", ")) + " not counted as technically ready (" + esc(r.source || "") + "); reclassified " + esc(arr(r.reclassified).join(" ")) + "</div>" : "");
  }
  function nextMilestone(D) {
    var groups = {}; arr(obj(PM(D).reconciliation).groups).forEach(function (g) { groups[g.group] = g; });
    var pg = {}; arr(PG(D).by_milestone).forEach(function (g) { pg[g.group] = g; });
    var ms = arr(PM(D).milestones); for (var i = 0; i < ms.length; i++) { var g = groups[ms[i].id]; if (!g || obj(g.counts).DONE !== g.executable) return { m: ms[i], g: g, p: pg[ms[i].id] }; }
    return null;
  }
  // Release-path headline (OPERATING_RULES_V2 §1-§2): CT/SL from release_path.json + daily budget. "n/a" = source missing.
  function ctslPct(x) { return x === "n/a" || x == null ? "n/a" : x + " %"; }
  function ctslCap(m, unit) { m = obj(m); return m.value === "n/a" || m.value == null ? "n/a" : (m.value + (unit || "") + " / " + m.cap + (unit || "")); }
  function ctslCard(D) {
    var R = obj(obj(D.release).path_ctsl); if (!R.schema) return null;
    var B = obj(R.budget), T = obj(B.output_tokens), dk = obj(B.disk_free_gb), lg = obj(R.legacy_u37h);
    var tok = T.value === "n/a" || T.value == null ? "n/a" : (Math.round(T.value / 1000) + " k / " + Math.round(T.cap / 1000) + " k");
    var gates = arr(R.gates).map(function (g) { return kpi(ctslPct(g.pct), g.id + " " + g.name, esc(g.met) + " / " + esc(g.total) + " MET" + (g.deferred ? " · " + esc(g.deferred) + " deferred" : "")); }).join("");
    return card("mc-ctsl", "Kemajuan jalur rilis",
      '<p class="lead">Dihitung dari <span class="mono">' + esc(R.source) + "</span>" + (R.state !== "OK" ? " — " + esc(R.state) + ": " + esc(R.reason || "") : "") + ". " + esc(R.gate_rule) + ".</p>" +
      '<div class="kpis six" style="margin-top:12px">' + kpi(ctslPct(obj(R.ct).pct), "Menuju uji tertutup", "G1×0.45 + G2×0.55", col("QA_PASS")) +
      kpi(ctslPct(obj(R.sl).pct), "Menuju soft launch", "G1×0.20 + G2×0.25 + G3×0.20 + G4×0.30 + G5×0.05", col("QA_PASS")) + gates + "</div>" +
      '<h3 class="small" style="margin-top:12px">Anggaran harian (' + esc(B.day) + " UTC)</h3>" +
      '<div class="kpis six">' + kpi(ctslCap(B.agents_started), "Agen dimulai hari ini", "batas 16 run/hari") + kpi(ctslCap(B.agents_running), "Agen berjalan", "batas 4 bersamaan") +
      kpi(ctslCap(B.unity_rounds), "Ronde Unity hari ini", "batas 4/hari (ronde utama)") + kpi(tok, "Token keluaran hari ini", "sasaran ≤ 1 jt; dihitung per sync" + (T.seconds != null ? " (" + esc(T.seconds) + " dtk)" : "")) +
      kpi(dk.value === "n/a" || dk.value == null ? "n/a" : dk.value + " GB", "Disk bebas", "sasaran ≥ " + esc(dk.target) + " GB · retensi < " + esc(dk.floor) + " GB") + "</div>" +
      '<p class="foot">Detail: register U37H lama ' + esc(ctslPct(lg.pct)) + " (" + esc(lg.count) + " / " + esc(lg.total) + " ACCEPTED) — bukan judul, lihat kartu di bawah.</p>", { cls: "span-all hero" });
  }
  function vMission(D, now, ctx) {
    if (!built(D)) { var o = vOverview(D, now, ctx); o.cards.unshift(notBuilt(D, "mc-none", "Mission Control")); return o; }
    var P = PM(D), M = obj(P.metrics), den = obj(M.denominator).launch_executable, F = FC(D), out = [];
    var openBl = arr(P.blockers).filter(function (b) { return b.open; }), ac = obj(P.action_center), cards = arr(ac.cards);
    var ready = cards.filter(function (c) { return c["class"] === "READY"; }), waiting = cards.filter(function (c) { return c["class"] === "WAITING"; });
    var etcB = obj(obj(F.effort).ETC_total).b, fst = fcEngine(F) ? F.status : NR, nMiss = arr(F.missing_inputs).length;
    var PGd = PG(D), ec = obj(PGd.engineering_completion), fa = obj(PGd.formal_acceptance), segc = segCounts(PGd.segments), pgT = hasPG(D) ? PGd.total : den;
    var sentence = (hasPG(D) ? "Engineering " + esc(ec.count) + " of " + esc(pgT) + " launch tasks technically ready (" + esc(ec.pct) + " %): " + esc(fa.count) + " formally accepted (DONE), " + esc(segc.TECHNICALLY_READY_PENDING_ACCEPTANCE) + " awaiting acceptance; " + esc(segc.NOT_TECHNICALLY_READY) + " still need engineering. " : "Progress classification " + NR + ". ") +
      esc(ready.length) + " decision" + (ready.length === 1 ? " is" : "s are") + " ready for the Director; " + esc(openBl.length) + " blocker" + (openBl.length === 1 ? " is" : "s are") + " open. " +
      (fst === "VALIDATED" || fst === "PROVISIONAL" ? "Delivery forecast " + esc(fst) + "." : "No delivery date is forecast: " + esc(fst) + (nMiss ? " (" + nMiss + " missing inputs)." : "."));
    var health = obj(D.health).value, ctsl = ctslCard(D);
    if (ctsl) out.push(ctsl);
    out.push(card("mc-hero", (ctsl ? "Detail: register U37H — " : "") + (P.project ? (obj(P.project).name || String(P.project)) : "Mission Control"),
      '<p class="lead">' + sentence + "</p>" + (health ? '<div class="row small">Health rule ' + tag(health) + ' <span class="dim">(rule-based; see Blockers)</span></div>' : "") +
      '<div class="kpis six" style="margin-top:12px">' +
      kpi(isNR(ec.pct) ? NR : ec.pct + " %", "Engineering completion", esc(ec.count) + " / " + esc(pgT) + " technically ready (incl. accepted)" + ecNote(ec), SEG_COL.TECHNICALLY_READY_PENDING_ACCEPTANCE) +
      kpi(isNR(fa.pct) ? NR : fa.pct + " %", "Formal acceptance", esc(fa.count) + " / " + esc(pgT) + " accepted (DONE)", SEG_COL.ACCEPTED) +
      kpi(isNR(segc.TECHNICALLY_READY_PENDING_ACCEPTANCE) ? NR : segc.TECHNICALLY_READY_PENDING_ACCEPTANCE, "Awaiting acceptance", "technically ready, not yet DONE", col("QA_PASS")) +
      kpi(isNR(segc.NOT_TECHNICALLY_READY) ? NR : segc.NOT_TECHNICALLY_READY, "Remaining engineering work", "launch tasks not technically ready", col("PLANNED")) +
      kpi(openBl.length, "Active blockers", "open gates/decisions/risks", col("BLOCKED")) +
      kpi(fst, "Forecast status", (num(etcB) != null ? "ETC base " + etcB + " h · " : nMiss + " missing inputs · ") + (fcEngine(F) ? (obj(F.percentiles).status === "AVAILABLE" ? "calibrated" : "no calibrated percentiles") : "engine not published"), col(fst)) +
      "</div>" + (hasPG(D) ? '<div class="seg-wrap">' + segBar(PGd.segments, 22) + "</div>" : "") + '<p class="foot">' + provLine(D, now) + ' · <a href="#sources">Details</a></p>', { cls: "span-all hero" }));
    var top = topImpact(D)[0], bm = {}; arr(P.blockers).forEach(function (b) { bm[b.id] = b; });
    var drv = F.top_schedule_driver;
    out.push(card("mc-bottleneck", "Current bottleneck", top ?
      '<div class="row">' + tag(obj(bm[top.id]).priority || NR) + ' <b class="mono">' + esc(top.id) + "</b> " + esc(obj(bm[top.id]).title || "") + "</div>" +
      kv([["Owner", val(top.owner_code)], ["Removes it", val(top.next_action)], ["Direct", esc(arr(top.direct).length) + " tasks"], ["Transitive", esc(arr(top.transitive).length) + " tasks"],
          ["Unlocked at once", ids(top.immediately_unlockable)], ["Still blocked by others", esc(arr(top.multiply_blocked).length) + " tasks"]]) +
      '<p class="note">Ranked by dependency impact (graph reachability; not a critical path). ' + (drv ? "Forecast schedule driver: " + esc(drv.type === "missing_input" ? "missing input — " + (drv.reason || "") + (drv.count ? " (" + drv.count + ")" : "") : (drv.task || "") + " " + (drv.wait_reason || "")) : "") + '</p><a class="btn small" href="#blockers">All blockers</a>'
      : '<p class="empty">No open blocker with dependency impact recorded.</p>', { right: top ? docBtn(top.doc) : "" }));
    out.push(card("mc-actions", "Director actions required now (" + ready.length + ")", list(ready.slice(0, 4), function (c) {
      return '<li><div class="row sb"><span class="row">' + tag("READY") + ' <b class="mono">' + esc(c.id) + "</b></span>" + tag(c.approval_scope) + "</div><div>" + esc(c.question) + '</div><div class="small muted">Recommendation: ' + val(c.recommendation) + "</div></li>";
    }, "No decision is ready now.") + '<p class="note">' + esc(waiting.length) + " waiting for evidence/dependency · " + esc(obj(ac.counts).FUTURE || 0) + ' future (not actionable yet).</p><a class="btn small" href="#actions">Open Action Center</a>'));
    var act = arr(P.workers).filter(function (w) { return arr(w.active).length; }), nm = nextMilestone(D);
    out.push(card("mc-workers", "Active workers & next milestone",
      list(act, function (w) { return '<li><div class="row sb"><b>' + esc(w.role || w.id) + "</b><span class=\"small dim\">capacity " + val(w.capacity_h_per_week) + "</span></div><div>" + ids(w.active) + "</div></li>"; }, "No worker has an active task recorded.") +
      (nm ? '<div class="ms-next"><div class="row">' + tag("NEXT MILESTONE") + ' <b class="mono">' + esc(nm.m.id) + "</b> " + esc(nm.m.name || "") + '</div><div class="small muted">Target ' + val(nm.m.target) + " · exit: " + val(nm.m.exit) + "</div>" +
        (nm.p ? segBar(nm.p.segments, 12) + '<div class="small dim">' + esc(nm.p.equation) + "</div>" + msRule(nm.p) : nm.g ? stackBar(nm.g.counts, bucketsOf(D), 10) + '<div class="small dim">' + esc(nm.g.equation) + "</div>" : "") + "</div>" : '<p class="empty">No open milestone recorded.</p>'),
      { right: '<a class="btn small" href="#workers">Workers</a>' }));
    return { title: "Mission Control", sub: "Are we on track? Health, primary KPIs, bottleneck and the decisions needed now", cards: out, grid: "grid two" };
  }

  /* ---- Action Center ---- */
  function decisionCard(c) {
    var why = c["class"] === "READY" ? "Brief complete and prerequisites met." : c["class"] === "WAITING" ? "Not actionable yet: missing item or unfinished prerequisite." : "Later phase: a prerequisite is itself waiting.";
    var notAuth = c.approval_scope === "UNQUALIFIED" ? "Any downstream GO — no scope qualifier is recorded, so approval authorizes only the recorded option." : (c.not_authorized || NR);
    return '<li class="dcard"><div class="row sb"><span class="row">' + tag(c["class"]) + ' <b class="mono">' + esc(c.id) + "</b></span><span class=\"row\">" + tag(c.status) + tag(c.approval_scope) + "</span></div>" +
      '<div class="q">' + esc(c.question) + "</div>" +
      kv([["Decided by", val(c.authority)], ["Why now", esc(why)], ["Recommendation", val(c.recommendation)], ["Alternatives", val(c.options)],
          ["Authorized", val(c.authorizes)], ["NOT authorized", esc(notAuth)],
          ["Executable at once", ids(c.immediately_unlockable)], ["Transitively affected", ids(c.transitively_affected)], ["Still blocked after", ids(c.remains_blocked_after)],
          ["If delayed", val(c.if_delayed)]].concat(arr(c.missing).length ? [["Missing", arr(c.missing).map(function (m) { return esc(m.item) + ' <span class="dim">— owner ' + esc(m.owner || NR) + "</span>"; }).join("<br>")]] : [])) +
      '<div class="row">' + docBtn(c.src || c.evidence, "Source") + "</div></li>";
  }
  function vActions(D, now, ctx) {
    if (!built(D)) return { title: "Action Center", sub: "", cards: [notBuilt(D, "ac-none", "Action Center")], grid: "grid" };
    var ac = obj(PM(D).action_center), cards = arr(ac.cards), out = [];
    out.push(card("ac-k", "Decisions by readiness", '<div class="kpis">' + kpi(obj(ac.counts).READY, "READY for decision", "", col("READY")) + kpi(obj(ac.counts).WAITING, "WAITING (evidence/dependency)", "", col("HOLD")) +
      kpi(obj(ac.counts).FUTURE, "FUTURE (not actionable)", "", col("PLANNED")) + kpi(arr(ac.approved).length, "Approved (register)", "see Decisions", col("DIRECTOR_ACCEPTED")) + "</div>" +
      (arr(ac.problems).length ? list(ac.problems, function (p) { return '<li class="small t-warn">' + esc(p) + "</li>"; }) : "") + more("ac:rule", "Classification rule", "<p>" + val(ac.rule) + "</p>", ctx), { cls: "span-all" }));
    if (hasPG(D)) { var aq = obj(PM(D).acceptance_queue);
      out.push(card("ac-accq", "Acceptance queue (" + esc(num(aq.count) != null ? aq.count : NR) + " technically ready tasks awaiting acceptance)", queueCounts(D) +
        '<p class="note">Primary next gate per task; ' + esc(aq.also_waiting_on_unaccepted_deps) + " also wait for predecessors to be accepted. Not immediately acceptable: each item names what it waits for.</p>" + '<a class="btn small" href="#quality">Open acceptance queue</a>', { cls: "span-all" })); }
    [["READY", "READY for decision"], ["WAITING", "WAITING for evidence / dependency"], ["FUTURE", "FUTURE / not actionable"]].forEach(function (k) {
      var cs = cards.filter(function (c) { return c["class"] === k[0]; }), key = "ac:" + k[0], cap = k[0] === "READY" ? 6 : 3;
      out.push(card("ac-" + k[0], k[1] + " (" + cs.length + ")", list(ctx.ui.open[key] ? cs : cs.slice(0, cap), decisionCard, "None.") +
        (cs.length > cap ? '<button class="btn small" type="button" data-toggle="' + key + '">' + (ctx.ui.open[key] ? "Show fewer" : "Show all " + cs.length) + "</button>" : ""), { cls: "span-all" }));
    });
    return { title: "Action Center", sub: "What does the Director need to decide today? Only READY items are actionable", cards: out, grid: "grid" };
  }

  /* ---- Workers / Capacity ---- */
  function vWorkers(D, now, ctx) {
    var out = [];
    if (built(D)) {
      var P = PM(D);
      out.push(card("wk-tab", "Assignments & capacity", '<div class="scroll-x"><table class="t"><thead><tr><th>Worker</th><th>Capacity h/week</th><th>Concurrency</th><th>Active</th><th>Awaiting acceptance</th><th>Queue (eligible)</th><th>Blocked / hold</th><th>Waiting on dependency</th><th>Utilization</th></tr></thead><tbody>' +
        arr(P.workers).map(function (w) { return "<tr><td><b>" + esc(w.role || w.id) + '</b><div class="dim small mono">' + esc(arr(w.register_codes).join(", ")) + "</div></td><td>" + (isNR(w.capacity_h_per_week) ? tag("UNKNOWN") : esc(w.capacity_h_per_week)) + "</td><td>" + (w.concurrency_cap == null ? tag("UNKNOWN") : esc(w.concurrency_cap)) +
          "</td><td>" + ids(w.active, 6) + "</td><td>" + ids(w.awaiting_acceptance, 6) + "</td><td>" + ids(w.queue_eligible, 6) + "</td><td>" + ids(w.blocked_or_hold, 6) + "</td><td>" + ids(w.waiting_on_dependency, 6) + "</td><td>" + val(w.utilization) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<p class="note">Capacity not recorded in the project config is shown as UNKNOWN; utilization is never estimated from it.</p>', { cls: "span-all" }));
      out.push(card("wk-locks", "Shared resource locks", list(P.locks, function (l) { return '<li><div class="row sb"><b>' + esc(l.name || l.id) + "</b>" + tag(l.state) + '</div><div class="small">Capacity ' + val(l.capacity) + " · last event " + dateCell(l.last_event_at) + '</div><div class="small dim">' + esc(l.source || "") + (l.note ? " · " + esc(l.note) : "") + "</div></li>"; }, "No shared resource recorded.")));
      out.push(card("wk-queue", "Eligible now (queue)", "<div>" + ids(P.eligible_now, 40) + '</div><p class="note">Unstarted tasks whose prerequisites are all met. A view only: no status is changed.</p>'));
    } else out.push(notBuilt(D, "wk-none", "Workers"));
    var r = vResources(D, now, ctx); out = out.concat(r.cards);
    return { title: "Workers & capacity", sub: "Who is doing what, shared locks and the queue", cards: out, grid: "grid two" };
  }

  /* ---- Decisions / Gates ---- */
  function vDecisions(D, now, ctx) {
    if (!built(D)) return { title: "Decisions & gates", sub: "", cards: [notBuilt(D, "dg-none", "Decisions")], grid: "grid" };
    var P = PM(D), au = obj(P.authorizations), ap = arr(obj(P.action_center).approved), out = [];
    out.push(card("dg-grants", "Scoped GO grants", genericTable(au.grants) + '<p class="note">Qualifiers: ' + arr(au.qualifiers).map(tag).join(" ") + ". A GO without a qualifier authorizes nothing downstream.</p>", { cls: "span-all" }));
    out.push(card("dg-not", "Not granted", genericTable(au.not_granted)));
    out.push(card("dg-holds", "Holds", genericTable(au.holds)));
    var showAll = ctx.ui.open["dg:all"];
    out.push(card("dg-reg", "Decision register (" + ap.length + ")", '<div class="scroll-x"><table class="t"><thead><tr><th>ID</th><th>Topic</th><th>Status</th><th>GO scope</th><th>Authorized</th><th>Not authorized</th><th>Source</th></tr></thead><tbody>' +
      (showAll ? ap : ap.slice(0, 12)).map(function (a) { return '<tr><td class="mono">' + esc(a.id) + "</td><td>" + esc(a.topic) + "</td><td>" + tag(a.status) + "</td><td>" + tag(a.qualifier) + "</td><td>" + val(a.authorized_scope) + "</td><td>" + val(a.not_authorized) + "</td><td>" + docBtn(a.src, "Source") + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (ap.length > 12 ? '<button class="btn small" type="button" data-toggle="dg:all">' + (showAll ? "Show fewer" : "Show all " + ap.length) + "</button>" : ""), { cls: "span-all" }));
    var hist = arr(D.activity).filter(function (a) { return a.kind === "decision"; }).concat(arr(P.events).filter(function (e) { var n = nodeMap(D)[e.ref]; return n && (n.node_type === "DECISION" || n.node_type === "GATE"); }).map(function (e) { return { at: e.at, ref: e.ref, summary: e.field + ": " + e.from + " → " + e.to }; }));
    out.push(card("dg-hist", "History", list(hist.slice(0, 20), function (h) { return '<li class="small"><b class="mono">' + esc(h.ref || "") + "</b> " + esc(h.summary || "") + ' <span class="dim">' + esc(fmtDT(h.at) || "") + "</span></li>"; }, "No decision change recorded since history started."), { cls: "span-all" }));
    return { title: "Decisions & gates", sub: "What is approved, with the exact GO scope", cards: out, grid: "grid two" };
  }

  /* ---- Milestones / Progress ---- */
  function vMilestones(D, now, ctx) {
    if (!built(D)) return { title: "Milestones & progress", sub: "", cards: [notBuilt(D, "mp-none", "Progress")], grid: "grid" };
    var P = PM(D), M = obj(P.metrics), rec = obj(P.reconciliation), B = bucketsOf(D), out = [], mm = {};
    arr(P.milestones).forEach(function (m) { mm[m.id] = m; });
    var groups = arr(rec.groups), uiOk = groups.every(function (g) { return B.reduce(function (a, k) { return a + (num(obj(g.counts)[k]) || 0); }, 0) === g.executable; });
    var ew = obj(M.effort_weighted_done);
    var PGd = PG(D), sc3 = segCounts(PGd.segments);
    out.push(card("mp-k", "Progress (launch scope)", '<div class="kpis six">' + kpi(obj(M.denominator).launch_executable, "Executable launch tasks", "", "#b3badf") +
      kpi(obj(PGd.engineering_completion).count, "Engineering completion", esc(obj(PGd.engineering_completion).pct) + " % technically ready (incl. accepted)" + ecNote(obj(PGd.engineering_completion)), SEG_COL.TECHNICALLY_READY_PENDING_ACCEPTANCE) +
      kpi(obj(PGd.formal_acceptance).count, "Formal acceptance (DONE)", esc(obj(PGd.formal_acceptance).pct) + " %", SEG_COL.ACCEPTED) + kpi(sc3.TECHNICALLY_READY_PENDING_ACCEPTANCE, "Awaiting acceptance", "technically ready, not DONE", col("QA_PASS")) +
      kpi(sc3.NOT_TECHNICALLY_READY, "Remaining engineering work", "not technically ready", col("PLANNED")) + "</div>" + (hasPG(D) ? segBar(PGd.segments, 18) + progressNote(D) : "") + '<div class="kpis six">' +
      kpi(M.missing_work_estimates, "Missing work estimates", "UNKNOWN, not zero", col("HOLD")) + kpi(M.intentional_zero_effort_rows, "Zero-effort decision/gate rows", "intentional", "#b3badf") + "</div>" +
      '<p class="foot">Effort-weighted DONE ' + val(ew.pct, function (x) { return x + " %"; }) + " (coverage " + val(ew.coverage_tasks) + ") · reconciliation " + tag(rec.ok ? "OK" : "FAIL") + " · UI re-check " + tag(uiOk ? "OK" : "FAIL") + "</p>" +
      more("mp:def", "Definitions", kv([["Denominator", val(obj(M.denominator).rule)], ["DONE rule", esc(JSON.stringify(obj(P.status_mapping).done_rule))], ["Technical readiness", esc(arr(obj(M.technical_ready).buckets).join(" + "))],
        ["Remaining", val(obj(M.remaining_base).note)], ["Buckets", esc(B.join(" · ")) + " (mutually exclusive)"]]), ctx), { cls: "span-all" }));
    if (hasPG(D)) out.push(card("mp-prog", "Progress segments per milestone", '<div class="scroll-x"><table class="t"><thead><tr><th>Group</th><th>Accepted · awaiting acceptance · not technically ready</th><th class="num">Launch tasks</th><th>Equation</th><th>Check</th></tr></thead><tbody>' +
      arr(PGd.by_milestone).map(function (g) { var m = mm[g.group]; return '<tr><td><b class="mono">' + esc(g.group) + "</b>" + (m ? '<div class="small">' + esc(m.name || "") + "</div>" : "") + '</td><td style="min-width:200px">' + segBar(g.segments, 14) + '</td><td class="num">' + esc(g.total) + '</td><td class="mono small">' + esc(g.equation) + "</td><td>" + tag(g.ok ? "OK" : "FAIL") + msRule(g) + "</td></tr>"; }).join("") +
      "</tbody></table></div>", { cls: "span-all" }));
    out.push(card("mp-groups", "Exclusive buckets per milestone", '<div class="scroll-x"><table class="t"><thead><tr><th>Group</th><th>Breakdown</th><th class="num">Executable</th><th>Equation</th><th>Check</th></tr></thead><tbody>' +
      groups.map(function (g) { var m = mm[g.group]; return "<tr><td><b class=\"mono\">" + esc(g.group) + "</b>" + (m ? '<div class="small">' + esc(m.name || "") + '</div><div class="dim small">target ' + esc(m.target || NR) + "</div>" : "") + '</td><td style="min-width:180px">' + stackBar(g.counts, B, 12) + legend(g.counts, B) + '</td><td class="num">' + esc(g.executable) + '</td><td class="mono small">' + esc(g.equation) + "</td><td>" + tag(g.ok ? "OK" : "FAIL") + "</td></tr>"; }).join("") +
      "</tbody></table></div>", { cls: "span-all" }));
    var rs = obj(rec.reported_separately);
    out.push(card("mp-sep", "Reported separately (not in the launch denominator)", kv(Object.keys(rs).map(function (k) { return [label(k) + " (" + arr(rs[k]).length + ")", ids(rs[k], 20)]; }).concat([["Containers not counted", ids(rec.containers_not_counted, 20)]])), { cls: "span-all" }));
    return { title: "Milestones & progress", sub: "Mutually exclusive buckets; every total reconciles to the executable count", cards: out, grid: "grid" };
  }

  /* ---- Timeline / Forecast ---- */
  function vForecast(D, now, ctx) {
    var F = FC(D), out = [], P = PM(D);
    if (!fcEngine(F)) { out.push(card("fc-none", "Forecast", "<p>forecast engine output " + nr() + ' — this snapshot predates the forecast wiring.</p><p class="note">Uncalibrated v1 projections are not shown as P50/P80.</p>', { cls: "span-all" })); return { title: "Timeline & forecast", sub: "", cards: out, grid: "grid" }; }
    var sc = obj(F.scenarios), mi = arr(F.missing_inputs), cov = obj(F.coverage), ef = obj(F.effort);
    if (hasPG(D)) out.push(card("fc-prog", "Progress basis", segBar(PG(D).segments, 16) + '<p class="note">Remaining engineering work = ' + esc(segCounts(PG(D).segments).NOT_TECHNICALLY_READY) + " launch tasks; " + esc(segCounts(PG(D).segments).TECHNICALLY_READY_PENDING_ACCEPTANCE) + " more wait only for acceptance gates (see Quality &amp; acceptance).</p>", { cls: "span-all" }));
    function scen(k) { var s = obj(sc[k]), l = obj(s.launch); return "<tr><td><b>" + esc(label(k)) + "</b></td><td>" + tag(s.status || NR) + "</td><td>" + (l.finish ? dateCell(l.finish) : tag(l.status || s.status || NR)) + '</td><td class="num">' + (num(l.working_days) != null ? esc(l.working_days) : nr()) + "</td></tr>"; }
    out.push(card("fc-status", "Delivery forecast", '<div class="row">' + tag(F.status) + ' <span class="small muted">as of ' + dateCell(F.as_of) + " · " + esc(F.scheduling_mode || "") + "</span></div>" +
      (F.status === "INSUFFICIENT_DATA" ? '<p class="lead t-warn">No delivery date is forecast: ' + mi.length + " required inputs are missing. Nothing is estimated in their place.</p>" : "") +
      '<div class="scroll-x"><table class="t"><thead><tr><th>Scenario</th><th>Status</th><th>Launch finish</th><th class="num">Working days</th></tr></thead><tbody>' + ["optimistic", "base", "conservative"].map(scen).join("") + "</tbody></table></div>" +
      '<p class="foot">Percentiles ' + tag(obj(F.percentiles).status || NR) + (obj(F.percentiles).reason ? " — " + esc(obj(F.percentiles).reason) : "") + " · P50/P80 are shown only when calibrated.</p>", { cls: "span-all" }));
    var showMi = ctx.ui.open["fc:mi"];
    out.push(card("fc-missing", "Missing inputs (" + mi.length + ")", list(showMi ? mi : mi.slice(0, 10), function (m) { return '<li class="small"><span class="mono">' + esc(m.input) + "</span> — " + esc(m.reason) + "</li>"; }, "None.") +
      (mi.length > 10 ? '<button class="btn small" type="button" data-toggle="fc:mi">' + (showMi ? "Show fewer" : "Show all " + mi.length) + "</button>" : "")));
    out.push(card("fc-cov", "Estimate coverage & effort", kv([["Unfinished work", val(cov.unfinished_work)], ["With ETC", val(cov.with_etc)], ["Missing ETC", val(cov.missing_etc)], ["Coverage", val(cov.coverage_task_pct, function (x) { return x + " %"; })],
      ["Known ETC base", val(cov.known_etc_base_h, function (x) { return x + " h"; })], ["ETC o / b / c", ["o", "b", "c"].map(function (k) { return val(obj(ef.ETC_total)[k]); }).join(" / ")], ["Actual cost (AC)", val(ef.AC_total)],
      ["Machine hours (actual)", (function (v) { return typeof v === "number" ? esc(v.toFixed(2)) + " h" : val(v); })(obj(ef.machine_h).actual)], ["Gates with unknown latency", val(ef.gates_unknown_latency)]]) + (cov.note ? '<p class="note">' + esc(cov.note) + "</p>" : "")));
    var base = obj(sc.base), bms = obj(base.milestones), sv = obj(F.schedule_variance);
    out.push(card("fc-ms", "Baseline vs current milestones", '<div class="scroll-x"><table class="t"><thead><tr><th>Milestone</th><th>Baseline target</th><th>Current (base scenario)</th><th>Exit criterion</th></tr></thead><tbody>' +
      arr(P.milestones).map(function (m) { var c = obj(bms[m.id]); return '<tr><td><b class="mono">' + esc(m.id) + "</b> " + esc(m.name || "") + "</td><td>" + val(m.target) + "</td><td>" + (c.finish ? dateCell(c.finish) : tag(c.status || base.status || NR)) + '</td><td class="small">' + val(m.exit) + "</td></tr>"; }).join("") +
      '</tbody></table></div><p class="foot">Schedule variance ' + tag(sv.status || "NOT_COMPUTED") + (num(sv.schedule_variance_days) != null ? " " + esc(sv.schedule_variance_days) + " days" : "") + "</p>", { cls: "span-all" }));
    var dc = obj(base.launch).driving_chain;
    out.push(card("fc-chain", "Driving chain (resource-constrained schedule)", Array.isArray(dc) && dc.length ? '<ol class="chain">' + dc.map(function (s) { return '<li><button class="idlink" type="button" data-node="' + esc(s.task) + '">' + esc(s.task) + '</button> <span class="dim small">' + esc(s.link || "") + " · " + esc(fmtDT(s.start) || "") + " → " + esc(fmtDT(s.finish) || "") + "</span></li>"; }).join("") + "</ol>"
      : '<p class="empty">Not scheduled (' + esc(base.status || NR) + '): no driving chain can be named. Dependency reachability is shown under Blockers and is not a critical path.</p>'));
    var ad = obj(F.adapter);
    out.push(card("fc-method", "Methodology & provenance", more("fc:flags", "Flags (" + arr(F.flags).length + ")", list(arr(F.flags).slice(0, 60), function (f) { return '<li class="small"><span class="mono">' + esc(f.task || "") + "</span> " + tag(f.flag) + " " + esc(f.detail || "") + "</li>"; }), ctx) +
      more("fc:map", "Unit mapping", kv(Object.keys(obj(ad.unit_mapping)).map(function (k) { return [k, esc(ad.unit_mapping[k])]; })), ctx) +
      more("fc:runner", "Runner actuals", kv(Object.keys(obj(ad.runner)).map(function (k) { return [label(k), val(ad.runner[k])]; })), ctx) +
      '<p class="foot">Method ' + val(F.method) + " · config " + val(F.config) + " · register " + (ad.register_sha256 ? '<span class="mono">' + esc(String(ad.register_sha256).slice(0, 12)) + "</span>" : nr()) + (F.legacy_v1 ? " · v1 projection " + tag(obj(F.legacy_v1).label) + " (not displayed)" : "") + "</p>", { cls: "span-all" }));
    return { title: "Timeline & forecast", sub: "When can we deliver? O/B/C scenarios only from recorded inputs", cards: out, grid: "grid two" };
  }

  /* ---- Blockers / Risks ---- */
  function vRisks(D, now, ctx) {
    var out = [];
    if (built(D)) {
      var P = PM(D), bm = {}, rank = topImpact(D); arr(P.blockers).forEach(function (b) { bm[b.id] = b; });
      out.push(card("rk-rank", "Ranked by dependency impact (" + rank.length + ")", '<p class="note">Graph reachability: direct and transitive tasks, tasks this item alone unlocks, and tasks that stay blocked by something else. Not a critical path.</p>' +
        '<div class="scroll-x"><table class="t"><thead><tr><th>#</th><th>Blocker</th><th>Owner</th><th class="num">Direct</th><th class="num">Transitive</th><th>Unlocks at once</th><th>Exclusively blocked</th><th>Multiply blocked</th><th>Unlock action</th></tr></thead><tbody>' +
        rank.map(function (r, i) { var b = obj(bm[r.id]); return '<tr><td class="num">' + (i + 1) + '</td><td><b class="mono">' + esc(r.id) + "</b> " + tag(b.priority || NR) + '<div class="small">' + esc(b.title || "") + '</div><div class="small dim">' + esc(b.node_type || "") + " · " + esc(b.edge_type || "") + "</div></td><td>" + val(r.owner_code) + '</td><td class="num">' + arr(r.direct).length + '</td><td class="num">' + arr(r.transitive).length +
          "</td><td>" + ids(r.immediately_unlockable, 5) + "</td><td>" + ids(r.exclusively_blocked, 5) + "</td><td>" + (arr(r.multiply_blocked).length ? arr(r.multiply_blocked).slice(0, 4).map(function (m) { return '<button class="idlink" type="button" data-node="' + esc(m.id) + '">' + esc(m.id) + '</button> <span class="dim small">also ' + esc(arr(m.other_blockers).join(", ")) + "</span>"; }).join("<br>") : '<span class="dim">none</span>') +
          '</td><td class="small">' + val(r.next_action) + "<br>" + docBtn(r.doc) + "</td></tr>"; }).join("") + "</tbody></table></div>", { cls: "span-all" }));
      var open = arr(P.blockers).filter(function (b) { return b.open; });
      out.push(card("rk-open", "Open gates, decisions & risks (" + open.length + ")", list(open, function (b) { return '<li><div class="row sb"><span class="row">' + tag(b.priority || NR) + ' <b class="mono">' + esc(b.id) + "</b> " + tag(b.node_type) + "</span>" + docBtn(b.doc) + "</div><div>" + esc(b.title) + '</div><div class="small muted">Owner ' + val(b.owner_code) + " · blocks " + ids(b.targets, 6) + " · identified " + val(b.identified) + '</div><div class="small">Next: ' + val(b.next_action) + "</div></li>"; }, "No open blocker.")));
    } else out.push(notBuilt(D, "rk-none", "Blockers"));
    var old = vBlockers(D, now, ctx).cards.filter(function (c) { return c.key === "bl-health" || c.key === "bl-res"; });
    return { title: "Blockers & risks", sub: "What threatens progress, ranked by dependency impact", cards: out.concat(old), grid: "grid two" };
  }

  /* ---- Tracker / Workstreams ---- */
  var TRK_CAP = 25;
  function trkFilter(D, ui) {
    var q = String(ui.q || "").toLowerCase().trim(), f = obj(ui.f);
    return nodes(D).filter(function (n) {
      if (f.bucket && (n.bucket || n.scope) !== f.bucket) return false;
      if (f.prog && (n.progress || "OUT_OF_LAUNCH") !== f.prog) return false;
      if (f.ws && n.workstream !== f.ws) return false;
      if (f.ms && String(n.milestone) !== f.ms) return false;
      if (q && [n.id, n.title, n.status, n.bucket, n.workstream, n.milestone, n.owner_code, n.worker, n.batch].join(" ").toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function opts(vals, all) { return '<option value="">' + esc(all) + "</option>" + vals.map(function (v) { return '<option value="' + esc(v) + '">' + esc(label(v)) + "</option>"; }).join(""); }
  function uniq(a) { var s = []; a.forEach(function (x) { if (x != null && x !== "" && s.indexOf(String(x)) < 0) s.push(String(x)); }); return s.sort(); }
  function vTracker(D, now, ctx) {
    var out = [];
    if (!built(D)) { var w = vWorkstreams(D, now, ctx); return { title: "Tracker & workstreams", sub: w.sub, cards: [notBuilt(D, "tr-none", "Tracker")].concat(w.cards), grid: w.grid }; }
    var N = nodes(D), B = bucketsOf(D), ui = ctx.ui;
    var bks = uniq(N.map(function (n) { return n.bucket || n.scope; })).sort(function (a, b) { return (B.indexOf(a) < 0 ? 99 : B.indexOf(a)) - (B.indexOf(b) < 0 ? 99 : B.indexOf(b)); });
    out.push(card("tr-ctl", "Search & filter", '<div class="filters"><label class="fld"><span>Search</span><input id="trk-q" type="search" autocomplete="off" placeholder="ID, title, owner…" aria-label="Search tasks"></label>' +
      '<label class="fld"><span>Progress</span><select data-f="prog" aria-label="Filter by progress segment"><option value="">All progress</option>' + SEG.concat(["OUT_OF_LAUNCH"]).map(function (k) { return '<option value="' + k + '">' + esc(SEG_SHORT[k] || "Not in launch scope") + "</option>"; }).join("") + "</select></label>" +
      '<label class="fld"><span>Bucket</span><select data-f="bucket" aria-label="Filter by bucket">' + opts(bks, "All buckets") + "</select></label>" +
      '<label class="fld"><span>Workstream</span><select data-f="ws" aria-label="Filter by workstream">' + opts(uniq(N.map(function (n) { return n.workstream; })), "All workstreams") + "</select></label>" +
      '<label class="fld"><span>Milestone</span><select data-f="ms" aria-label="Filter by milestone">' + opts(uniq(N.map(function (n) { return n.milestone; })), "All milestones") + "</select></label></div>", { cls: "span-all" }));
    var rows = trkFilter(D, ui), all = ui.open["tr:all"], shown = all ? rows : rows.slice(0, TRK_CAP);
    out.push(card("tr-res", "Canonical tasks", '<p class="small muted" aria-live="polite">Showing ' + shown.length + " of " + rows.length + " matching (" + N.length + " nodes in the register)</p>" +
      '<div class="scroll-x"><table class="t trk"><thead><tr><th>ID</th><th>Title</th><th>Progress</th><th>Bucket</th><th>Status</th><th>Workstream</th><th>Milestone</th><th>Owner</th><th>Scope</th></tr></thead><tbody>' +
      shown.map(function (n) { return '<tr><td><button class="idlink" type="button" data-node="' + esc(n.id) + '" aria-label="Details ' + esc(n.id) + '">' + esc(n.id) + "</button></td><td>" + esc(n.title) + "</td><td>" + (n.progress ? segTag(n.progress) : '<span class="dim small">not launch</span>') + "</td><td>" + tag(n.bucket || n.scope) + "</td><td>" + tag(n.status) + "</td><td>" + val(n.workstream) + "</td><td>" + val(n.milestone) + "</td><td>" + val(n.owner_code) + "</td><td>" + tag(n.scope) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (rows.length > TRK_CAP ? '<button class="btn small" type="button" data-toggle="tr:all">' + (all ? "Show first " + TRK_CAP : "Show all " + rows.length) + "</button>" : ""), { cls: "span-all" }));
    var ws = workstreams(D).list;
    out.push(card("tr-ws", "Workstreams (" + ws.length + ")", list(ws, function (w) { var c = obj(w.counts); return '<li><div class="row sb"><b>' + esc(w.name || w.id) + '</b><span class="small dim">' + esc(w.total != null ? w.total : arr(w.tasks).length) + " tasks</span></div>" + stackBar(c, Object.keys(c), 8) + legend(c, Object.keys(c)) + "</li>"; }), { cls: "span-all" }));
    return { title: "Tracker & workstreams", sub: "Searchable canonical task register; open any row for the detail drawer", cards: out, grid: "grid" };
  }
  function nodeDetail(D, id) {
    var n = nodeMap(D)[id]; if (!n) return '<p class="empty">' + esc(id) + " is not a node in this snapshot.</p>";
    var P = PM(D), bl = arr(P.blockers).filter(function (b) { return arr(b.targets).indexOf(id) >= 0; }), dependents = nodes(D).filter(function (x) { return arr(x.deps).indexOf(id) >= 0; }).map(function (x) { return x.id; });
    var ac = obj(n.acceptance), ev = arr(P.events).filter(function (e) { return e.ref === id; });
    return "<h2>" + esc(n.title) + "</h2>" + '<div class="row">' + (n.progress ? segTag(n.progress) : "") + tag(n.bucket) + tag(n.status) + tag(n.scope) + tag(n.node_type) + "</div>" +
      kv([["Kind", val(n.kind)], ["Batch", val(n.batch)], ["Milestone", val(n.milestone)], ["Workstream", val(n.workstream)], ["Owner", val(n.owner_code) + " · " + val(n.worker)], ["Lifecycle", val(n.lifecycle)], ["Visual", tag(n.visual)],
        ["Estimate base / conservative", val(n.est_base) + " / " + val(n.est_conservative)], ["Depends on", ids(n.deps, 30)], ["Dependents", ids(dependents, 30)], ["Blocked by", bl.length ? bl.map(function (b) { return esc(b.id) + " " + tag(b.open ? "OPEN" : "RESOLVED"); }).join("<br>") : '<span class="dim">none</span>'],
        ["Scope reason", val(n.scope_reason)]]) +
      "<h3>Acceptance dimensions</h3>" + kv(["technical", "visual", "director", "device", "release"].map(function (k) { return [label(k), tag(ac[k] || NR)]; })) +
      "<h3>History</h3>" + list(ev, function (e) { return '<li class="small">' + esc(e.field) + ": " + esc(e.from) + " → " + esc(e.to) + ' <span class="dim">' + esc(fmtDT(e.at) || "") + "</span></li>"; }, "No change recorded since history started.") +
      '<p class="row">' + docBtn(n.doc ? n.doc + (n.line ? "" : "") : null, "Open source doc") + "</p>";
  }

  /* ---- Quality / Acceptance ---- */
  function vQuality(D, now, ctx) {
    var out = [];
    if (built(D)) {
      var dims = ["technical", "visual", "director", "device", "release"], L = nodes(D).filter(function (n) { return n.scope === "LAUNCH" && n.executable; }), M = {}, vals = [];
      dims.forEach(function (d) { M[d] = {}; L.forEach(function (n) { var v = obj(n.acceptance)[d] || NR; M[d][v] = (M[d][v] || 0) + 1; if (vals.indexOf(v) < 0) vals.push(v); }); });
      if (hasPG(D)) {
        var aq = obj(PM(D).acceptance_queue), qi = arr(aq.items), qall = ctx.ui.open["qa:queue"];
        out.push(card("qa-prog", "Engineering vs formal acceptance", segBar(PG(D).segments, 20) + progressNote(D), { cls: "span-all" }));
        out.push(card("qa-queue", "Acceptance queue (" + qi.length + ")", queueCounts(D) +
          '<div class="scroll-x"><table class="t"><thead><tr><th>#</th><th>Task</th><th>Next gate</th><th>Waits for</th><th>After predecessors</th><th class="num">Dependents</th><th>Milestone</th></tr></thead><tbody>' +
          (qall ? qi : qi.slice(0, 12)).map(function (x) { return '<tr><td class="num">' + esc(x.position) + '</td><td><button class="idlink" type="button" data-node="' + esc(x.id) + '">' + esc(x.id) + '</button><div class="small">' + esc(x.title) + '</div><div class="small dim">' + esc(label(x.status)) + " · visual " + esc(label(x.visual)) + "</div></td><td>" + catTag(x.primary) + '</td><td class="small">' + arr(x.awaits).map(function (a) { return esc(CAT_SHORT[a.category] || a.category) + ": " + esc(a.reason); }).join("<br>") + "</td><td>" + ids(x.after_unaccepted_deps, 4) + '</td><td class="num">' + esc(x.dependents) + "</td><td>" + val(x.milestone) + "</td></tr>"; }).join("") +
          "</tbody></table></div>" + (qi.length > 12 ? '<button class="btn small" type="button" data-toggle="qa:queue">' + (qall ? "Show fewer" : "Show all " + qi.length) + "</button>" : "") +
          more("qa:qrule", "Queue rule", "<p>" + val(aq.rule) + "</p>", ctx), { cls: "span-all" }));
      }
      out.push(card("qa-acc", "Acceptance dimensions (" + L.length + " launch tasks)", '<p class="note">Technical QA, visual, Director, device and release acceptance are distinct; one never implies another.</p>' +
        list(dims, function (d) { return '<li><div class="row sb"><b>' + esc(label(d)) + "</b></div>" + stackBar(M[d], vals, 10) + legend(M[d], vals) + "</li>"; }) +
        more("qa:dod", "Definition of done", kv([["DONE rule", esc(JSON.stringify(obj(PM(D).status_mapping).done_rule))], ["Accepted but not done", esc(JSON.stringify(obj(PM(D).status_mapping).accepted_not_done || NR))]]), ctx), { cls: "span-all" }));
    }
    return { title: "Quality & acceptance", sub: "What has been verified: QA rounds incl. regression locks, visual audits, acceptance per dimension", cards: out.concat(vQA(D, now, ctx).cards), grid: "grid two" };
  }

  /* ---- Sources / Audit ---- */
  function vSources(D, now, ctx) {
    var P = PM(D), s = obj(P.sources), sy = obj(obj(D.meta).sync), out = [], al = alerts(D, now, ctx);
    function src(x) { x = obj(x); return kv([["Path", val(x.path)], ["Revision", x.revision ? '<span class="mono">' + esc(x.revision) + "</span>" : nr()], ["File state", tag(x.file_state || NR)], ["sha256", x.sha256 ? '<span class="mono">' + esc(x.sha256) + "</span>" : nr()]]); }
    out.push(card("so-state", "Snapshot integrity", '<div class="row">' + (al.length ? al.map(function (a) { return tag(a.title.replace(/ /g, "_")); }).join(" ") : tag("OK") + ' <span class="small muted">no STALE / VALIDATION FAILED / SOURCE MISMATCH condition</span>') + "</div>" +
      kv([["Generated at", dateCell(s.generated_at)], ["Sync state", tag(sy.state || NR)], ["Last success", dateCell(sy.last_success)], ["Trigger", val(sy.trigger)], ["Freshness SLA", val(s.freshness_sla_min || sy.stale_after_min, function (x) { return x + " min"; }) + ' <span class="dim small">' + esc(s.freshness_source || "") + "</span>"],
        ["Validation", tag(s.validation || NR)], ["Reconciliation", tag(obj(P.reconciliation).ok === true ? "OK" : obj(P.reconciliation).ok === false ? "FAIL" : NR)], ["Contract", val(obj(D.meta).contract)], ["Skill / config version", val(P.skill_version) + " / " + val(P.config_version)]]), { cls: "span-all" }));
    out.push(card("so-reg", "Canonical register", src(s.register)));
    out.push(card("so-cfg", "Project config", src(s.config)));
    var w = arr(obj(P.validation).warnings), pr = arr(obj(sy.consistency).problems);
    out.push(card("so-val", "Validation warnings (" + w.length + ") & consistency problems (" + pr.length + ")", list(pr, function (p) { return '<li class="small t-warn">' + esc(p) + "</li>"; }, "No consistency problem.") + more("so:w", "Validation warnings", list(w, function (x) { return '<li class="small">' + esc(x) + "</li>"; }, "None."), ctx)));
    out.push(card("so-unk", "Config UNKNOWNs (" + arr(P.config_unknowns).length + ")", list(P.config_unknowns, function (u) { return '<li class="small mono">' + esc(u) + "</li>"; }, "None.")));
    out.push(card("so-files", "Published sources (" + arr(sy.sources).length + ")", '<div class="scroll-x"><table class="t"><thead><tr><th>Path</th><th>sha256</th><th>Modified</th></tr></thead><tbody>' +
      arr(sy.sources).slice(0, ctx.ui.open["so:all"] ? 500 : 12).map(function (x) { return '<tr><td class="mono">' + esc(x.path) + '</td><td class="mono">' + esc(String(x.sha256 || "").slice(0, 16)) + "</td><td>" + (num(x.mtime) != null ? esc(fmtDT(new Date(x.mtime * 1000).toISOString())) : nr()) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      (arr(sy.sources).length > 12 ? '<button class="btn small" type="button" data-toggle="so:all">' + (ctx.ui.open["so:all"] ? "Show fewer" : "Show all " + arr(sy.sources).length) + "</button>" : ""), { cls: "span-all" }));
    out.push(card("so-log", "Change log (" + arr(P.events).length + ")", list(arr(P.events).slice(0, 30), function (e) { return '<li class="small"><b class="mono">' + esc(e.ref) + "</b> " + esc(e.field) + ": " + esc(e.from) + " → " + esc(e.to) + ' <span class="dim">' + esc(fmtDT(e.at) || "") + " · " + esc(e.source_revision || "") + "</span></li>"; }, "No change recorded since the append-only log started.") + '<a class="btn small" href="#activity">Activity feed</a>', { cls: "span-all" }));
    return { title: "Sources & audit", sub: "Can the numbers be trusted? Revision, hashes, validation, reconciliation, change log", cards: out, grid: "grid two" };
  }

  var VIEWS = [
    { id: "overview", name: "Mission Control", short: "Mission", fn: vMission, icon: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>' },
    { id: "actions", name: "Action Center", short: "Actions", fn: vActions, icon: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 15-5-5 1.4-1.4 3.6 3.6 7.6-7.6L20 8z"/>' },
    { id: "workers", name: "Workers & capacity", short: "Workers", fn: vWorkers, icon: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3 0-8 1.5-8 4.5V21h16v-2.5c0-3-5-4.5-8-4.5z"/>' },
    { id: "decisions", name: "Decisions & gates", short: "Gates", fn: vDecisions, icon: '<path d="M4 4h16v4H4zm2 6h12v10H6zm3 3v2h6v-2z"/>' },
    { id: "milestones", name: "Milestones & progress", short: "Progress", fn: vMilestones, icon: '<path d="M5 3v18h2v-7h11l-2-3.5L18 7H7V3z"/>' },
    { id: "timeline", name: "Timeline & forecast", short: "Forecast", fn: vForecast, icon: '<path d="M3 5h18v2H3zm2 4h6v10H5zm8 4h6v6h-6z"/>' },
    { id: "blockers", name: "Blockers & risks", short: "Blockers", fn: vRisks, icon: '<path d="M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z"/>' },
    { id: "tracker", name: "Tracker & workstreams", short: "Tracker", fn: vTracker, icon: '<path d="M4 6h16v2H4zm0 5h10v2H4zm0 5h13v2H4z"/>' },
    { id: "quality", name: "Quality & acceptance", short: "Quality", fn: vQuality, icon: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>' },
    { id: "sources", name: "Sources & audit", short: "Sources", fn: vSources, icon: '<path d="M6 2h9l5 5v15H6zm8 1v5h5M9 13h8v2H9zm0 4h8v2H9z"/>' },
    { id: "release", name: "Release management", short: "Release", fn: vRelease, icon: '<path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 18h8l-1 4H9z"/>' },
    { id: "activity", name: "Activity", short: "Feed", fn: vActivity, icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>' }
  ];
  var ALIAS = { workstreams: "tracker", qa: "quality", resources: "workers" };
  function renderView(id, D, now, ctx) {
    ctx = ctx || {}; ctx.ui = ctx.ui || { open: {} }; ctx.ui.open = ctx.ui.open || {};
    id = ALIAS[id] || id;
    var v = VIEWS.filter(function (x) { return x.id === id; })[0] || VIEWS[0], r = v.fn(D || {}, now || Date.now(), ctx);
    return { id: v.id, title: r.title, sub: r.sub, grid: r.grid, cards: r.cards };
  }
  function bannerHtml(D, now, ctx) {
    return alerts(D, now, ctx).map(function (x) { return '<div class="banner ' + x.cls + '" data-alert="' + esc(x.title) + '"><b>' + esc(x.title) + "</b> — " + esc(x.msg) + "</div>"; }).join("");
  }
  function topMetaHtml(D, now, ctx) {
    var sy = syncInfo(D, now, ctx && ctx.fetchErr), h = obj(D.health).value;
    return '<span class="pill" style="color:' + col(sy.state) + '" title="Data sync state">' + esc(sy.state === NR ? "SYNC " + NR : sy.state) + "</span>" +
      (h ? '<span class="pill" style="color:' + col(h) + '" title="Project health">' + esc(h) + "</span>" : "") +
      '<span class="small muted">' + esc(sy.last_success ? "synced " + ago(sy.last_success, now) : "") + "</span>";
  }
  var API = { alerts: alerts, nodeDetail: nodeDetail, provLine: provLine, renderView: renderView, md: md, VIEWS: VIEWS, bannerHtml: bannerHtml, topMetaHtml: topMetaHtml, esc: esc, resolveDoc: resolveDoc };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; return; }

  /* ---------- browser runtime ---------- */
  var doc = root.document, $ = function (s) { return doc.querySelector(s); };
  var STATIC = !!doc.querySelector('meta[name="rmct-static"]');
  var dm = /[?&]data=([\w.-]+\.json)(?:&|$)/.exec(root.location.search || "");
  var SRC = dm ? dm[1] : STATIC ? "data/dashboard.json" : "/api/dashboard";
  var S = { D: null, raw: "", fetchErr: null, fetchedAt: null, ui: { open: {}, filter: "all" }, prev: {}, view: null, login: false };
  function ctx() { return { fetchErr: S.fetchErr, fetchedAt: S.fetchedAt, ui: S.ui }; }
  function navHtml(cur, mobile) { return VIEWS.map(function (v) { return '<a href="#' + v.id + '"' + (v.id === cur ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"' + (v.id === "activity" ? ' style="fill:none;stroke:currentColor;stroke-width:2"' : "") + ">" + v.icon + "</svg>" + esc(mobile ? v.short : v.name) + "</a>"; }).join(""); }
  function cur() { var h = (root.location.hash || "").slice(1); h = ALIAS[h] || h; return VIEWS.some(function (v) { return v.id === h; }) ? h : "overview"; }
  function render(force) {
    if (!S.D) return;
    var now = Date.now(), id = cur(), main = $("#main"), r = renderView(id, S.D, now, ctx());
    $("#top-meta").innerHTML = topMetaHtml(S.D, now, ctx());
    var bh = bannerHtml(S.D, now, ctx()), bn = $("#banner"); if (bn.innerHTML !== bh) bn.innerHTML = bh; bn.hidden = !bh;
    if (force || S.view !== id) {
      $("#tabs").innerHTML = navHtml(id, false); $("#bnav").innerHTML = navHtml(id, true);
      main.innerHTML = '<div class="view-head"><h1>' + esc(r.title) + "</h1><p>" + r.sub + '</p></div><div class="' + r.grid + '" id="cards"></div>';
      S.prev = {}; S.view = id; doc.title = r.title + " · Renewable Manager Command Center";
    }
    var pf = $("#pfoot"); if (pf) { var ph = provLine(S.D, now) + ' · <a href="#sources">Details</a>'; if (pf.innerHTML !== ph) pf.innerHTML = ph; }
    var host = $("#cards"), keys = r.cards.map(function (c) { return c.key; }), existing = Array.prototype.slice.call(host.children);
    var same = existing.length === keys.length && existing.every(function (el, i) { return el.getAttribute("data-key") === keys[i]; });
    if (!same) { host.innerHTML = r.cards.map(function (c) { return c.html; }).join(""); S.prev = {}; r.cards.forEach(function (c) { S.prev[c.key] = c.html; }); return; }
    r.cards.forEach(function (c, i) { if (S.prev[c.key] !== c.html) { var t = doc.createElement("template"); t.innerHTML = c.html; host.replaceChild(t.content.firstElementChild, existing[i]); S.prev[c.key] = c.html; } });
  }
  function load() {
    var opt = { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } };
    return root.fetch(SRC, opt).then(function (res) {
      if (res.status === 401 && !STATIC) { showLogin(); throw null; }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (txt) {
      S.fetchedAt = Date.now(); S.fetchErr = null;
      if (txt !== S.raw) { S.D = JSON.parse(txt); S.raw = txt; }
      render(false);
    }).catch(function (e) {
      if (e === null) return;
      S.fetchErr = (e && e.message) || "network error";
      if (S.D) render(false); else $("#main").innerHTML = '<div class="banner failed"><b>Sync FAILED</b> — the dashboard data could not be loaded (' + esc(S.fetchErr) + "). It will retry every 60 s.</div>";
    });
  }
  function showLogin(msg) {
    S.login = true;
    $("#main").innerHTML = '<form class="login card" id="login"><h2>Sign in</h2>' + (msg ? '<p class="t-warn">' + esc(msg) + "</p>" : "") +
      '<input name="u" autocomplete="username" placeholder="Username" required><input name="p" type="password" autocomplete="current-password" placeholder="Password" required><button class="btn primary" type="submit">Sign in</button></form>';
    $("#login").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target;
      root.fetch("/api/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-RMCT": "1" }, body: JSON.stringify({ username: f.u.value, password: f.p.value }) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); S.login = false; S.view = null; return load(); }).catch(function () { showLogin("Sign-in failed."); });
    });
  }

  /* doc viewer */
  var lastFocus = null;
  function openDoc(p) {
    var v = $("#viewer"), body = $("#viewer-body"), r = resolveDoc(S.D, p);
    lastFocus = doc.activeElement; $("#viewer-path").textContent = String(p).replace(/:\d+$/, "") + (r.indexed ? "" : "  (not in docs index)");   // repo path (published copy lives under docs/<repo path>)
    body.innerHTML = '<p class="dim">Loading…</p>'; v.hidden = false; $("#viewer-close").focus();
    root.fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.text(); })
      .then(function (t) { body.innerHTML = md(t, String(p).replace(/:\d+$/, "")); body.scrollTop = 0; })
      .catch(function (e) { body.innerHTML = '<div class="banner failed"><b>Doc not available</b> — ' + esc(r.url) + " (" + esc(e.message) + "). " + (r.indexed ? "" : "This path is not listed in docs.files, so it may not be published.") + "</div>"; });
  }
  function openNode(id) {
    lastFocus = doc.activeElement; $("#viewer-path").textContent = "Task " + id; $("#viewer-body").innerHTML = nodeDetail(S.D, id);
    $("#viewer").hidden = false; $("#viewer-body").scrollTop = 0; $("#viewer-close").focus();
  }
  doc.addEventListener("input", function (ev) { if (ev.target.id === "trk-q") { S.ui.q = ev.target.value; render(false); } });
  doc.addEventListener("change", function (ev) { var f = ev.target.getAttribute && ev.target.getAttribute("data-f"); if (f) { S.ui.f = S.ui.f || {}; S.ui.f[f] = ev.target.value; render(false); } });
  function closeDoc() { $("#viewer").hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  doc.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("[data-doc],[data-node],[data-toggle],[data-filter],#viewer-close") : null;
    if (!t) { if (ev.target.id === "viewer") closeDoc(); return; }
    if (t.id === "viewer-close") return closeDoc();
    if (t.hasAttribute("data-doc")) { ev.preventDefault(); return openDoc(t.getAttribute("data-doc")); }
    if (t.hasAttribute("data-node")) { ev.preventDefault(); return openNode(t.getAttribute("data-node")); }
    if (t.hasAttribute("data-toggle")) { var k = t.getAttribute("data-toggle"); S.ui.open[k] = !S.ui.open[k]; return render(false); }
    if (t.hasAttribute("data-filter")) { S.ui.filter = t.getAttribute("data-filter"); return render(false); }
  });
  doc.addEventListener("toggle", function (ev) { var k = ev.target.getAttribute && ev.target.getAttribute("data-open"); if (k) { S.ui.open[k] = ev.target.open; var c = ev.target.closest("[data-key]"); if (c) S.prev[c.getAttribute("data-key")] = null; } }, true);
  doc.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !$("#viewer").hidden) closeDoc(); });
  root.addEventListener("hashchange", function () { S.ui.q = ""; S.ui.f = {}; render(true); root.scrollTo(0, 0); });
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) load(); });
  setInterval(function () { if (!doc.hidden && !S.login) load(); }, 60000);
  $("#tabs").innerHTML = navHtml(cur(), false); $("#bnav").innerHTML = navHtml(cur(), true);
  load();
})(typeof window !== "undefined" ? window : this);
