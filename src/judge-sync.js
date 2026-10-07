// judge-sync.js — the Judge's connection to the account backend.
//
// Judges sign in against COMPOSE's PocketBase (https://compose.tstephen.com; the
// routes, hooks and collections are in Vrier/compose, server/pb_hooks/dace.pb.js
// and migrations 1751700008 + 1751700009). Every act of judging is APPENDED to
// the `dace_events` collection — one small request per keypress, queued and sent
// in order, retried with back-off — and never edited afterwards (PLAN.md,
// "Judgement data"). The server keeps a per-(judge, predicate) cache of the
// judge's current state in `dace_judgements`, which this module reads on sign-in:
//   { v: 2, r: { <feature>: <response> }, flags: { <feature>: true },
//     t: { <feature>: <ISO time> }, notes: { <feature>: "…" }, sentence, nominal }
// Changes are applied to that state here at once (the server applies the same
// event to its copy), so the page never waits for the network. Nothing is kept in
// localStorage except the SDK's own auth token, so two accounts or devices never mix.
//
// Loaded before judge-app.jsx; both share the page's global scope, so everything
// here is namespaced under window.DACE_SYNC and no other top-level name is declared.

window.DACE_SYNC = (function () {
  const DEFAULT_BASE = "https://compose.tstephen.com";
  // ?pb=http://127.0.0.1:8090 points a local preview at a dev PocketBase
  const base = new URLSearchParams(window.location.search).get("pb") || DEFAULT_BASE;
  const pb = new PocketBase(base);
  pb.autoCancellation(false);

  const RESPONSES = ["acceptable", "marginal", "unacceptable", "cant_judge"];
  const records = {};  // verb -> cache data (format v2)
  const queue = [];    // events not yet on the server, oldest first
  let flushing = false, failed = false, rejected = 0, attempt = 0, timer = null;
  const listeners = new Set();

  function status() { return { pending: queue.length, failed, rejected, online: navigator.onLine !== false }; }
  function emit() { for (const l of listeners) { try { l(status()); } catch (e) { /* listener error */ } } }

  // ---- auth --------------------------------------------------------------
  function user() {
    const r = pb.authStore.isValid && pb.authStore.record;
    return r ? {
      id: r.id, email: r.email, judge: !!r.judge, admin: !!r.dace_admin, code: r.judge_code || "",
      variety: r.variety || "", linguist: !!r.linguist, consent: !!r.consent_publish, profileDone: !!r.profile_done,
    } : null;
  }
  async function refresh() {
    // re-validate the stored token and pick up flag changes (judge / dace_admin / code)
    if (!pb.authStore.isValid) return null;
    try { await pb.collection("users").authRefresh(); }
    catch (e) { if (e && (e.status === 401 || e.status === 403 || e.status === 404)) pb.authStore.clear(); }
    return user();
  }
  async function login(email, password) {
    await pb.collection("users").authWithPassword(email.trim(), password);
    return user();
  }
  async function register(email, password, inviteCode) {
    const r = await fetch(base + "/api/dace/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, inviteCode: inviteCode.trim() }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Registration failed");
    return login(email, password);
  }
  function logout() {
    pb.authStore.clear();
    for (const k of Object.keys(records)) delete records[k];
    queue.length = 0; failed = false; rejected = 0; attempt = 0;
    emit();
  }
  // the judge's own profile (variety of English, linguist, consent to publish)
  async function saveProfile(fields) {
    const u = user();
    if (!u) throw new Error("not signed in");
    const rec = await pb.collection("users").update(u.id, {
      variety: fields.variety, linguist: !!fields.linguist, consent_publish: !!fields.consent, profile_done: true,
    });
    pb.authStore.save(pb.authStore.token, rec);
    return user();
  }
  function errorMessage(e) {
    if (e && e.response && e.response.message) return e.response.message;
    if (e && e.status === 0) return "Could not reach the server.";
    return (e && e.message) || "Unknown error";
  }

  // ---- state -------------------------------------------------------------
  async function loadAll() {
    const u = user();
    if (!u) throw new Error("not signed in");
    const list = await pb.collection("dace_judgements").getFullList({ filter: pb.filter("user = {:u}", { u: u.id }), batch: 1000 });
    for (const k of Object.keys(records)) delete records[k];
    for (const r of list) records[r.verb] = (r.data && typeof r.data === "object") ? r.data : {};
    return records;
  }
  function get(verb) { return records[verb] || null; }
  function all() { return records; }

  // the same rules as applyEvent in Vrier/compose server/pb_hooks/dace_lib.js
  function apply(ev, at) {
    if (ev.repeat) return;
    const d = records[ev.verb] = records[ev.verb] || {};
    d.v = 2; d.r = d.r || {}; d.flags = d.flags || {}; d.t = d.t || {}; d.notes = d.notes || {};
    const fk = ev.feature, resp = ev.response;
    switch (ev.kind) {
      case "judge": if (resp === "clear") { delete d.r[fk]; delete d.t[fk]; } else { d.r[fk] = resp; d.t[fk] = at; } break;
      case "flag": d.flags[fk] = true; break;
      case "unflag": delete d.flags[fk]; break;
      case "note": if (resp) d.notes[fk] = resp; else delete d.notes[fk]; break;
      case "sentence": if (resp) d.sentence = resp; else delete d.sentence; break;
      case "nominal": if (resp) d.nominal = resp; else delete d.nominal; break;
    }
  }

  // record one event: { verb, feature?, kind, response?, item?, frame_v?, sentence?, gold?, repeat? }
  function record(ev) {
    if (ev.kind === "judge" && ev.response !== "clear" && !RESPONSES.includes(ev.response)) throw new Error("bad response " + ev.response);
    apply(ev, new Date().toISOString());
    queue.push(Object.assign({ feature: "", response: "", item: "", frame_v: 0, sentence: "", gold: false, repeat: false }, ev));
    emit();
    schedule(0);
  }

  function schedule(ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, ms);
  }
  async function flush() {
    timer = null;
    if (flushing || queue.length === 0) return;
    const u = user();
    if (!u) return;
    flushing = true;
    try {
      while (queue.length) {
        try {
          await pb.collection("dace_events").create(Object.assign({ user: u.id }, queue[0]));
        } catch (e) {
          // 400 = the server refused this event as invalid: retrying can't help, so
          // drop it and count it (the header shows it). Anything else: retry later.
          if (e && e.status === 400) { console.error("DACE: event refused", queue[0], e.response); rejected++; }
          else throw e;
        }
        queue.shift();
        failed = false; attempt = 0;
        emit();
      }
    } catch (e) {
      failed = true; attempt++;
      emit();
      schedule(Math.min(30000, 1500 * Math.pow(2, attempt - 1))); // 1.5s, 3s, 6s … 30s
    } finally {
      flushing = false;
      if (queue.length && !timer && !failed) schedule(0);
    }
  }
  window.addEventListener("online", () => { if (queue.length) schedule(0); });
  window.addEventListener("beforeunload", (e) => { if (queue.length) { e.preventDefault(); e.returnValue = ""; } });

  // the judge's own event log (for their export), oldest first
  async function myEvents() {
    const u = user();
    if (!u) throw new Error("not signed in");
    return pb.collection("dace_events").getFullList({ filter: pb.filter("user = {:u}", { u: u.id }), sort: "at,created", batch: 1000 });
  }

  // ---- admin: other judges' files (needs dace_admin) -----------------------
  async function adminGet(path) {
    const r = await fetch(base + path, { headers: { Authorization: pb.authStore.token } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Request failed"); }
    return r;
  }
  async function adminJudges() { return ((await (await adminGet("/api/dace/judges")).json()).judges) || []; }
  async function adminAgreement() { return (await adminGet("/api/dace/agreement")).json(); }
  async function adminDownload(path, filename) {
    const blob = await (await adminGet(path)).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return { base, pb, RESPONSES, user, refresh, login, register, logout, saveProfile, errorMessage,
    loadAll, get, all, record, myEvents, status, onStatus: (l) => { listeners.add(l); return () => listeners.delete(l); },
    adminJudges, adminAgreement, adminDownload };
})();
