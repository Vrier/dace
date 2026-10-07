// judge-app.jsx — the DACE judgement tool, behind a login.
// The judge rates the test SENTENCE: 1 acceptable, 0 unacceptable, 5 marginal,
// 9 can't judge; 7 flags the cell for review (with an optional note). Responses are
// logged raw, with the frame item and version and the exact sentence shown
// (daceTestItem, frames.js); turning them into feature values — inverting
// weak_island and stative — happens at consolidation (PLAN.md, "Judgement data").
// Plus per-predicate editable example sentence + derived nominal.
// Every change is appended to the judge's event log on the server through
// judge-sync.js (window.DACE_SYNC); nothing is kept in this browser. Each judge
// works through the cells in their own fixed random order (seeded by account),
// with the gold cells (data/gold.csv) spread through it, and about one judgement
// in RETEST_EVERY is followed by a test–retest repeat of an older cell.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

const SYNC = window.DACE_SYNC;
// responses, their keys and colour classes (judge.css)
const RESP = {
  acceptable:   { label: "Acceptable",   key: "1", cls: "v1",  sub: "the sentence is fine" },
  unacceptable: { label: "Unacceptable", key: "0", cls: "v0",  sub: "the sentence is out" },
  marginal:     { label: "Marginal",     key: "5", cls: "v5",  sub: "?  degraded" },
  cant_judge:   { label: "Can't judge",  key: "9", cls: "vcj", sub: "no clear reading" },
};
const KEY_TO_RESP = Object.fromEntries(Object.entries(RESP).map(([r, o]) => [o.key, r]));
const GOLD = window.DACE_GOLD || {};       // "verb|feature" -> expected response (data/gold.csv)
const GOLD_EVERY = 25;                      // one gold cell per this many items, until they run out
const RETEST_EVERY = 100;                   // about one repeat per this many judgements
const RETEST_MIN_AGE = 24 * 3600 * 1000;    // only cells judged at least a day ago
const FEATURES = window.DACE_BINARY_COLS;
const PREDS = window.DACE_PREDICATES;

const CLASS_COLORS = {
  cognitive: "#3b6ea5", communicative: "#1f7a63", emotive: "#bd6a4c",
  psych: "#8a5cb8", desiderative: "#c0902e", directive: "#b23f63",
  evidential: "#3f8f78", perception: "#5878c0", imaginative: "#9a7b3f",
};

function jkey(verb, feature) { return verb + "|" + feature; }

// The feature value a response stands for (shown on the card only; consolidation
// does this for real): for weak_island and stative (DACE_INVERTED) an acceptable
// sentence means the feature is absent.
function featureValue(fk, resp) {
  if (resp === "marginal") return "5";
  if (resp !== "acceptable" && resp !== "unacceptable") return null;
  const has = resp === "acceptable";
  return (window.DACE_INVERTED.includes(fk) ? !has : has) ? "1" : "0";
}

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
    if (window.DACE_UNJUDGED.includes(fk)) continue;       // lexical facts settled in the CSV (phrasal, be_copula)
    if (window.daceInapplicable(p.verb, fk)) continue; // verbal-only features on copular predicates
    q.push({ verb: p.verb, display: p.display, feature: fk, originalValue: p[fk], levin: p.levin_class, ahg: p.semantic_class, p });
  }
  return q;
})();
const TOTAL = QUEUE.length;
const QUEUE_INDEX = Object.fromEntries(QUEUE.map((it, i) => [jkey(it.verb, it.feature), i]));

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

// random order with the gold cells moved forward: one every GOLD_EVERY items
function withGold(order) {
  const isGold = (qi) => GOLD[jkey(QUEUE[qi].verb, QUEUE[qi].feature)] !== undefined;
  const gold = order.filter(isGold), rest = order.filter((qi) => !isGold(qi));
  const out = [];
  let g = 0;
  for (const qi of rest) {
    out.push(qi);
    if (g < gold.length && out.length % GOLD_EVERY === GOLD_EVERY - 1) out.push(gold[g++]);
  }
  while (g < gold.length) out.push(gold[g++]);
  return out;
}
function makeOrder(mode, userId) { return mode === "csv" ? QUEUE.map((_, i) => i) : withGold(judgeOrder(userId)); }

// the judge's cache (verb -> data, format v2) flattened to the maps the UI works with
function flatten(records) {
  const judgements = {}, times = {}, flags = {}, notes = {}, sentences = {}, nominals = {};
  for (const [verb, d] of Object.entries(records)) {
    for (const [fk, v] of Object.entries(d.r || {})) if (RESP[v]) { judgements[jkey(verb, fk)] = v; times[jkey(verb, fk)] = (d.t || {})[fk]; }
    for (const fk of Object.keys(d.flags || {})) flags[jkey(verb, fk)] = true;
    for (const [fk, n] of Object.entries(d.notes || {})) notes[jkey(verb, fk)] = n;
    if (d.sentence) sentences[verb] = d.sentence;
    if (d.nominal) nominals[verb] = d.nominal;
  }
  return { judgements, times, flags, notes, sentences, nominals };
}

function downloadBlob(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function csvq(s) { s = String(s == null ? "" : s); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
// the judge's own event log, in the server's events.csv format
// (/api/dace/judges/{id}/judgements.csv)
async function exportOwnCSV(code) {
  try {
    const evs = await SYNC.myEvents();
    const rows = ["event_id,judge,verb,feature,kind,response,item,frame_v,sentence,gold,repeat,at"];
    for (const e of evs) rows.push([e.id, code, e.verb, e.feature, e.kind, e.response, e.item, e.frame_v, e.sentence,
      e.gold ? 1 : 0, e.repeat ? 1 : 0, String(e.at || "").replace(" ", "T")].map(csvq).join(","));
    downloadBlob(rows.join("\n") + "\n", "dace_events_" + (code || "mine") + ".csv", "text/csv");
  } catch (e) { alert(SYNC.errorMessage(e)); }
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
  // judge mode: never starred (the judge decides) and the that-omission test without
  // "(that)" — the same rendering daceTestItem logs as the sentence judged (frames.js)
  const html = window.daceTestSentence ? window.daceTestSentence(item.feature, 1, item.levin, item.display, nominal, { judge: true }) : null;
  return (
    <div className="ts">
      <div className="ts-def" dangerouslySetInnerHTML={{ __html: f ? f.def : "" }} />
      <div className="ts-sentence" dangerouslySetInnerHTML={{ __html: html || "<em>No frame for this feature.</em>" }} />
    </div>
  );
}

// one predicate that clearly has the feature, one that clearly lacks it (glossary.js)
function MinimalPair({ fk }) {
  const pr = window.DACE_FEATURE_PAIRS && window.DACE_FEATURE_PAIRS[fk];
  if (!pr) return null;
  return (
    <div className="card-pair">
      <span className="pair-ok"><i>✓</i> {pr.good}</span>
      <span className="pair-bad"><i>✗</i> {pr.bad}</span>
    </div>
  );
}

// repeat: a test–retest item — the judge's earlier response is not shown
function Card({ item, response, flagged, note, repeat, sentence, nominal, onJudge, onFlag, onNote, onSentence, onNominal }) {
  const f = DACE_FEATURES[item.feature];
  const shown = repeat ? undefined : response;
  const fv = shown ? featureValue(item.feature, shown) : null;
  const inverted = window.DACE_INVERTED.includes(item.feature);
  const defaultEx = useMemo(() => {
    const baked = window.DACE_BAKED_ANNOTATIONS && window.DACE_BAKED_ANNOTATIONS.sentences && window.DACE_BAKED_ANNOTATIONS.sentences[item.verb];
    return baked || (window.daceDefaultExample ? window.daceDefaultExample(item.verb, item.display, item.levin) : "");
  }, [item.verb]);
  const [sentVal, setSentVal] = useState(sentence || "");
  const [nomVal, setNomVal] = useState(nominal || "");
  const [noteVal, setNoteVal] = useState(note || "");
  useEffect(() => { setSentVal(sentence || ""); setNomVal(nominal || ""); }, [item.verb]);
  useEffect(() => { setNoteVal(note || ""); }, [item.verb, item.feature]);

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
        </div>
      </div>

      {item.feature === "derived_nominal" ? (
        <div className="card-q">Does <b>{item.display}</b> have a nominalisation that takes the same complement — either a noun it is derived from (<i>hope</i> → <i>her hope that…</i>) or one formed with a suffix?
          <ul className="card-suffixes">{window.DACE_NOMINAL_SUFFIXES.map(([suf, eg]) => <li key={suf}><b>{suf}</b> <span>{eg}</span></li>)}</ul>
        </div>
      ) : item.feature === "weak_island" ? (
        <div className="card-q">Can a <i>wh</i>-phrase be extracted out of <b>{item.display}</b>'s complement? Judge the sentence: <b>Acceptable</b> = bridge verb (feature value 0), <b>Unacceptable</b> = weak island (feature value 1).</div>
      ) : item.feature === "stative" ? (
        <div className="card-q">Is <b>{item.display}</b> stative? Judge the progressive: <b>Acceptable</b> = eventive (feature value 0), <b>Unacceptable</b> = stative (feature value 1).</div>
      ) : (
        <div className="card-q">Does <b>{item.display}</b> license the <b>{f ? f.label : item.feature}</b> construction?</div>
      )}
      <MinimalPair fk={item.feature} />

      <TestSentence item={item} />

      <div className="judge-btns">
        {Object.entries(RESP).map(([r, o]) => (
          <button key={r} className={"jb " + o.cls + (shown === r ? " on" : "")} onClick={(e) => { e.currentTarget.blur(); onJudge(r); }}>
            <kbd>{o.key}</kbd><span className="jb-l">{o.label}</span><span className="jb-s">{o.sub}</span>
          </button>
        ))}
        <button className={"jb vflag" + (flagged ? " on" : "")} onClick={(e) => { e.currentTarget.blur(); onFlag(); }}>
          <kbd>7</kbd><span className="jb-l">{flagged ? "Flagged" : "Flag"}</span><span className="jb-s">review later</span>
        </button>
      </div>
      {shown !== undefined && (
        <div className="card-current">Recorded: <b className={RESP[shown].cls}>{RESP[shown].label.toLowerCase()}</b>{inverted && fv !== null && fv !== "5" ? ` (feature value ${fv})` : ""}{flagged ? " · ⚑ flagged" : ""} — press a key or button to change</div>
      )}
      {flagged && (
        <label className="anno-field card-note">
          <span className="anno-label">Note on this cell <span className="anno-hint">(why you flagged it; optional)</span></span>
          <input className="anno-input" type="text" value={noteVal} maxLength={1000}
            onChange={(e) => setNoteVal(e.target.value)}
            onBlur={() => { if ((noteVal || "").trim() !== (note || "")) onNote(item, noteVal); }} />
        </label>
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
            <span className="anno-label">Nominal form for <i>{item.display}</i> <span className="anno-hint">(only if you marked Acceptable above)</span></span>
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
          <span><i className="sw v1" /> acceptable</span><span><i className="sw v0" /> unacceptable</span>
          <span><i className="sw v5" /> marginal</span><span><i className="sw vcj" /> can't judge</span><span><i className="sw vu" /> unjudged</span><span><i className="sw vna" /> n/a</span>
          <span><i className="sw flag" /> flagged ⚑</span>
        </div>
        <div className="ov-grid-wrap">
          <table className="ov-grid">
            <thead><tr><th className="ov-corner"></th>{FEATURES.filter((fk) => !window.DACE_UNJUDGED.includes(fk)).map((fk) => <th key={fk} className="ov-fh" title={DACE_FEATURES[fk]?.label}>{fk.slice(0, 4)}</th>)}</tr></thead>
            <tbody>
              {PREDS.map((p, pi) => (
                <tr key={p.verb}>
                  <td className="ov-vh">{p.display}</td>
                  {FEATURES.map((fk) => {
                    const j = judgements[jkey(p.verb, fk)];
                    const fl = flags[jkey(p.verb, fk)];
                    if (window.DACE_UNJUDGED.includes(fk)) return null;
                    if (window.daceInapplicable(p.verb, fk)) return <td key={fk} className="ov-c vna" title="not applicable" />;
                    const cls = j && RESP[j] ? RESP[j].cls : "vu";
                    return <td key={fk} className={"ov-c " + cls + (fl ? " flagged" : "")} onClick={() => onJump(QUEUE_INDEX[jkey(p.verb, fk)])} />;
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
  const [agree, setAgree] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    SYNC.adminJudges().then(setList).catch((e) => setErr(SYNC.errorMessage(e)));
    SYNC.adminAgreement().then(setAgree).catch(() => {});
  }, []);
  const dl = (path, name) => SYNC.adminDownload(path, name).catch((e) => alert(SYNC.errorMessage(e)));
  const fname = (j) => j.judge_code || j.email.replace(/[^a-z0-9]+/gi, "_");
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
              <thead><tr><th>Code</th><th>Judge</th><th>Variety</th><th>Judged</th><th>Flagged</th><th>Events</th><th>Last activity</th><th>Files</th></tr></thead>
              <tbody>
                {list.map((j) => (
                  <tr key={j.id}>
                    <td className="mono">{j.judge_code || "—"}</td>
                    <td className="jp-email">{j.email}{j.linguist ? <span className="jp-tag" title="linguist">ling</span> : null}</td>
                    <td>{j.variety || (j.profile_done ? "—" : <i>no profile yet</i>)}</td>
                    <td className="num">{j.cells.toLocaleString()} <span className="jp-pct">({Math.round((j.cells / TOTAL) * 100)}%)</span></td>
                    <td className="num">{j.flagged}</td>
                    <td className="num">{(j.events || 0).toLocaleString()}</td>
                    <td>{j.last_activity ? j.last_activity.slice(0, 16).replace("T", " ").replace(" ", " · ") : "—"}</td>
                    <td className="jp-files">
                      <button className="ta" onClick={() => dl("/api/dace/judges/" + j.id + "/judgements.csv", "dace_events_" + fname(j) + ".csv")}>events.csv</button>
                      <button className="ta" onClick={() => dl("/api/dace/judges/" + j.id + "/annotations.json", "dace_annotations_" + fname(j) + ".json")}>annotations.json</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {agree && agree.cells_multi > 0 && (
            <div className="jp-agree">
              {agree.cells_multi.toLocaleString()} cells judged by two or more judges: {Math.round((agree.agree / agree.cells_multi) * 100)}% agree
              ({agree.disagree.toLocaleString()} disagreements; Can't judge left out).
              {agree.pairs.map((p) => <div key={p.a + p.b} className="jp-pair">{p.a} × {p.b}: {p.agree}/{p.overlap}</div>)}
            </div>
          )}
          <div className="jp-all">
            <button className="ta" onClick={() => dl("/api/dace/events.csv", "dace_events.csv")}>All events (events.csv)</button>
            <button className="ta" onClick={() => dl("/api/dace/judges.csv", "dace_judges.csv")}>Judge register (judges.csv)</button>
            <button className="ta" onClick={() => dl("/api/dace/agreement.csv", "dace_agreement.csv")}>Agreement (.csv)</button>
          </div>
          <div className="jp-foot">Files are rendered from the database when you download them, so they are always current. events.csv and judges.csv name judges by code only, never by email; save them in <code>judgements/</code> (gitignored) for consolidation.</div>
        </div>
      </div>
    </div>
  );
}

// the judge's profile: asked once after sign-in, editable later from the menu
const VARIETIES = ["Irish English", "British English", "American English"];
function ProfileCard({ user, onSaved, onCancel }) {
  const known = VARIETIES.includes(user.variety);
  const [variety, setVariety] = useState(user.variety ? (known ? user.variety : "other") : "");
  const [other, setOther] = useState(known ? "" : user.variety);
  const [linguist, setLinguist] = useState(user.profileDone ? (user.linguist ? "yes" : "no") : "");
  const [consent, setConsent] = useState(user.consent);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const v = variety === "other" ? other.trim() : variety;
  async function submit(ev) {
    ev.preventDefault();
    setErr(null); setBusy(true);
    try { onSaved(await SYNC.saveProfile({ variety: v, linguist: linguist === "yes", consent })); }
    catch (e) { setErr(SYNC.errorMessage(e)); setBusy(false); }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-brand"><span className="brand-mark">DACE</span><span className="brand-sub">Judgement Tool</span></div>
      <div className="auth-card">
        <div className="auth-title">About you as a judge</div>
        <div className="auth-note">Three questions, asked once. They are stored with your judge code ({user.code || "assigned with your first judgement"}), never with your email, and help make sense of differences between judges.</div>
        <form onSubmit={submit}>
          <label className="auth-label">Your variety of English
            <select className="auth-input" value={variety} onChange={(e) => setVariety(e.target.value)} required>
              <option value="" disabled>Choose…</option>
              {VARIETIES.map((x) => <option key={x} value={x}>{x}</option>)}
              <option value="other">Other…</option>
            </select>
          </label>
          {variety === "other" && (
            <label className="auth-label">Which?
              <input className="auth-input" value={other} onChange={(e) => setOther(e.target.value)} required maxLength={80} />
            </label>
          )}
          <fieldset className="auth-label prof-radio">
            <legend>Are you a linguist (studying or working in linguistics)?</legend>
            <label><input type="radio" name="ling" checked={linguist === "yes"} onChange={() => setLinguist("yes")} required /> Yes</label>
            <label><input type="radio" name="ling" checked={linguist === "no"} onChange={() => setLinguist("no")} /> No</label>
          </fieldset>
          <label className="prof-check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>My judgements may be published in a pseudonymised dataset (judge code only). Optional; DACE itself only publishes the consolidated values.</span>
          </label>
          {err && <div className="auth-err" role="alert">{err}</div>}
          <button className="ta primary auth-submit" disabled={busy || !v || !linguist}>{busy ? "…" : "Save"}</button>
          {onCancel && <button type="button" className="ta auth-submit" onClick={onCancel}>Cancel</button>}
        </form>
      </div>
    </div>
  );
}

function SaveStatus({ st }) {
  if (st.rejected) return <span className="save-st err" title="The server refused some judgements as invalid — see the browser console"><span className="save-dot" />⚠ {st.rejected} refused</span>;
  if (st.failed) return <span className="save-st err" title="Will keep retrying"><span className="save-dot" />⚠ {st.pending} unsaved — retrying</span>;
  if (st.pending) return <span className="save-st busy"><span className="save-dot" />saving…</span>;
  return <span className="save-st ok"><span className="save-dot" />saved</span>;
}

// ---------------------------------------------------------------------------
function Judge({ user, onSignOut, onProfile }) {
  const narrow = useNarrow();
  const [orderMode, setOrderMode] = useState(() => loadOrderPref(user.id));
  const ORDER = useMemo(() => makeOrder(orderMode, user.id), [user.id, orderMode]);
  const POS_OF = useMemo(() => { const m = new Array(ORDER.length); ORDER.forEach((qi, pos) => { m[qi] = pos; }); return m; }, [ORDER]);

  const [state, setState] = useState(() => flatten(SYNC.all()));
  const { judgements, times, flags, notes, sentences, nominals } = state;
  const refreshState = useCallback(() => setState(flatten(SYNC.all())), []);

  const [pos, setPos] = useState(() => {
    const j = flatten(SYNC.all()).judgements;
    const first = ORDER.findIndex((qi) => j[jkey(QUEUE[qi].verb, QUEUE[qi].feature)] === undefined);
    return first === -1 ? 0 : first;
  });
  const [showOverview, setShowOverview] = useState(false);
  const [showJudges, setShowJudges] = useState(false);
  const [repeatItem, setRepeatItem] = useState(null); // a test–retest item shown in place of the queue
  const [saveSt, setSaveSt] = useState(SYNC.status());

  // switch order without losing the current item
  function switchOrder(mode) {
    if (mode === orderMode) return;
    const qi = ORDER[pos];
    const nextOrder = makeOrder(mode, user.id);
    saveOrderPref(user.id, mode);
    setOrderMode(mode);
    setPos(nextOrder.indexOf(qi));
  }
  useEffect(() => SYNC.onStatus(setSaveSt), []);

  const queued = QUEUE[ORDER[pos]];
  const item = repeatItem || queued;
  const judgedCount = Object.keys(judgements).length;
  const remaining = TOTAL - judgedCount;
  const pct = Math.round((judgedCount / TOTAL) * 100);

  const nextUnjudgedFrom = useCallback((from, j) => {
    let n = from + 1;
    while (n < ORDER.length && j[jkey(QUEUE[ORDER[n]].verb, QUEUE[ORDER[n]].feature)] !== undefined) n++;
    return n < ORDER.length ? n : -1;
  }, [ORDER]);

  // a random cell this judge answered at least a day ago (not the current one)
  const pickRepeat = useCallback((exceptKey) => {
    const now = Date.now();
    const keys = Object.keys(judgements).filter((k) => k !== exceptKey && times[k] && now - Date.parse(times[k]) >= RETEST_MIN_AGE);
    if (!keys.length) return null;
    const qi = QUEUE_INDEX[keys[Math.floor(Math.random() * keys.length)]];
    return qi === undefined ? null : QUEUE[qi];
  }, [judgements, times]);

  const judge = useCallback((resp) => {
    if (!item) return;
    const key = jkey(item.verb, item.feature);
    const ti = window.daceTestItem(item.feature, item.levin, item.display);
    SYNC.record({ verb: item.verb, feature: item.feature, kind: "judge", response: resp,
      item: ti ? ti.item : item.feature + ":none", frame_v: ti ? ti.frame_v : 0, sentence: ti ? (ti.text || "") : "",
      gold: GOLD[key] !== undefined, repeat: !!repeatItem });
    if (repeatItem) { setRepeatItem(null); return; } // the queue position already moved on
    const next = { ...judgements, [key]: resp };
    refreshState();
    const n = nextUnjudgedFrom(pos, next);
    setPos(n !== -1 ? n : Math.min(pos + 1, ORDER.length - 1));
    if (Math.random() < 1 / RETEST_EVERY) setRepeatItem(pickRepeat(key));
  }, [item, repeatItem, judgements, pos, nextUnjudgedFrom, refreshState, ORDER.length, pickRepeat]);

  const flag = useCallback(() => {
    if (!item) return;
    const on = !!flags[jkey(item.verb, item.feature)];
    SYNC.record({ verb: item.verb, feature: item.feature, kind: on ? "unflag" : "flag" });
    refreshState();
  }, [item, flags, refreshState]);
  const setNote = useCallback((it, val) => {
    SYNC.record({ verb: it.verb, feature: it.feature, kind: "note", response: (val || "").trim() });
    refreshState();
  }, [refreshState]);

  const go = useCallback((d) => { setRepeatItem(null); setPos((p) => Math.max(0, Math.min(ORDER.length - 1, p + d))); }, [ORDER.length]);
  const nextUnjudged = useCallback(() => {
    setRepeatItem(null);
    const n = nextUnjudgedFrom(pos, judgements);
    if (n !== -1) setPos(n);
  }, [pos, judgements, nextUnjudgedFrom]);

  const setSentence = useCallback((verb, val) => {
    const v = (val || "").trim();
    if (v === (sentences[verb] || "")) return;
    SYNC.record({ verb, kind: "sentence", response: v });
    refreshState();
  }, [sentences, refreshState]);
  const setNominal = useCallback((verb, val) => {
    const v = (val || "").trim();
    if (v === (nominals[verb] || "")) return;
    SYNC.record({ verb, kind: "nominal", response: v });
    refreshState();
  }, [nominals, refreshState]);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (showOverview || showJudges) return;
      if (KEY_TO_RESP[e.key]) judge(KEY_TO_RESP[e.key]);
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
    { label: "My judgements (.csv)", fn: () => exportOwnCSV(user.code) },
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
    { heading: user.email + (user.code ? " · " + user.code : "") },
    { label: "Your profile", fn: onProfile },
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
              <Menu label={user.email} items={[...(user.code ? [{ heading: "Judge " + user.code }] : []), { label: "Your profile", fn: onProfile }, { label: "Sign out", fn: signOut }]} />
            </>}
        </div>
      </header>

      <div className="stage">
        <button className="nav" onClick={() => go(-1)} disabled={pos === 0} title="Previous in your queue (←)">‹</button>
        <div className="stage-mid">
          <div className={"pos" + (repeatItem ? " pos-repeat" : "")}>{repeatItem ? <>Check item · then back to item {pos + 1}</> : <>Item {pos + 1} of {ORDER.length.toLocaleString()} · {orderMode === "random" ? "your random order" : "CSV order"}</>}</div>
          {item && <Card item={item} repeat={!!repeatItem}
            response={judgements[jkey(item.verb, item.feature)]}
            flagged={!!flags[jkey(item.verb, item.feature)]}
            note={notes[jkey(item.verb, item.feature)]}
            sentence={sentences[item.verb]} nominal={nominals[item.verb]}
            onJudge={judge} onFlag={flag} onNote={setNote} onSentence={setSentence} onNominal={setNominal} />}
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
        <span className="kb"><kbd>1</kbd> Acceptable</span>
        <span className="kb"><kbd>0</kbd> Unacceptable</span>
        <span className="kb"><kbd>5</kbd> Marginal</span>
        <span className="kb"><kbd>9</kbd> Can't judge</span>
        <span className="kb"><kbd>7</kbd> Flag</span>
        <span className="kb"><kbd>←</kbd><kbd>→</kbd> Back / forward</span>
        <span className="kb"><kbd>U</kbd> Next unjudged</span>
        <span className="foot-note">Saved to your account as you go.</span>
      </footer>

      {showOverview && <Overview judgements={judgements} flags={flags} onClose={() => setShowOverview(false)} onJump={(qi) => { setRepeatItem(null); setPos(POS_OF[qi]); setShowOverview(false); }} />}
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
  // (re)load when the signed-in account changes or on "Try again" — not on profile edits
  const [attempt, setAttempt] = useState(0);
  const uid = user && user.judge ? user.id : null;
  useEffect(() => {
    if (!user) return;
    if (!user.judge) { setPhase("ready"); return; }
    setPhase("loading"); setErr(null);
    SYNC.loadAll().then(() => setPhase("ready")).catch((e) => { setErr(SYNC.errorMessage(e)); setPhase("error"); });
  }, [uid, attempt]);

  function signOut() { SYNC.logout(); setUser(null); setPhase("out"); }
  const [editProfile, setEditProfile] = useState(false);

  if (phase === "checking") return <Loading text="Checking your sign-in…" />;
  if (phase === "out" || !user) return <AuthCard onAuthed={(u) => { setUser(u); }} />;
  if (!user.judge) return <NotJudge user={user} onSignOut={signOut} />;
  if (phase === "loading") return <Loading text="Loading your judgements…" />;
  if (phase === "error") return (
    <div className="auth-wrap"><div className="auth-card"><div className="auth-title">Couldn't load your judgements</div><div className="auth-err">{err}</div>
      <button type="button" className="ta auth-submit" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
      <button type="button" className="ta auth-submit" onClick={signOut}>Sign out</button></div></div>
  );
  if (!user.profileDone || editProfile) return (
    <ProfileCard user={user} onCancel={user.profileDone ? () => setEditProfile(false) : null}
      onSaved={(u) => { setEditProfile(false); setUser((old) => ({ ...old, ...u })); }} />
  );
  return <Judge user={user} onSignOut={signOut} onProfile={() => setEditProfile(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
