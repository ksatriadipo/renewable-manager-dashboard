/* Renewable Manager Command Center — vanilla client. Reads data/dashboard.json (static GitHub Pages mode) or
   /api/dashboard (VPS server mode). Contract: docs/DATA_CONTRACT.md (v2); v1 keys are a labelled fallback.
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

  var COLORS = { NOT_STARTED: "#9aa3cf", READY: "#7cc4ff", IN_PROGRESS: "#45e3d4", IMPLEMENTED: "#b195ff", TESTED: "#6aa8ff", ACCEPTED: "#9be7b8",
    VISUALLY_ACCEPTED: "#2fd3c3", DONE: "#5fe39a", BLOCKED: "#ff6b78", ON_HOLD: "#ffb454", DEFERRED: "#d9b3ff", CANCELLED: "#8f96bb", REJECTED: "#ff8fa0",
    NEEDS_REWORK: "#ff9f5a", NEEDS_RECHECK: "#ffb454", NOT_TESTED: "#9aa3cf", FAIL: "#ff6b78", PASS: "#5fe39a", OK: "#5fe39a", OPEN: "#ff6b78", RESOLVED: "#5fe39a",
    P0: "#ff6b78", P1: "#ffb454", P2: "#f6c85a", P3: "#9aa3cf", FRESH: "#5fe39a", STALE: "#ffb454", FAILED: "#ff6b78", RED: "#ff6b78", AMBER: "#ffb454", GREEN: "#5fe39a", PAUSED: "#ffb454" };
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
      identified: r.identified_at, status: r.status, active: r.status !== "RESOLVED", resolved: NR, next_action: r.plan || NR, doc: docPathOf(r), type: r.type, severity: r.severity, task: r.task_id }; }) };
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
  function kpi(v, l, s, color) { return '<div class="kpi"><div class="v"' + (color ? ' style="color:' + color + '"' : "") + ">" + (isNR(v) ? nr(v) : esc(v)) + '</div><div class="l">' + esc(l) + "</div>" + (s ? '<div class="s">' + s + "</div>" : "") + "</div>"; }
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

  /* ---------- C: milestones & timeline ---------- */
  function msDates(D, m) {
    var f = obj(obj(obj(D.forecast).per_milestone)[m.id]);
    return { baseline: m.baseline || m.planned_p50 || null, baseline80: m.baseline_p80 || m.planned_p80 || null, actual: m.actual || null,
      optimistic: m.optimistic || f.best_date || null, provisional: m.provisional || f.p50_date || null, provisional80: m.provisional_p80 || f.p80_date || null };
  }
  function timelineSvg(D, ms, now) {
    var pts = []; ms.forEach(function (m) { var d = msDates(D, m); Object.keys(d).forEach(function (k) { var t = ts(d[k]); if (t != null) pts.push(t); }); });
    if (!pts.length) return '<p class="empty">No milestone dates recorded.</p>';
    pts.push(now); var lo = Math.min.apply(null, pts) - 864e5, hi = Math.max.apply(null, pts) + 864e5;
    var W = 640, padL = 12, padR = 12, rowH = 46, H = 30 + ms.length * rowH;
    function x(t) { return padL + (W - padL - padR) * (t - lo) / (hi - lo); }
    var g = [], days = Math.round((hi - lo) / 864e5), step = days > 40 ? 7 : days > 14 ? 3 : 1;
    for (var t = lo - (lo % 864e5) + 864e5, i = 0; t < hi; t += 864e5, i++) if (i % step === 0) {
      g.push('<line x1="' + x(t) + '" x2="' + x(t) + '" y1="18" y2="' + H + '" stroke="rgba(150,168,255,.10)"/><text x="' + x(t) + '" y="12" text-anchor="middle">' + esc(fmtDate(new Date(t).toISOString().slice(0, 10)).replace(/ \d{4}$/, "")) + "</text>");
    }
    g.push('<line x1="' + x(now) + '" x2="' + x(now) + '" y1="16" y2="' + H + '" stroke="#45e3d4" stroke-dasharray="3 3"/>');
    ms.forEach(function (m, i) {
      var d = msDates(D, m), y = 30 + i * rowH, yy = y + 26;
      g.push('<text x="' + padL + '" y="' + (y + 8) + '" style="fill:#eef1ff;font-weight:800">' + esc(m.id + " · " + (m.name || "")).slice(0, 70) + "</text>");
      g.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(150,168,255,.18)"/>');
      var b = ts(d.baseline), b8 = ts(d.baseline80), p = ts(d.provisional), p8 = ts(d.provisional80), o = ts(d.optimistic), a = ts(d.actual);
      if (b != null && b8 != null && b8 > b) g.push('<line x1="' + x(b) + '" x2="' + x(b8) + '" y1="' + (yy - 7) + '" y2="' + (yy - 7) + '" stroke="#eef1ff" stroke-width="2" opacity=".5"/>');
      if (p != null && p8 != null && p8 > p) g.push('<rect x="' + x(p) + '" width="' + (x(p8) - x(p)) + '" y="' + (yy - 4) + '" height="8" rx="4" fill="rgba(246,200,90,.35)"/>');
      if (b != null) g.push('<path d="M' + x(b) + " " + (yy - 13) + " l6 6 l-6 6 l-6 -6 z\" fill=\"#0b1030\" stroke=\"#eef1ff\" stroke-width=\"2\"><title>Baseline " + esc(d.baseline) + "</title></path>");
      if (o != null) g.push('<circle cx="' + x(o) + '" cy="' + yy + '" r="5" fill="none" stroke="#f6c85a" stroke-width="2"><title>Optimistic ' + esc(d.optimistic) + "</title></circle>");
      if (p != null) g.push('<circle cx="' + x(p) + '" cy="' + yy + '" r="5" fill="#f6c85a"><title>Provisional ' + esc(d.provisional) + "</title></circle>");
      if (a != null) g.push('<rect x="' + (x(a) - 6) + '" y="' + (yy - 6) + '" width="12" height="12" rx="2" fill="#5fe39a"><title>Actual ' + esc(d.actual) + "</title></rect>");
    });
    return '<div class="scroll-x"><svg class="chart" viewBox="0 0 ' + W + " " + H + '" style="min-width:520px" role="img" aria-label="Milestone timeline">' + g.join("") + "</svg></div>" +
      '<div class="legend"><span><svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 l6 6 l-6 6 l-6 -6z" fill="none" stroke="#eef1ff" stroke-width="2"/></svg>Baseline (planned)</span><span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#f6c85a" stroke-width="2"/></svg>Optimistic (forecast best)</span><span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#f6c85a"/></svg>Provisional (forecast P50, bar to P80)</span><span>' + sw("#5fe39a") + "Actual</span><span>" + sw("#45e3d4") + "Today</span></div>";
  }
  function vTimeline(D, now) {
    var ms = arr(D.milestones), fc = obj(D.forecast), cp = obj(D.critical_path), out = [];
    out.push(card("tl-chart", "Milestone timeline", timelineSvg(D, ms, now) + '<p class="note">Forecast label: ' + val(fc.label) + " · resume assumption " + val(fc.resume_assumption) + ". Optimistic and provisional dates are estimates, not commitments.</p>", { cls: "span-all" }));
    out.push(card("tl-table", "Baseline vs actual vs forecast", '<div class="scroll-x"><table class="t"><thead><tr><th>Milestone</th><th>Progress</th><th>Baseline</th><th>Actual</th><th>Optimistic</th><th>Provisional</th><th>Doc</th></tr></thead><tbody>' +
      ms.map(function (m) { var d = msDates(D, m); return "<tr><td><b>" + esc(m.id) + "</b> " + esc(m.name || "") + "</td><td>" + (m.complete ? tag("DONE") : esc((m.pct_accepted != null ? m.pct_accepted : "?") + "% acc · " + (m.pct_tested != null ? m.pct_tested : "?") + "% tested")) +
        "</td><td>" + dateCell(d.baseline) + (d.baseline80 && d.baseline80 !== d.baseline ? '<div class="dim small">P80 ' + dateCell(d.baseline80) + "</div>" : "") + "</td><td>" + dateCell(d.actual) + "</td><td>" + dateCell(d.optimistic) +
        "</td><td>" + dateCell(d.provisional) + (d.provisional80 ? '<div class="dim small">P80 ' + dateCell(d.provisional80) + "</div>" : "") + "</td><td>" + docBtn(docPathOf(m), "Doc") + "</td></tr>"; }).join("") +
      "</tbody></table></div>", { cls: "span-all" }));
    out.push(card("tl-cp", "Critical path", '<div class="small">Length ' + val(num(cp.days_p50), function (x) { return x + " working days (P50, ESTIMATED)"; }) + '</div><div class="row" style="margin-top:8px">' +
      (arr(cp.path).length ? arr(cp.path).map(function (id) { var t = arr(D.tasks).filter(function (x) { return x.id === id; })[0]; return '<span class="tag" style="color:' + col(t && t.status) + '">' + esc(id) + "</span>"; }).join(" ") : nr()) + "</div>"));
    out.push(card("tl-assume", "Forecast assumptions", list(fc.assumptions || fc.method || [], function (a) { return "<li class=\"small\">" + esc(a) + "</li>"; }, "No assumption recorded.")));
    return { title: "Milestones & timeline", sub: "Baseline = planned record · Actual = recorded finish · Optimistic / Provisional = forecast (ESTIMATED)", cards: out, grid: "grid two" };
  }

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
      rounds = qa.rounds.map(function (r) { return { id: r.id, date: r.date, em: r.editmode, build: r.build, uidev: r.uidev, perf: r.perfshot, doc: r.doc, v2: true }; });
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
    function perfCell(p) { return p && typeof p === "object" ? "pass " + esc(p.pass) + " · fail " + esc(p.fail) + " · precond " + esc(p.precondition_fail) : nr(); }
    out.push(card("qa-rounds", "Rounds", '<div class="scroll-x"><table class="t"><thead><tr><th>Round</th><th>Date</th><th>EditMode pass/fail</th><th>Build</th><th>UI dev</th><th>PerfShot</th><th>Doc</th></tr></thead><tbody>' +
      rounds.slice(0, ctx.ui.open["qa:all"] ? 400 : 15).map(function (r) { return '<tr><td class="mono">' + esc(r.id) + "</td><td>" + dateCell(r.date) + "</td><td>" + emCell(r.em) + "</td><td>" + (r.build ? tag(r.build) : nr()) + "</td><td>" + uiCell(r.uidev) + "</td><td>" + perfCell(r.perf) + "</td><td>" + docBtn(r.doc, "Doc") + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (rounds.length > 15 ? '<button class="btn small" type="button" data-toggle="qa:all">' + (ctx.ui.open["qa:all"] ? "Show latest 15" : "Show all " + rounds.length) + "</button>" : "") + (qa ? "" : fallbackNote("qa.rounds")), { cls: "span-all" }));
    var fails = [];
    rounds.forEach(function (r) {
      if (r.em && r.em.fail) fails.push({ id: r.id, date: r.date, what: "EditMode " + r.em.fail + " failed", doc: r.doc });
      if (r.build === "FAIL") fails.push({ id: r.id, date: r.date, what: "Build failed", doc: r.doc });
      if (r.perf && (r.perf.fail || r.perf.precondition_fail)) fails.push({ id: r.id, date: r.date, what: "PerfShot fail " + (r.perf.fail || 0) + " · precondition fail " + (r.perf.precondition_fail || 0), doc: r.doc });
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

  var VIEWS = [
    { id: "overview", name: "Executive overview", short: "Overview", fn: vOverview, icon: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>' },
    { id: "workstreams", name: "Workstreams", short: "Streams", fn: vWorkstreams, icon: '<path d="M4 6h16v2H4zm0 5h10v2H4zm0 5h13v2H4z"/>' },
    { id: "timeline", name: "Milestones & timeline", short: "Timeline", fn: vTimeline, icon: '<path d="M5 3v18h2V3zm4 3h11l-2 3 2 3H9z"/>' },
    { id: "qa", name: "Engineering & QA", short: "QA", fn: vQA, icon: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>' },
    { id: "blockers", name: "Blockers & risks", short: "Blockers", fn: vBlockers, icon: '<path d="M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z"/>' },
    { id: "resources", name: "Resources & agents", short: "Agents", fn: vResources, icon: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3 0-8 1.5-8 4.5V21h16v-2.5c0-3-5-4.5-8-4.5z"/>' },
    { id: "activity", name: "Activity", short: "Feed", fn: vActivity, icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>' }
  ];
  function renderView(id, D, now, ctx) {
    ctx = ctx || {}; ctx.ui = ctx.ui || { open: {} }; ctx.ui.open = ctx.ui.open || {};
    var v = VIEWS.filter(function (x) { return x.id === id; })[0] || VIEWS[0], r = v.fn(D || {}, now || Date.now(), ctx);
    return { id: v.id, title: r.title, sub: r.sub, grid: r.grid, cards: r.cards };
  }
  function bannerHtml(D, now, ctx) {
    var sy = syncInfo(D, now, ctx && ctx.fetchErr);
    if (sy.state !== "STALE" && sy.state !== "FAILED") return "";
    var cls = sy.state === "FAILED" ? "failed" : "stale", msg = sy.problems.slice();
    if (sy.state === "FAILED" && sy.error && msg.indexOf(sy.error) < 0) msg.push("Sync error: " + sy.error);
    if (!msg.length) msg.push(sy.state === "FAILED" ? "The last data sync failed." : "Data may be out of date.");
    return '<div class="banner ' + cls + '"><b>' + (sy.state === "FAILED" ? "Sync FAILED" : "Data STALE") + "</b> — last successful sync " + (fmtDT(sy.last_success) ? esc(fmtDT(sy.last_success)) : nr()) + ". " + msg.map(esc).join(" ") + "</div>";
  }
  function topMetaHtml(D, now, ctx) {
    var sy = syncInfo(D, now, ctx && ctx.fetchErr), h = obj(D.health).value;
    return '<span class="pill" style="color:' + col(sy.state) + '" title="Data sync state">' + esc(sy.state === NR ? "SYNC " + NR : sy.state) + "</span>" +
      (h ? '<span class="pill" style="color:' + col(h) + '" title="Project health">' + esc(h) + "</span>" : "") +
      '<span class="small muted">' + esc(sy.last_success ? "synced " + ago(sy.last_success, now) : "") + "</span>";
  }
  var API = { renderView: renderView, md: md, VIEWS: VIEWS, bannerHtml: bannerHtml, topMetaHtml: topMetaHtml, esc: esc, resolveDoc: resolveDoc };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; return; }

  /* ---------- browser runtime ---------- */
  var doc = root.document, $ = function (s) { return doc.querySelector(s); };
  var STATIC = !!doc.querySelector('meta[name="rmct-static"]');
  var dm = /[?&]data=([\w.-]+\.json)(?:&|$)/.exec(root.location.search || "");
  var SRC = dm ? dm[1] : STATIC ? "data/dashboard.json" : "/api/dashboard";
  var S = { D: null, raw: "", fetchErr: null, fetchedAt: null, ui: { open: {}, filter: "all" }, prev: {}, view: null, login: false };
  function ctx() { return { fetchErr: S.fetchErr, fetchedAt: S.fetchedAt, ui: S.ui }; }
  function navHtml(cur, mobile) { return VIEWS.map(function (v) { return '<a href="#' + v.id + '"' + (v.id === cur ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"' + (v.id === "activity" ? ' style="fill:none;stroke:currentColor;stroke-width:2"' : "") + ">" + v.icon + "</svg>" + esc(mobile ? v.short : v.name) + "</a>"; }).join(""); }
  function cur() { var h = (root.location.hash || "").slice(1); return VIEWS.some(function (v) { return v.id === h; }) ? h : "overview"; }
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
    lastFocus = doc.activeElement; $("#viewer-path").textContent = r.url + (r.indexed ? "" : "  (not in docs index)");
    body.innerHTML = '<p class="dim">Loading…</p>'; v.hidden = false; $("#viewer-close").focus();
    root.fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.text(); })
      .then(function (t) { body.innerHTML = md(t, String(p).replace(/:\d+$/, "")); body.scrollTop = 0; })
      .catch(function (e) { body.innerHTML = '<div class="banner failed"><b>Doc not available</b> — ' + esc(r.url) + " (" + esc(e.message) + "). " + (r.indexed ? "" : "This path is not listed in docs.files, so it may not be published.") + "</div>"; });
  }
  function closeDoc() { $("#viewer").hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  doc.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("[data-doc],[data-toggle],[data-filter],#viewer-close") : null;
    if (!t) { if (ev.target.id === "viewer") closeDoc(); return; }
    if (t.id === "viewer-close") return closeDoc();
    if (t.hasAttribute("data-doc")) { ev.preventDefault(); return openDoc(t.getAttribute("data-doc")); }
    if (t.hasAttribute("data-toggle")) { var k = t.getAttribute("data-toggle"); S.ui.open[k] = !S.ui.open[k]; return render(false); }
    if (t.hasAttribute("data-filter")) { S.ui.filter = t.getAttribute("data-filter"); return render(false); }
  });
  doc.addEventListener("toggle", function (ev) { var k = ev.target.getAttribute && ev.target.getAttribute("data-open"); if (k) { S.ui.open[k] = ev.target.open; var c = ev.target.closest("[data-key]"); if (c) S.prev[c.getAttribute("data-key")] = null; } }, true);
  doc.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !$("#viewer").hidden) closeDoc(); });
  root.addEventListener("hashchange", function () { render(true); root.scrollTo(0, 0); });
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) load(); });
  setInterval(function () { if (!doc.hidden && !S.login) load(); }, 60000);
  $("#tabs").innerHTML = navHtml(cur(), false); $("#bnav").innerHTML = navHtml(cur(), true);
  load();
})(typeof window !== "undefined" ? window : this);
