// judge-app.jsx — standalone DACE judgement tool.
// Judgements: 1 = has feature, 0 = no feature, 5 = marginal.  7 = flag for review.
// Plus per-predicate editable example sentence + derived nominal (sidecar files).
// Persists to localStorage; import/export progress CSV, sidecar JSON, merged CSV.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

const LS_JUDGE = "dace_judge_progress_v2";
const LS_FLAGS = "dace_judge_flags_v1";
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
function loadLS(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }
function saveLS(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

const QUEUE = (() => {
  const q = [];
  for (const p of PREDS) for (const fk of FEATURES) {
    q.push({ verb: p.verb, display: p.display, feature: fk, originalValue: p[fk], levin: p.levin_class, ahg: p.semantic_class, p });
  }
  return q;
})();

function downloadBlob(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function exportProgressCSV(j) {
  const rows = ["verb,feature,judgement"];
  for (const [k, v] of Object.entries(j)) { const [verb, feature] = k.split("|"); rows.push([verb, feature, v].join(",")); }
  downloadBlob(rows.join("\n"), "dace_judgements.csv", "text/csv");
}
function exportMergedCSV(j) {
  // src/csv-export.js — same columns, quoting and notes as data/predicates.csv, so
  // replacing that file with this export changes only what was judged.
  downloadBlob(window.daceMergedCSV(PREDS, j, FEATURES, window.DACE_CSV_HEADER), "predicates_judged.csv", "text/csv");
}
function parseProgressCSV(text) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  const header = lines[0].toLowerCase().split(",");
  const vi = header.indexOf("verb"), fi = header.indexOf("feature"), ji = header.indexOf("judgement");
  if (vi === -1 || fi === -1 || ji === -1) return null;
  const out = {};
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    if (c.length < 3) continue;
    const val = c[ji].trim();
    if (["0", "1", "5"].includes(val)) out[jkey(c[vi].trim(), c[fi].trim())] = val;
  }
  return out;
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
      {open && <div className="menu-pop">{items.map((it, i) => <button key={i} className="menu-item" onClick={() => { it.fn(); setOpen(false); }}>{it.label}</button>)}</div>}
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
  const defaultEx = useMemo(() => window.daceDefaultExample ? window.daceDefaultExample(item.verb, item.display, item.levin) : "", [item.verb]);
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
          <span className="anno-label">Example sentence for <i>{item.display}</i> <span className="anno-hint">(sidecar · replaces generated example in the Explorer)</span></span>
          <textarea className="anno-input" rows={2} value={sentVal} placeholder={defaultEx}
            onChange={(e) => setSentVal(e.target.value)}
            onBlur={() => onSentence(item.verb, sentVal)} />
        </label>
        {item.feature === "derived_nominal" && (
          <label className="anno-field">
            <span className="anno-label">Nominal form for <i>{item.display}</i> <span className="anno-hint">(sidecar · only enter if you marked Present above)</span></span>
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

function App() {
  const [judgements, setJudgements] = useState(() => loadLS(LS_JUDGE));
  const [flags, setFlags] = useState(() => loadLS(LS_FLAGS));
  const [sentences, setSentences] = useState(() => ({ ...window.DACE_CUSTOM_SENTENCES }));
  const [nominals, setNominals] = useState(() => ({ ...window.DACE_CUSTOM_NOMINALS }));
  const [idx, setIdx] = useState(() => {
    const j = loadLS(LS_JUDGE);
    const first = QUEUE.findIndex((it) => j[jkey(it.verb, it.feature)] === undefined);
    return first === -1 ? 0 : first;
  });
  const [showOverview, setShowOverview] = useState(false);
  const importRef = useRef(null);
  const importKind = useRef(null);

  const item = QUEUE[idx];
  const judgedCount = Object.keys(judgements).length;
  const pct = Math.round((judgedCount / TOTAL) * 100);

  const advance = useCallback((after) => {
    let n = after + 1;
    while (n < QUEUE.length && judgements[jkey(QUEUE[n].verb, QUEUE[n].feature)] !== undefined) n++;
    setIdx(n < QUEUE.length ? n : Math.min(after + 1, QUEUE.length - 1));
  }, [judgements]);

  const judge = useCallback((val) => {
    if (!item) return;
    const next = { ...judgements, [jkey(item.verb, item.feature)]: val };
    setJudgements(next); saveLS(LS_JUDGE, next);
    let n = idx + 1;
    while (n < QUEUE.length && next[jkey(QUEUE[n].verb, QUEUE[n].feature)] !== undefined) n++;
    setIdx(n < QUEUE.length ? n : Math.min(idx + 1, QUEUE.length - 1));
  }, [item, judgements, idx]);

  const flag = useCallback(() => {
    if (!item) return;
    const k = jkey(item.verb, item.feature);
    const next = { ...flags };
    if (next[k]) delete next[k]; else next[k] = true;
    setFlags(next); saveLS(LS_FLAGS, next);
    advance(idx);
  }, [item, flags, idx, advance]);

  const go = useCallback((d) => setIdx((i) => Math.max(0, Math.min(QUEUE.length - 1, i + d))), []);
  const nextUnjudged = useCallback(() => {
    let n = idx + 1;
    while (n < QUEUE.length && judgements[jkey(QUEUE[n].verb, QUEUE[n].feature)] !== undefined) n++;
    if (n < QUEUE.length) setIdx(n);
  }, [idx, judgements]);

  const setSentence = useCallback((verb, val) => {
    window.daceSetAnno("sentences", verb, val);
    setSentences({ ...window.DACE_CUSTOM_SENTENCES });
  }, []);
  const setNominal = useCallback((verb, val) => {
    window.daceSetAnno("nominals", verb, val);
    setNominals({ ...window.DACE_CUSTOM_NOMINALS });
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
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
  }, [judge, flag, go, nextUnjudged]);

  function triggerImport(kind) { importKind.current = kind; importRef.current.click(); }
  function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const kind = importKind.current;
      if (kind === "judgements") {
        const parsed = parseProgressCSV(r.result);
        if (!parsed) { alert("Could not read progress CSV. Expected columns: verb, feature, judgement."); return; }
        const merged = { ...judgements, ...parsed };
        setJudgements(merged); saveLS(LS_JUDGE, merged);
        alert("Loaded " + Object.keys(parsed).length + " judgements. Total now " + Object.keys(merged).length + ".");
      } else {
        const res = window.daceImportAnno(r.result);
        if (!res.ok) { alert(res.msg); return; }
        setSentences({ ...window.DACE_CUSTOM_SENTENCES });
        setNominals({ ...window.DACE_CUSTOM_NOMINALS });
        alert("Loaded " + res.count + " " + res.type + ".");
      }
    };
    r.readAsText(file);
    e.target.value = "";
  }

  function reset() {
    if (confirm("Clear ALL judgements and flags from this browser? (Export first if you want to keep them. Sidecar sentences/nominals are NOT cleared.)")) {
      setJudgements({}); saveLS(LS_JUDGE, {});
      setFlags({}); saveLS(LS_FLAGS, {});
      setIdx(0);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="brand-mark">DACE</span><span className="brand-sub">Judgement Tool</span></div>
        <div className="prog">
          <div className="prog-bar"><div className="prog-fill" style={{ width: pct + "%" }} /></div>
          <span className="prog-label">{judgedCount.toLocaleString()} / {TOTAL.toLocaleString()} ({pct}%)</span>
        </div>
        <div className="top-actions">
          <button className="ta" onClick={() => setShowOverview(true)}>Coverage map</button>
          <Menu label="Export" items={[
            { label: "Judgements (.csv)", fn: () => exportProgressCSV(judgements) },
            { label: "Merged predicates.csv", fn: () => exportMergedCSV(judgements) },
            { label: "Example sentences (.json)", fn: () => window.daceExportAnno("sentences") },
            { label: "Derived nominals (.json)", fn: () => window.daceExportAnno("nominals") },
          ]} />
          <Menu label="Import" items={[
            { label: "Judgements (.csv)", fn: () => triggerImport("judgements") },
            { label: "Example sentences (.json)", fn: () => triggerImport("sentences") },
            { label: "Derived nominals (.json)", fn: () => triggerImport("nominals") },
          ]} />
          <button className="ta danger" onClick={reset}>Reset</button>
          <input ref={importRef} type="file" accept=".csv,.json" style={{ display: "none" }} onChange={onImportFile} />
        </div>
      </header>

      <div className="stage">
        <button className="nav" onClick={() => go(-1)} disabled={idx === 0}>‹</button>
        <div className="stage-mid">
          <div className="pos">Item {idx + 1} of {QUEUE.length.toLocaleString()}</div>
          {item && <Card item={item}
            judgement={judgements[jkey(item.verb, item.feature)]}
            flagged={!!flags[jkey(item.verb, item.feature)]}
            sentence={sentences[item.verb]} nominal={nominals[item.verb]}
            onJudge={judge} onFlag={flag} onSentence={setSentence} onNominal={setNominal} />}
          <button className="next-unjudged" onClick={nextUnjudged}>Skip to next unjudged →  <kbd>U</kbd></button>
        </div>
        <button className="nav" onClick={() => go(1)} disabled={idx >= QUEUE.length - 1}>›</button>
      </div>

      <footer className="foot">
        <span className="kb"><kbd>1</kbd> Present</span>
        <span className="kb"><kbd>0</kbd> Absent</span>
        <span className="kb"><kbd>5</kbd> Marginal</span>
        <span className="kb"><kbd>7</kbd> Flag</span>
        <span className="kb"><kbd>←</kbd><kbd>→</kbd> Navigate</span>
        <span className="kb"><kbd>U</kbd> Next unjudged</span>
        <span className="foot-note">Saves automatically in this browser.</span>
      </footer>

      {showOverview && <Overview judgements={judgements} flags={flags} onClose={() => setShowOverview(false)} onJump={(i) => { setIdx(i); setShowOverview(false); }} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
