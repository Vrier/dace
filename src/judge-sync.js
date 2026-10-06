// judge-sync.js — the Judge's connection to the account backend.
//
// Judges sign in against COMPOSE's PocketBase (https://compose.tstephen.com; the
// routes and collections are in Vrier/compose, server/pb_hooks/dace.pb.js and
// migration 1751700008). Judgements live in the `dace_judgements` collection:
// ONE record per (judge, predicate) holding
//   { f: { <feature>: "0"|"1"|"5" }, flags: { <feature>: true },
//     t: { <feature>: <ISO time> }, sentence, nominal }
// This module keeps those records in memory, writes every change through to the
// server (one small request per keypress, queued and retried in order), and tells
// the app how many changes are still unsaved. Nothing is kept in localStorage
// except the SDK's own auth token, so two accounts or two devices never mix.
//
// Loaded before judge-app.jsx; both share the page's global scope, so everything
// here is namespaced under window.DACE_SYNC and no other top-level name is declared.

window.DACE_SYNC = (function () {
  const DEFAULT_BASE = "https://compose.tstephen.com";
  // ?pb=http://127.0.0.1:8090 points a local preview at a dev PocketBase
  const base = new URLSearchParams(window.location.search).get("pb") || DEFAULT_BASE;
  const pb = new PocketBase(base);
  pb.autoCancellation(false);

  const COLL = "dace_judgements";
  const records = {};      // verb -> { id: string|null, data: {...} }
  const dirty = new Set(); // verbs with unsaved changes
  let flushing = false, failed = false, attempt = 0, timer = null;
  const listeners = new Set();

  function status() { return { pending: dirty.size, failed, online: navigator.onLine !== false }; }
  function emit() { for (const l of listeners) { try { l(status()); } catch (e) { /* listener error */ } } }

  // ---- auth --------------------------------------------------------------
  function user() {
    const r = pb.authStore.isValid && pb.authStore.record;
    return r ? { id: r.id, email: r.email, judge: !!r.judge, admin: !!r.dace_admin } : null;
  }
  async function refresh() {
    // re-validate the stored token and pick up flag changes (judge / dace_admin)
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
    dirty.clear(); failed = false; attempt = 0;
    emit();
  }
  function errorMessage(e) {
    if (e && e.response && e.response.message) return e.response.message;
    if (e && e.status === 0) return "Could not reach the server.";
    return (e && e.message) || "Unknown error";
  }

  // ---- records -----------------------------------------------------------
  async function loadAll() {
    const u = user();
    if (!u) throw new Error("not signed in");
    const list = await pb.collection(COLL).getFullList({ filter: pb.filter("user = {:u}", { u: u.id }), batch: 1000 });
    for (const k of Object.keys(records)) delete records[k];
    for (const r of list) records[r.verb] = { id: r.id, data: (r.data && typeof r.data === "object") ? r.data : {}, v: 0 };
    return records;
  }
  function get(verb) { return records[verb] ? records[verb].data : null; }
  function all() { return records; }

  // change one predicate's data locally and queue the write
  function update(verb, mutate) {
    if (!records[verb]) records[verb] = { id: null, data: {}, v: 0 };
    records[verb].v = (records[verb].v || 0) + 1;
    const d = records[verb].data;
    d.f = d.f || {}; d.flags = d.flags || {}; d.t = d.t || {};
    mutate(d);
    dirty.add(verb);
    emit();
    schedule(0);
    return d;
  }

  function schedule(ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, ms);
  }
  async function flush() {
    timer = null;
    if (flushing || dirty.size === 0) return;
    const u = user();
    if (!u) return;
    flushing = true;
    try {
      // one verb at a time, in order: a create must finish before the same verb
      // can be patched, and a judge's keypresses are sequential anyway
      while (dirty.size) {
        const verb = dirty.values().next().value;
        const rec = records[verb];
        const v = rec.v;
        const payload = { user: u.id, verb, data: rec.data };
        const saved = rec.id
          ? await pb.collection(COLL).update(rec.id, { data: rec.data })
          : await pb.collection(COLL).create(payload);
        rec.id = saved.id;
        if (rec.v === v) dirty.delete(verb); // else it changed during the save: write again
        failed = false; attempt = 0;
        emit();
      }
    } catch (e) {
      if (e && e.status === 400 && e.response && e.response.data && e.response.data.verb) {
        // the record already exists (e.g. created from another tab) — adopt it
        try { await loadAll(); } catch (e2) { /* keep retrying */ }
      }
      failed = true; attempt++;
      emit();
      schedule(Math.min(30000, 1500 * Math.pow(2, attempt - 1))); // 1.5s, 3s, 6s … 30s
    } finally {
      flushing = false;
      if (dirty.size && !timer && !failed) schedule(0);
    }
  }
  window.addEventListener("online", () => { if (dirty.size) schedule(0); });
  window.addEventListener("beforeunload", (e) => { if (dirty.size) { e.preventDefault(); e.returnValue = ""; } });

  // ---- admin: other judges' files (needs dace_admin) -----------------------
  async function adminJudges() {
    const r = await fetch(base + "/api/dace/judges", { headers: { Authorization: pb.authStore.token } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Could not list judges");
    return j.judges || [];
  }
  async function adminDownload(id, file, filename) {
    const r = await fetch(base + "/api/dace/judges/" + id + "/" + file, { headers: { Authorization: pb.authStore.token } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Download failed"); }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return { base, pb, user, refresh, login, register, logout, errorMessage,
    loadAll, get, all, update, status, onStatus: (l) => { listeners.add(l); return () => listeners.delete(l); },
    adminJudges, adminDownload };
})();
