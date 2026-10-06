// judge-app.jsx — the DACE judgement tool, behind a login.
// Judgements: 1 = has feature, 0 = no feature, 5 = marginal.  7 = flag for review.
// Plus per-predicate editable example sentence + derived nominal.
// Every change is written to the judge's own records on the server through
// judge-sync.js (window.DACE_SYNC); nothing is kept in this browser. Each judge
// works through the cells in their own fixed random order (seeded by account).

const { useState, useEffect, useMemo, useRef, useCallback } = React;

const SYNC = window.DACE_SYNC;
const VALUES = { "1": "present", "0": "absent", "5": "marginal" };
const FEATURES = window.DACE_BINARY_COLS;
const PREDS = window.DACE_PREDICATES;
const TOTAL = PREDS.length * FEATURES.length;

const CLASS_COLORS = {
  cognitive: "#3b6ea5", communicative: "#1f7a63", emotive: "#bd6a4c",
  psych: "#8a5cb8", desiderative: "#c0902e", directive: "#b23f63",
  evidential: "#3f8f78", perception: "#5878c0", imaginative: "#9a7b3f",
};

function jkey(verb, feature) { return verb + "|" + feature; }

// phone layout below 700px: one-row header with a menu, 2×2 judgement buttons,
// a bottom bar for moving through the queue (judge.css, @media (max-width: 700px))
const NARROW_MQ = "(max-width: 700px)";
function useNarrow() {
  const [n, setN] = useState(() => window.matchMedia(NARROW_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW_MQ);
    const h = (e) => setN(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return n;
}

const QUEUE = (() => {
  const q = [];
  for (const p of PREDS) for (const fk of FEATURES) {
    q.push({ verb: p.verb, display: p.display, feature: fk, originalValue: p[fk], levin: p.levin_class, ahg: p.semantic_class, p });
  }
  return q;
})();

// per-judge order: a Fisher–Yates shuffle of the queue indices driven by a small
// seeded PRNG (mulberry32) keyed on the account id — random, but the same on every
// device and visit, so "next unjudged" and ‹ › always mean the same thing.
// Queue order is a per-account preference kept in this browser (it isn't data):
// "random" (default) or "csv" — straight through predicates.csv, feature by feature.
function orderPrefKey(userId) { return "dace_judge_order_" + userId; }
function loadOrderPref(userId) { try { return localStorage.getItem(orderPrefKey(userId)) === "csv" ? "csv" : "random"; } catch (e) { return "random"; } }
function saveOrderPref(userId, mode) { try { localStorage.setItem(orderPrefKey(userId), mode); } catch (e) { /* ignore */ } }

function judgeOrder(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const order = QUEUE.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

// the judge's records (verb -> data) flattened to the maps the UI works with
function flatten(records) {
  const judgements = {}, flags = {}, sentences = {}, nominals = {};
  for (const [verb, rec] of Object.entries(records)) {
    const d = rec.data || {};
    for (const [fk, v] of Object.entries(d.f || {})) if (VALUES[v]) judgements[jkey(verb, fk)] = v;
    for (const fk of Object.keys(d.flags || {})) flags[jkey(verb, fk)] = true;
    if (d.sentence) sentences[verb] = d.sentence;
    if (d.nominal) nominals[verb] = d.nominal;
  }
  return { judgements, flags, sentences, nominals };
}

function downloadBlob(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function csvq(s) { s = String(s == null ? "" : s); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
// same long format as the server's per-judge file (/api/dace/judges/{id}/judgements.csv)
function exportOwnCSV() {
  const rows = ["verb,feature,judgement,flagged,judged_at"];
  const recs = SYNC.all();
  for (const verb of Object.keys(recs).sort()) {
    const d = recs[verb].data || {}, f = d.f || {}, fl = d.flags || {}, t = d.t || {};
    for (const fk of Object.keys({ ...f, ...fl }).sort()) rows.push([csvq(verb), csvq(fk), csvq(f[fk] === undefined ? "" : f[fk]), fl[fk] ? "1" : "0", csvq(t[fk] || "")].join(","));
  }
  downloadBlob(rows.join("\n") + "\n", "dace_judgements.csv", "text/csv");
}
function exportMergedCSV(judgements) {
  // src/csv-export.js — same columns, quoting and notes as data/predicates.csv, so
  // replacing that file with this export changes only what was judged.
  downloadBlob(window.daceMergedCSV(PREDS, judgements, FEATURES, window.DACE_CSV_HEADER), "predicates_judged.csv", "text/csv");
}
function exportOwnAnnotations(type, map) {
  const payload = { _dace: type, version: 1, exported: new Date().toISOString(), data: map };
  downloadBlob(JSON.stringify(payload, null, 2), "dace_" + type + ".json", "application/json");
}

// dropdown menu
function Menu({ label, primary, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="menu" ref={ref}>
      <button className={"ta" + (primary ? " primary" : "")} onClick={() => setOpen((o) => !o)}>{label} ▾</button>
      {open && <div className="menu-pop">{items.map((it, i) => it.heading
        ? <div key={i} className="menu-heading">{it.heading}</div>
        : <button key={i} className="menu-item" onClick={() => { it.fn(); setOpen(false); }}>{it.label}</button>)}</div>}
    </div>
  );
}

function AhgChip({ cls }) {
  const c = DACE_CLASSES[cls];
  return <span className="chip"><span className="chip-dot" style={{ background: CLASS_COLORS[cls] }} />{c ? c.label : cls}</span>;
}
function LevinChip2({ code }) {
  const lc = DACE_LEVIN_CLASSES[code];
  if (!lc) return null;
  return <span className="chip"><span className="chip-dot" style={{ background: DACE_LEVIN_COLORS[code] }} />{lc.fullName || lc.label}</span>;
}

function TestSentence({ item }) {
  const f = DACE_FEATURES[item.feature];
  const nomInfo = window.daceNominal ? window.daceNominal(item.verb, item.display) : null;
  const nominal = nomInfo ? nomInfo.nom : null;
  const html = window.daceTestSentence ? window.daceTestSentence(item.feature, 1, item.levin, item.display, nominal) : null;
  return (
    <div className="ts">
      <div className="ts-def" dangerouslySetInnerHTML={{ __html: f ? f.def : "" }} />
      <div className="ts-sentence" dangerouslySetInnerHTML={{ __html: html || "<em>No frame for this feature.</em>" }} />
    </div>
  );
}

function Card({ item, judgement, flagged, sentence, nominal, onJudge, onFlag, onSentence, onNominal }) {
  const f = DACE_FEATURES[item.feature];
  const defaultEx = useMemo(() => {
    const baked = window.DACE_BAKED_ANNOTATIONS && window.DACE_BAKED_ANNOTATIONS.sentences && window.DACE_BAKED_ANNOTATIONS.sentences[item.verb];
    return baked || (window.daceDefaultExample ? window.daceDefaultExample(item.verb, item.display, item.levin) : "");
  }, [item.verb]);
  const [sentVal, setSentVal] = useState(sentence || "");
  const [nomVal, setNomVal] = useState(nominal || "");
  useEffect(() => { setSentVal(sentence || ""); setNomVal(nominal || ""); }, [item.verb]);

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-left">
          <div className="card-verb">{item.display}{flagged && <span className="flag-badge" title="Flagged for review">⚑</span>}</div>
          <div className="card-chips">
            <AhgChip cls={item.ahg} />
            {item.levin && <LevinChip2 code={item.levin} />}
          </div>
        </div>
        <div className="card-right">
          <div className="card-feat">{f ? f.label : item.feature}</div>
          <div className="card-feat-sec">{f ? "§" + f.sec : ""}</div>
          <div className={"card-csv " + (item.originalValue ? "v1" : "v0")}>current CSV: {item.originalValue}</div>
        </div>
      </div>

      <div className="card-q">Does <b>{item.display}</b> license the <b>{f ? f.label : item.feature}</b> construction?</div>

      <TestSentence item={item} />

      <div className="judge-btns">
        <button className={"jb v1" + (judgement === "1" ? " on" : "")} onClick={() => onJudge("1")}>
          <kbd>1</kbd><span className="jb-l">Present</span><span className="jb-s">has the feature</span>
        </button>
        <button className={"jb v0" + (judgement === "0" ? " on" : "")} onClick={() => onJudge("0")}>
          <kbd>0</kbd><span className="jb-l">Absent</span><span className="jb-s">no feature</span>
        </button>
        <button className={"jb v5" + (judgement === "5" ? " on" : "")} onClick={() => onJudge("5")}>
          <kbd>5</kbd><span className="jb-l">Marginal</span><span className="jb-s">?  degraded</span>
        </button>
        <button className={"jb vflag" + (flagged ? " on" : "")} onClick={() => onFlag()}>
          <kbd>7</kbd><span className="jb-l">{flagged ? "Flagged" : "Flag"}</span><span className="jb-s">review later</span>
        </button>
      </div>
      {judgement !== undefined && (
        <div className="card-current">Recorded: <b className={"v" + judgement}>{VALUES[judgement]}</b>{flagged ? " · ⚑ flagged" : ""} — press a key or button to change</div>
      )}

      <div className="card-anno">
        <label className="anno-field">
          <span className="anno-label">Example sentence for <i>{item.display}</i> <span className="anno-hint">(your own; optional)</span></span>
          <textarea className="anno-input" rows={2} value={sentVal} placeholder={defaultEx}
            onChange={(e) => setSentVal(e.target.value)}
            onBlur={() => onSentence(item.verb, sentVal)} />
        </label>
        {item.feature === "derived_nominal" && (
          <label className="anno-field">
            <span className="anno-label">Nominal form for <i>{item.display}</i> <span className="anno-hint">(only if you marked Present above)</span></span>
            <input className="anno-input" type="text" value={nomVal}
              placeholder={"e.g. " + ((window.daceNominal ? window.daceNominal(item.verb, item.display).nom : "") || item.display)}
              onChange={(e) => setNomVal(e.target.value)}
              onBlur={() => onNominal(item.verb, nomVal)} />
          </label>
        )}
      </div>
    </div>
  );
}

function Overview({ judgements, flags, onJump, onClose }) {
  // onJump takes a QUEUE index; the app maps it into the judge's own order
  return (
    <div className="ov-scrim" onClick={onClose}>
      <div className="ov" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <span>Coverage map — {Object.keys(judgements).length.toLocaleString()} / {TOTAL.toLocaleString()} judged · {Object.keys(flags).length} flagged</span>
          <button className="ov-close" onClick={onClose}>✕</button>
        </div>
        <div className="ov-legend">
          <span><i className="sw v1" /> present</span><span><i className="sw v0" /> absent</span>
          <span><i className="sw v5" /> marginal</span><span><i className="sw vu" /> unjudged</span>
          <span><i className="sw flag" /> flagged ⚑</span>
        </div>
        <div className="ov-grid-wrap">
          <table className="ov-grid">
            <thead><tr><th className="ov-corner"></th>{FEATURES.map((fk) => <th key={fk} className="ov-fh" title={DACE_FEATURES[fk]?.label}>{fk.slice(0, 4)}</th>)}</tr></thead>
            <tbody>
              {PREDS.map((p, pi) => (
                <tr key={p.verb}>
                  <td className="ov-vh">{p.display}</td>
                  {FEATURES.map((fk) => {
                    const j = judgements[jkey(p.verb, fk)];
                    const fl = flags[jkey(p.verb, fk)];
                    const cls = j === "1" ? "v1" : j === "0" ? "v0" : j === "5" ? "v5" : "vu";
                    return <td key={fk} className={"ov-c " + cls + (fl ? " flagged" : "")} onClick={() => onJump(pi * FEATURES.length + FEATURES.indexOf(fk))} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// sign-in card (after COMPOSE's instructor dashboard; same tabs, same rules)
function AuthCard({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(ev) {
    ev.preventDefault();
    setErr(null); setBusy(true);
    try {
      const u = mode === "register" ? await SYNC.register(email, pw, code) : await SYNC.login(email, pw);
      onAuthed(u);
    } catch (e) { setErr(SYNC.errorMessage(e)); }
    setBusy(false);
  }
  const switchTo = (m) => { setMode(m); setErr(null); };

  return (
    <div className="auth-wrap">
      <div className="auth-brand"><span className="brand-mark">DACE</span><span className="brand-sub">Judgement Tool</span></div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={"auth-tab" + (mode === "login" ? " on" : "")} onClick={() => switchTo("login")}>Log in</button>
          <button type="button" className={"auth-tab" + (mode === "register" ? " on" : "")} onClick={() => switchTo("register")}>Register</button>
        </div>
        <form onSubmit={submit}>
          <label className="auth-label">Email
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
          </label>
          <label className="auth-label">Password {mode === "register" && <span className="auth-hint">(at least 10 characters)</span>}
            <input className="auth-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required
              minLength={mode === "register" ? 10 : undefined} autoComplete={mode === "register" ? "new-password" : "current-password"} />
          </label>
          {mode === "register" && (
            <label className="auth-label">Judge code <span className="auth-hint">(from Thomas)</span>
              <input className="auth-input mono" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="off" />
            </label>
          )}
          {err && <div className="auth-err" role="alert">{err}</div>}
          <button className="ta primary auth-submit" disabled={busy}>{busy ? "…" : mode === "login" ? "Log in" : "Create judge account"}</button>
        </form>
        <div className="auth-note">
          {mode === "register"
            ? <>Registering needs a judge code. No emails are sent — remember your password; only the administrator can reset it.</>
            : <>Judges sign in with the account they registered here (a COMPOSE account works too, once it has been made a judge).</>}
        </div>
      </div>
      <div className="auth-back"><a href="../">← dace.tstephen.com</a></div>
    </div>
  );
}

function NotJudge({ user, onSignOut }) {
  return (
    <div className="auth-wrap">
      <div className="auth-brand"><span className="brand-mark">DACE</span><span className="brand-sub">Judgement Tool</span></div>
      <div className="auth-card">
        <div className="auth-title">This account isn't a judge yet</div>
        <div className="auth-note">You're signed in as <b>{user.email}</b>, but judging needs a judge account. Register with a judge code, or ask Thomas to mark this account as a judge.</div>
        <button type="button" className="ta auth-submit" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

function Loading({ text }) {
  return <div className="auth-wrap"><div className="auth-brand"><span className="brand-mark">DACE</span><span className="brand-sub">Judgement Tool</span></div><div className="auth-loading">{text}</div></div>;
}

// admin: every judge's progress and files (needs dace_admin on the account)
function JudgesPanel({ onClose }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { SYNC.adminJudges().then(setList).catch((e) => setErr(SYNC.errorMessage(e))); }, []);
  const fname = (email) => email.replace(/[^a-z0-9]+/gi, "_");
  return (
    <div className="ov-scrim" onClick={onClose}>
      <div className="ov ov-narrow" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head"><span>Judges</span><button className="ov-close" onClick={onClose}>✕</button></div>
        <div className="jp-body">
          {err && <div className="auth-err">{err}</div>}
          {!err && !list && <div className="jp-empty">Loading…</div>}
          {list && list.length === 0 && <div className="jp-empty">No judge accounts yet.</div>}
          {list && list.length > 0 && (
            <table className="jp-table">
              <thead><tr><th>Judge</th><th>Judged</th><th>Flagged</th><th>Last activity</th><th>Files</th></tr></thead>
              <tbody>
                {list.map((j) => (
                  <tr key={j.id}>
                    <td className="jp-email">{j.email}</td>
                    <td className="num">{j.cells.toLocaleString()} <span className="jp-pct">({Math.round((j.cells / TOTAL) * 100)}%)</span></td>
                    <td className="num">{j.flagged}</td>
                    <td>{j.last_activity ? j.last_activity.slice(0, 16).replace("T", " ").replace(" ", " · ") : "—"}</td>
                    <td className="jp-files">
                      <button className="ta" onClick={() => SYNC.adminDownload(j.id, "judgements.csv", "dace_judgements_" + fname(j.email) + ".csv").catch((e) => alert(SYNC.errorMessage(e)))}>judgements.csv</button>
                      <button className="ta" onClick={() => SYNC.adminDownload(j.id, "annotations.json", "dace_annotations_" + fname(j.email) + ".json").catch((e) => alert(SYNC.errorMessage(e)))}>annotations.json</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="jp-foot">Files are rendered from the database when you download them, so a judge's file is always current. Format: verb, feature, judgement (0/1/5), flagged, judged_at.</div>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ st }) {
  if (st.failed) return <span className="save-st err" title="Will keep retrying"><span className="save-dot" />⚠ {st.pending} unsaved — retrying</span>;
  if (st.pending) return <span className="save-st busy"><span className="save-dot" />saving…</span>;
  return <span className="save-st ok"><span className="save-dot" />saved</span>;
}

// ---------------------------------------------------------------------------
function Judge({ user, onSignOut }) {
  const narrow = useNarrow();
  const [orderMode, setOrderMode] = useState(() => loadOrderPref(user.id));
  const ORDER = useMemo(() => orderMode === "csv" ? QUEUE.map((_, i) => i) : judgeOrder(user.id), [user.id, orderMode]);
  const POS_OF = useMemo(() => { const m = new Array(ORDER.length); ORDER.forEach((qi, pos) => { m[qi] = pos; }); return m; }, [ORDER]);

  const [state, setState] = useState(() => flatten(SYNC.all()));
  const { judgements, flags, sentences, nominals } = state;
  const refreshState = useCallback(() => setState(flatten(SYNC.all())), []);

  const [pos, setPos] = useState(() => {
    const j = flatten(SYNC.all()).judgements;
    const first = ORDER.findIndex((qi) => j[jkey(QUEUE[qi].verb, QUEUE[qi].feature)] === undefined);
    return first === -1 ? 0 : first;
  });
  const [showOverview, setShowOverview] = useState(false);
  const [showJudges, setShowJudges] = useState(false);
  const [saveSt, setSaveSt] = useState(SYNC.status());

  // switch order without losing the current item
  function switchOrder(mode) {
    if (mode === orderMode) return;
    const qi = ORDER[pos];
    const nextOrder = mode === "csv" ? QUEUE.map((_, i) => i) : judgeOrder(user.id);
    saveOrderPref(user.id, mode);
    setOrderMode(mode);
    setPos(nextOrder.indexOf(qi));
  }
  useEffect(() => SYNC.onStatus(setSaveSt), []);

  const item = QUEUE[ORDER[pos]];
  const judgedCount = Object.keys(judgements).length;
  const remaining = TOTAL - judgedCount;
  const pct = Math.round((judgedCount / TOTAL) * 100);

  const nextUnjudgedFrom = useCallback((from, j) => {
    let n = from + 1;
    while (n < ORDER.length && j[jkey(QUEUE[ORDER[n]].verb, QUEUE[ORDER[n]].feature)] !== undefined) n++;
    return n < ORDER.length ? n : -1;
  }, [ORDER]);

  const judge = useCallback((val) => {
    if (!item) return;
    const now = new Date().toISOString();
    SYNC.update(item.verb, (d) => { d.f[item.feature] = val; d.t[item.feature] = now; });
    const next = { ...judgements, [jkey(item.verb, item.feature)]: val };
    refreshState();
    const n = nextUnjudgedFrom(pos, next);
    setPos(n !== -1 ? n : Math.min(pos + 1, ORDER.length - 1));
  }, [item, judgements, pos, nextUnjudgedFrom, refreshState, ORDER.length]);

  const flag = useCallback(() => {
    if (!item) return;
    SYNC.update(item.verb, (d) => { if (d.flags[item.feature]) delete d.flags[item.feature]; else d.flags[item.feature] = true; });
    refreshState();
    const n = nextUnjudgedFrom(pos, judgements);
    setPos(n !== -1 ? n : Math.min(pos + 1, ORDER.length - 1));
  }, [item, judgements, pos, nextUnjudgedFrom, refreshState, ORDER.length]);

  const go = useCallback((d) => setPos((p) => Math.max(0, Math.min(ORDER.length - 1, p + d))), [ORDER.length]);
  const nextUnjudged = useCallback(() => {
    const n = nextUnjudgedFrom(pos, judgements);
    if (n !== -1) setPos(n);
  }, [pos, judgements, nextUnjudgedFrom]);

  const setSentence = useCallback((verb, val) => {
    SYNC.update(verb, (d) => { if (val && val.trim()) d.sentence = val.trim(); else delete d.sentence; });
    refreshState();
  }, [refreshState]);
  const setNominal = useCallback((verb, val) => {
    SYNC.update(verb, (d) => { if (val && val.trim()) d.nominal = val.trim(); else delete d.nominal; });
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (showOverview || showJudges) return;
      if (e.key === "1") judge("1");
      else if (e.key === "0") judge("0");
      else if (e.key === "5") judge("5");
      else if (e.key === "7") flag();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
      else if (e.key.toLowerCase() === "u") nextUnjudged();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [judge, flag, go, nextUnjudged, showOverview, showJudges]);

  function signOut() {
    if (saveSt.pending && !confirm(saveSt.pending + " change(s) haven't reached the server yet. Sign out anyway and lose them?")) return;
    onSignOut();
  }

  const exportItems = [
    { label: "My judgements (.csv)", fn: exportOwnCSV },
    { label: "Merged predicates.csv", fn: () => exportMergedCSV(judgements) },
    { label: "My example sentences (.json)", fn: () => exportOwnAnnotations("sentences", sentences) },
    { label: "My derived nominals (.json)", fn: () => exportOwnAnnotations("nominals", nominals) },
  ];

  const orderItems = [
    { label: (orderMode === "random" ? "● " : "○ ") + "Random (your own shuffle)", fn: () => switchOrder("random") },
    { label: (orderMode === "csv" ? "● " : "○ ") + "In order (as in predicates.csv)", fn: () => switchOrder("csv") },
  ];
  const menuItems = [
    { label: "Coverage map", fn: () => setShowOverview(true) },
    { heading: "Queue order" },
    ...orderItems,
    ...(user.admin ? [{ label: "Judges", fn: () => setShowJudges(true) }] : []),
    { heading: "Export" },
    ...exportItems,
    { heading: user.email },
    { label: "Sign out", fn: signOut },
  ];

  return (
    <div className={"app" + (narrow ? " narrow" : "")}>
      <header className="top">
        <div className="brand"><span className="brand-mark">DACE</span>{!narrow && <span className="brand-sub">Judgement Tool</span>}</div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: pct + "%" }} /></div>
          <span className="prog-label">{narrow
            ? <>{judgedCount.toLocaleString()} · <b>{remaining.toLocaleString()}</b> left</>
            : <>{judgedCount.toLocaleString()} judged · {remaining.toLocaleString()} remaining ({pct}%)</>}</span>
        </div>
        <div className="top-actions">
          <SaveStatus st={saveSt} />
          {narrow
            ? <Menu label="Menu" items={menuItems} />
            : <>
              <button className="ta" onClick={() => setShowOverview(true)}>Coverage map</button>
              <Menu label={orderMode === "random" ? "Random order" : "CSV order"} items={orderItems} />
              <Menu label="Export" items={exportItems} />
              {user.admin && <button className="ta" onClick={() => setShowJudges(true)}>Judges</button>}
              <Menu label={user.email} items={[{ label: "Sign out", fn: signOut }]} />
            </>}
        </div>
      </header>

      <div className="stage">
        <button className="nav" onClick={() => go(-1)} disabled={pos === 0} title="Previous in your queue (←)">‹</button>
        <div className="stage-mid">
          <div className="pos">Item {pos + 1} of {ORDER.length.toLocaleString()} · {orderMode === "random" ? "your random order" : "CSV order"}</div>
          {item && <Card item={item}
            judgement={judgements[jkey(item.verb, item.feature)]}
            flagged={!!flags[jkey(item.verb, item.feature)]}
            sentence={sentences[item.verb]} nominal={nominals[item.verb]}
            onJudge={judge} onFlag={flag} onSentence={setSentence} onNominal={setNominal} />}
          <button className="next-unjudged" onClick={nextUnjudged}>Skip to next unjudged →  <kbd>U</kbd></button>
        </div>
        <button className="nav" onClick={() => go(1)} disabled={pos >= ORDER.length - 1} title="Next in your queue (→)">›</button>
      </div>

      {narrow && (
        <nav className="mnav">
          <button className="mnav-btn" onClick={() => go(-1)} disabled={pos === 0}>‹ Back</button>
          <span className="mnav-pos">{pos + 1} / {ORDER.length.toLocaleString()}</span>
          <button className="mnav-btn" onClick={nextUnjudged} title="Next unjudged">Unjudged ↷</button>
          <button className="mnav-btn" onClick={() => go(1)} disabled={pos >= ORDER.length - 1}>Next ›</button>
        </nav>
      )}

      <footer className="foot">
        <span className="kb"><kbd>1</kbd> Present</span>
        <span className="kb"><kbd>0</kbd> Absent</span>
        <span className="kb"><kbd>5</kbd> Marginal</span>
        <span className="kb"><kbd>7</kbd> Flag</span>
        <span className="kb"><kbd>←</kbd><kbd>→</kbd> Back / forward</span>
        <span className="kb"><kbd>U</kbd> Next unjudged</span>
        <span className="foot-note">Saved to your account as you go.</span>
      </footer>

      {showOverview && <Overview judgements={judgements} flags={flags} onClose={() => setShowOverview(false)} onJump={(qi) => { setPos(POS_OF[qi]); setShowOverview(false); }} />}
      {showJudges && <JudgesPanel onClose={() => setShowJudges(false)} />}
    </div>
  );
}

function App() {
  // phase: checking (token refresh) → loading (records) → ready; or signed out
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("checking");
  const [err, setErr] = useState(null);

  useEffect(() => {
    SYNC.refresh().then((u) => { if (u) setUser(u); else setPhase("out"); }).catch(() => setPhase("out"));
  }, []);
  useEffect(() => {
    if (!user) return;
    if (!user.judge) { setPhase("ready"); return; }
    setPhase("loading"); setErr(null);
    SYNC.loadAll().then(() => setPhase("ready")).catch((e) => { setErr(SYNC.errorMessage(e)); setPhase("error"); });
  }, [user]);

  function signOut() { SYNC.logout(); setUser(null); setPhase("out"); }

  if (phase === "checking") return <Loading text="Checking your sign-in…" />;
  if (phase === "out" || !user) return <AuthCard onAuthed={(u) => { setUser(u); }} />;
  if (!user.judge) return <NotJudge user={user} onSignOut={signOut} />;
  if (phase === "loading") return <Loading text="Loading your judgements…" />;
  if (phase === "error") return (
    <div className="auth-wrap"><div className="auth-card"><div className="auth-title">Couldn't load your judgements</div><div className="auth-err">{err}</div>
      <button type="button" className="ta auth-submit" onClick={() => setUser({ ...user })}>Try again</button>
      <button type="button" className="ta auth-submit" onClick={signOut}>Sign out</button></div></div>
  );
  return <Judge user={user} onSignOut={signOut} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
