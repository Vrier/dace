// views.jsx — Table, List+Detail, Classes (AHG / Levin toggle)
const FCODES = {
  that_omission: "that", comp_inf: "inf", ecm: "ecm", comp_interrog: "Q",
  comp_gerund: "ger", comp_small_clause: "SC", np_comp_alt: "NP", direct_speech: "quot",
  subjunctive_comp: "subj", comp_for_to: "for-to", comp_bare_inf: "bare", comp_exclamative: "excl",
  comp_poss_ing: "poss", extraposition: "extr", raising: "rais", ditransitive: "ditr",
  factive_passive: "Fpas", neg_raising: "NR", weak_island: "brdg", pro_complement: "so/not",
  npi_licenser: "NPI", stative: "stat", content_noun_fact: "CN", derived_nominal: "nom",
  phrasal: "phr", be_copula: "cop",
};

function SortHead({ label, k, sort, onSort, className, title }) {
  const active = sort.key === k;
  return (
    <th className={(className || "") + (active ? " sorted" : "")} onClick={() => onSort(k)} title={title}>
      <span className="th-in">{label}{active && <span className="th-arrow">{sort.dir === "asc" ? "▲" : "▼"}</span>}</span>
    </th>
  );
}

// ---------- TABLE (virtualized — fixed --row-h windowing) ----------
const TableRow = React.memo(function TableRow({ p, accent, onOpen }) {
  return (
    <tr onClick={() => onOpen(p)}>
      <td className="col-verb"><span className="tbl-verb">{p.display}</span></td>
      <td className="col-cls"><AhgChip p={p} /></td>
      <td className="col-cls">
        <span className="tbl-cls">
          <span className="cls-dot" style={{ background: CLASS_COLORS[p.semantic_class] }} />
          {DACE_CLASSES[p.semantic_class] ? DACE_CLASSES[p.semantic_class].label : p.semantic_class}
        </span>
      </td>
      <td className="col-cls">
        {p.levin_class && (
          <span className="tbl-cls">
            <span className="cls-dot" style={{ background: DACE_LEVIN_COLORS[p.levin_class] }} />
            {DACE_LEVIN_CLASSES[p.levin_class] ? DACE_LEVIN_CLASSES[p.levin_class].short : p.levin_class}
          </span>
        )}
      </td>
      <td className="col-cat"><CatTag kind="factivity" value={p.factivity} /></td>
      <td className="col-cat"><CatTag kind="veridicality" value={p.veridicality} /></td>
      {window.DACE_BINARY_COLS.map((k) => (
        <td key={k} className={"col-feat" + (p[k] ? " y" : "")}>
          <Dot on={p[k] === 1} accent={accent} na={window.daceInapplicable(p.verb, k)} />
        </td>
      ))}
    </tr>
  );
});

const V_OVERSCAN = 12;
function TableView({ rows, accent, sort, onSort, onOpen }) {
  const t = useTip();
  const wrapRef = React.useRef(null);
  const [win, setWin] = React.useState({ start: 0, end: 80 });
  const rowHRef = React.useRef(38);
  const measure = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rh = parseFloat(getComputedStyle(el).getPropertyValue("--row-h")) || 38;
    rowHRef.current = rh;
    const start = Math.max(0, Math.floor(el.scrollTop / rh) - V_OVERSCAN);
    const end = Math.min(rows.length, Math.ceil((el.scrollTop + el.clientHeight) / rh) + V_OVERSCAN);
    setWin((w) => (w.start === start && w.end === end) ? w : { start, end });
  }, [rows.length]);
  React.useEffect(() => { measure(); }); // every render: picks up density (--row-h) changes; setWin is equality-guarded
  const onScroll = () => { if (!wrapRef.current._raf) { wrapRef.current._raf = requestAnimationFrame(() => { if (wrapRef.current) { wrapRef.current._raf = null; measure(); } }); } };
  const rh = rowHRef.current;
  const start = Math.min(win.start, Math.max(0, rows.length - 1));
  const end = Math.min(win.end, rows.length);
  const slice = rows.slice(start, end);
  const nCols = 7 + window.DACE_BINARY_COLS.length;
  const Spacer = ({ h }) => <tr aria-hidden="true"><td colSpan={nCols} style={{ height: h, padding: 0, border: "none" }}></td></tr>;
  return (
    <div className="tbl-wrap" ref={wrapRef} onScroll={onScroll}>
      <table className="tbl">
        <thead>
          <tr>
            <SortHead label="Predicate" k="verb" sort={sort} onSort={onSort} className="col-verb" />
            <SortHead label="AHG class" k="ahg_class" sort={sort} onSort={onSort} className="col-cls" title="Anand, Grimshaw & Hacquard (2017) classification" />
            <SortHead label="Semantic" k="semantic_class" sort={sort} onSort={onSort} className="col-cls" title="DACE 9-way semantic class (verb_classes.md)" />
            <SortHead label="Levin class" k="levin_class" sort={sort} onSort={onSort} className="col-cls" />
            <SortHead label="Factivity" k="factivity" sort={sort} onSort={onSort} className="col-cat" />
            <SortHead label="Veridicality" k="veridicality" sort={sort} onSort={onSort} className="col-cat" />
            {window.DACE_BINARY_COLS.map((k) => {
              const active = sort.key === k;
              return (
                <th key={k} className={"col-feat" + (active ? " sorted" : "")} onClick={() => onSort(k)}
                    onMouseEnter={(e) => t && t.show(e, <FeatureTipCard fk={k} />)}
                    onMouseLeave={() => t && t.hide()}>
                  <span className="th-feat">{FCODES[k]}{active && <span className="th-arrow">{sort.dir === "asc" ? "▲" : "▼"}</span>}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {start > 0 && <Spacer h={start * rh} />}
          {slice.map((p) => <TableRow key={p.verb} p={p} accent={accent} onOpen={onOpen} />)}
          {end < rows.length && <Spacer h={(rows.length - end) * rh} />}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty">No predicates match these filters.</div>}
    </div>
  );
}

// ---------- LIST ----------
function ListItem({ p, active, onSelect }) {
  return (
    <button className={"list-item" + (active ? " active" : "")} onClick={() => onSelect(p)}>
      <span className="li-dot" style={{ background: CLASS_COLORS[p.semantic_class] }} />
      <span className="li-name">{p.display}</span>
    </button>
  );
}

function ListView({ rows, accent, selected, onSelect, onFeatureClick }) {
  const sel = selected && rows.find((r) => r.verb === selected.verb) ? selected : rows[0];
  return (
    <div className="list-split">
      <div className="list-col">
        <div className="list-count">{rows.length} predicate{rows.length !== 1 ? "s" : ""}</div>
        <div className="list-scroll">
          {rows.map((p) => <ListItem key={p.verb} p={p} active={sel && sel.verb === p.verb} onSelect={onSelect} />)}
          {rows.length === 0 && <div className="empty">No predicates match these filters.</div>}
        </div>
      </div>
      <div className="list-detail">
        {sel ? <DetailBody p={sel} accent={accent} onFeatureClick={onFeatureClick} /> : <div className="empty">Select a predicate.</div>}
      </div>
    </div>
  );
}

// ---------- CLASSES VIEW (AHG / Semantic / Levin) ----------
function ClassPredRow({ p, onOpen, ahgCls }) {
  const mem = ahgCls ? window.daceAhgMembership(p, ahgCls) : null;
  const sub = mem && mem.s ? (SUBCLASS_LABEL[mem.s] || mem.s) : "";
  return (
    <button className="cpred" onClick={() => onOpen(p)}>
      <span className="cpred-name">{p.display}{isEstimated(p) && <span className="cpred-est" title="imported from a source list; feature values are estimates">·est</span>}</span>
      <span className="cpred-tags">
        {sub && <span className="cpred-sub">{sub}</span>}
        <span className={"li-fac " + (p.factivity === "factive" ? "pos" : p.factivity === "counter-factive" ? "neg" : "neu")}>
          {p.factivity.replace("-factive", "-f.").replace("factive", "fact.")}
        </span>
      </span>
    </button>
  );
}

// genuine AHG class card (buckets by membership, incl. multi-sense)
function AhgGenuineCard({ cls, items, onOpen }) {
  const c = DACE_AHG_CLASSES[cls];
  const color = DACE_AHG_COLORS[cls];
  const rofi = items.filter((p) => { const m = window.daceAhgMembership(p, cls); return m && m.r; }).length;
  const subs = {};
  items.forEach((p) => { const m = window.daceAhgMembership(p, cls); if (m && m.s) subs[m.s] = (subs[m.s] || 0) + 1; });
  const subStr = Object.keys(subs).map((k) => (SUBCLASS_LABEL[k] || k) + " (" + subs[k] + ")").join(" · ");
  return (
    <button className={"class-card" + (!items.length ? " disabled" : "")} disabled={!items.length}
      onClick={() => items.length && onOpen({ type: "ahg", key: cls })} style={{ "--cc": color }}>
      <span className="class-card-bar" style={{ background: color }} />
      <div className="class-card-head">
        <span className="class-card-name">{c.label}</span>
        <span className="class-card-n">{items.length}</span>
      </div>
      <div className="class-card-def">{c.def}</div>
      <div className="class-card-meta">{rofi} of {items.length} license an agentive R-of-I subject · {c.paper}</div>
      {subStr && <div className="class-card-subs">subclasses: {subStr}</div>}
      <div className="class-card-sample">{items.slice(0, 5).map((p) => p.display).join(", ")}{items.length > 5 ? "…" : ""}</div>
      <span className="class-card-open">Open {items.length} predicate{items.length !== 1 ? "s" : ""} →</span>
    </button>
  );
}

// AHG open panel — the appendix's R-of-I × factivity 2×2
function AhgOpenPanel({ keyCls, items, onBack, onOpen }) {
  const c = DACE_AHG_CLASSES[keyCls];
  const color = DACE_AHG_COLORS[keyCls];
  const cells = DACE_AHG_CELLS.map((cell) => ({
    cell,
    preds: items.filter((p) => { const m = window.daceAhgMembership(p, keyCls); return m && m.r === cell.r && m.f === cell.f; }),
  }));
  return (
    <div className="class-open">
      <div className="class-open-head" style={{ "--cc": color }}>
        <button className="class-back" onClick={onBack}>← All classes</button>
        <div className="class-open-title">
          <span className="class-open-bar" style={{ background: color }} />
          <div>
            <div className="class-open-name-row">
              <span className="class-label-tag" style={{ background: color }}>AHG</span>
              <h2>{c.label}</h2>
              <span className="class-open-n">{items.length}</span>
            </div>
            <div className="class-open-subtitle">Anand, Grimshaw &amp; Hacquard (2017) · {c.paper}</div>
          </div>
        </div>
        <p className="class-open-def">{c.def}</p>
      </div>
      <div className="ahg-cells">
        {cells.map(({ cell, preds }) => (
          <div key={cell.label} className={"ahg-cell" + (preds.length ? "" : " empty") + (cell.r ? " rofi" : "")} style={{ "--cc": color }}>
            <div className="ahg-cell-head">
              <span className={"ahg-cell-rofi " + (cell.r ? "yes" : "no")}>{cell.r ? "√ allows R-of-I" : "# no R-of-I"}</span>
              <span className={"ahg-cell-fac " + (cell.f ? "fac" : "non")}>{cell.f ? "factive" : "non-factive"}</span>
              <span className="ahg-cell-n">{preds.length}</span>
            </div>
            {preds.length
              ? <div className="class-pred-grid">{preds.map((p) => <ClassPredRow key={p.verb} p={p} onOpen={onOpen} ahgCls={keyCls} />)}</div>
              : <div className="ahg-cell-empty">— none —</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// semantic (9-way) class card
function SemClassCard({ cls, items, onOpen }) {
  const c = DACE_CLASSES[cls];
  const color = CLASS_COLORS[cls];
  return (
    <button className={"class-card" + (!items.length ? " disabled" : "")} disabled={!items.length}
      onClick={() => items.length && onOpen({ type: "sem", key: cls })} style={{ "--cc": color }}>
      <span className="class-card-bar" style={{ background: color }} />
      <div className="class-card-head">
        <span className="class-card-name">{c ? (c.fullName || c.label) : cls}</span>
        <span className="class-card-n">{items.length}</span>
      </div>
      <div className="class-card-def">{c ? c.def : ""}</div>
      <div className="class-card-sample">{items.slice(0, 5).map((p) => p.display).join(", ")}{items.length > 5 ? "…" : ""}</div>
      <span className="class-card-open">Open {items.length} predicate{items.length !== 1 ? "s" : ""} →</span>
    </button>
  );
}

function LevinClassCard({ code, items, onOpen }) {
  const lc = DACE_LEVIN_CLASSES[code];
  const color = DACE_LEVIN_COLORS[code];
  return (
    <button className={"class-card" + (!items.length ? " disabled" : "")} disabled={!items.length}
      onClick={() => items.length && onOpen({ type: "levin", key: code })} style={{ "--cc": color }}>
      <span className="class-card-bar" style={{ background: color }} />
      <div className="class-card-head">
        <span className="class-card-name">{lc ? (lc.fullName || lc.label) : code}</span>
        <span className="class-card-sec">{lc ? lc.sec : ""}</span>
        <span className="class-card-n">{items.length}</span>
      </div>
      <div className="class-card-def">{lc ? lc.def : ""}</div>
      <div className="class-card-meta">{lc ? lc.levin : ""}</div>
      <div className="class-card-sample">{items.slice(0, 5).map((p) => p.display).join(", ")}{items.length > 5 ? "…" : ""}</div>
      <span className="class-card-open">Open {items.length} predicate{items.length !== 1 ? "s" : ""} →</span>
    </button>
  );
}

function ClassOpenPanel({ open, items, onBack, onOpen }) {
  const isLevin = open.type === "levin";
  const key = open.key;
  const c = isLevin ? DACE_LEVIN_CLASSES[key] : DACE_CLASSES[key];
  const color = isLevin ? DACE_LEVIN_COLORS[key] : CLASS_COLORS[key];
  const label = c ? (isLevin ? (c.fullName || c.label) + " " + c.sec : c.label) : key;
  const def = c ? c.def : "";
  const url = c ? c.url : null;
  const subtitle = isLevin && c ? c.levin : null;

  return (
    <div className="class-open">
      <div className="class-open-head" style={{ "--cc": color }}>
        <button className="class-back" onClick={onBack}>← All classes</button>
        <div className="class-open-title">
          <span className="class-open-bar" style={{ background: color }} />
          <div>
            <div className="class-open-name-row">
              <span className="class-label-tag" style={{ background: isLevin ? "#3b54c4" : "#3f7c5f" }}>
                {isLevin ? "Levin" : "Semantic"}
              </span>
              <h2>{label}</h2>
              <span className="class-open-n">{items.length}</span>
            </div>
            {subtitle && <div className="class-open-subtitle">{subtitle}</div>}
          </div>
        </div>
        <p className="class-open-def">{def}</p>
        {url && <a className="class-open-link" href={url} target="_blank" rel="noopener">Read class definition in verb_classes.md ↗</a>}
      </div>
      {items.length === 0
        ? <div className="empty">No predicates in this class match the active filters.</div>
        : <div className="class-pred-grid">{items.map((p) => <ClassPredRow key={p.verb} p={p} onOpen={onOpen} />)}</div>}
    </div>
  );
}

function ClassesView({ rows, accent, onOpen }) {
  const [openCls, setOpenCls] = React.useState(null);
  const [mode, setMode] = React.useState("ahg"); // "ahg" | "sem" | "levin"

  // genuine AHG — bucket by membership (a predicate can appear in several)
  const ahgBuckets = {};
  DACE_AHG_ORDER.forEach((c) => (ahgBuckets[c] = []));
  rows.forEach((p) => { (p.ahg || []).forEach((m) => { if (ahgBuckets[m.c]) ahgBuckets[m.c].push(p); }); });

  // semantic 9-way
  const semBuckets = {};
  CLASS_ORDER.forEach((c) => (semBuckets[c] = []));
  rows.forEach((p) => { if (semBuckets[p.semantic_class]) semBuckets[p.semantic_class].push(p); });

  const levinBuckets = {};
  DACE_LEVIN_ORDER.forEach((c) => (levinBuckets[c] = []));
  rows.forEach((p) => { if (p.levin_class && levinBuckets[p.levin_class]) levinBuckets[p.levin_class].push(p); });

  if (openCls) {
    if (openCls.type === "ahg") {
      return <AhgOpenPanel keyCls={openCls.key} items={ahgBuckets[openCls.key] || []} onBack={() => setOpenCls(null)} onOpen={onOpen} />;
    }
    const items = openCls.type === "sem" ? (semBuckets[openCls.key] || []) : (levinBuckets[openCls.key] || []);
    return <ClassOpenPanel open={openCls} items={items} onBack={() => setOpenCls(null)} onOpen={onOpen} />;
  }

  return (
    <div className="classes-wrap">
      <div className="classes-mode-bar">
        <button className={"cmode-btn" + (mode === "ahg" ? " on" : "")} onClick={() => setMode("ahg")}>
          AHG classes <span className="cmode-n">{DACE_AHG_ORDER.length}</span>
        </button>
        <button className={"cmode-btn" + (mode === "sem" ? " on" : "")} onClick={() => setMode("sem")}>
          Semantic classes <span className="cmode-n">{CLASS_ORDER.length}</span>
        </button>
        <button className={"cmode-btn" + (mode === "levin" ? " on" : "")} onClick={() => setMode("levin")}>
          Levin classes <span className="cmode-n">{DACE_LEVIN_ORDER.length}</span>
        </button>
      </div>
      <div className="classes-grid">
        {mode === "ahg" && DACE_AHG_ORDER.map((cls) => <AhgGenuineCard key={cls} cls={cls} items={ahgBuckets[cls]} onOpen={setOpenCls} />)}
        {mode === "sem" && CLASS_ORDER.map((cls) => <SemClassCard key={cls} cls={cls} items={semBuckets[cls]} onOpen={setOpenCls} />)}
        {mode === "levin" && DACE_LEVIN_ORDER.map((code) => <LevinClassCard key={code} code={code} items={levinBuckets[code]} onOpen={setOpenCls} />)}
      </div>
    </div>
  );
}

Object.assign(window, { TableView, ListView, ClassesView, FCODES });
