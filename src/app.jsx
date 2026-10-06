// app.jsx — DACE Explorer shell: toolbar, filters, theme, settings, docs panel, view switching.
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

const ACCENTS = { green: "#1f7a63", oxblood: "#8a3b30", indigo: "#3b54c4", slate: "#475569" };
const DIRECTIONS = {
  reading: { layout: "list",  accent: "green",   nameFont: "var(--font-serif)" },
  desk:    { layout: "table", accent: "indigo",  nameFont: "var(--font-ui)" },
  atlas:   { layout: "classes", accent: "oxblood", nameFont: "var(--font-serif)" },
};

function computeTheme(t) {
  const dark = t.dark;
  const accent = ACCENTS[t.accent] || ACCENTS.green;
  const dir = t.direction;
  let pal;
  if (dark) {
    pal = { bg: "#15171c", panel: "#1c1f26", panel2: "#222732", ink: "#eceae4", inkSoft: "#a7aeba", inkFaint: "#6b7480", line: "#2b313b", lineStrong: "#3a414d", shadow: "0 18px 40px -18px rgba(0,0,0,.7)" };
  } else if (dir === "reading") {
    pal = { bg: "#f4efe3", panel: "#fffdf7", panel2: "#efe8d8", ink: "#2b2620", inkSoft: "#6d6453", inkFaint: "#9d9482", line: "#e3dac6", lineStrong: "#d4c8ad", shadow: "0 18px 44px -22px rgba(80,64,30,.35)" };
  } else if (dir === "desk") {
    pal = { bg: "#fafbfc", panel: "#ffffff", panel2: "#f4f6f8", ink: "#1a1e24", inkSoft: "#586170", inkFaint: "#99a1ad", line: "#e7eaef", lineStrong: "#d6dbe2", shadow: "0 16px 40px -22px rgba(20,30,50,.28)" };
  } else {
    pal = { bg: "#f1efe9", panel: "#ffffff", panel2: "#faf8f4", ink: "#23211c", inkSoft: "#69645a", inkFaint: "#a39c8f", line: "#e6e1d6", lineStrong: "#d7d0c1", shadow: "0 16px 40px -20px rgba(60,50,30,.25)" };
  }
  const base = t.density === "compact" ? 13 : 14.5;
  const rowH = t.density === "compact" ? 30 : 38;
  return {
    "--bg": pal.bg, "--panel": pal.panel, "--panel2": pal.panel2,
    "--ink": pal.ink, "--ink-soft": pal.inkSoft, "--ink-faint": pal.inkFaint,
    "--line": pal.line, "--line-strong": pal.lineStrong, "--shadow": pal.shadow,
    "--accent": accent,
    "--accent-tint": dark ? "color-mix(in srgb, " + accent + " 26%, transparent)" : "color-mix(in srgb, " + accent + " 13%, transparent)",
    "--pos": dark ? "#5fb98f" : "#1f7a52", "--neg": dark ? "#d98a78" : "#b04a36", "--mid": dark ? "#cBa86a" : "#9a7320",
    "--base": base + "px", "--row-h": rowH + "px",
    "--name-font": DIRECTIONS[dir].nameFont,
    "--font-serif": "'Newsreader', Georgia, serif",
    "--font-ui": "'IBM Plex Sans', system-ui, sans-serif",
    "--font-mono": "'IBM Plex Mono', ui-monospace, monospace",
    "--radius": dir === "desk" ? "6px" : "10px",
  };
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.k} className={"seg-btn" + (value === o.k ? " on" : "")} onClick={() => onChange(o.k)}>{o.label}</button>
      ))}
    </div>
  );
}

function FacetChips({ title, options, selected, onToggle, colorMap }) {
  return (
    <div className="facet">
      <div className="facet-title">{title}</div>
      <div className="facet-chips">
        {options.map((o) => (
          <button key={o.v} className={"fchip" + (selected.has(o.v) ? " on" : "")} onClick={() => onToggle(o.v)}>
            {colorMap && <span className="cls-dot" style={{ background: colorMap[o.v] }} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPanel({ f, setF, onClose, resultCount, total }) {
  const toggleSet = (key, v) => setF((s) => { const n = new Set(s[key]); n.has(v) ? n.delete(v) : n.add(v); return { ...s, [key]: n }; });
  const cycleFeature = (k) => setF((s) => {
    const cur = s.features[k]; const nf = { ...s.features };
    if (!cur) nf[k] = "on"; else if (cur === "on") nf[k] = "off"; else delete nf[k];
    return { ...s, features: nf };
  });
  const classOpts = Object.keys(DACE_CLASSES).map((k) => ({ v: k, label: DACE_CLASSES[k].label })); // kept for filter panel
  const groups = DACE_GROUPS.map((g) => ({ g, keys: window.DACE_BINARY_COLS.filter((k) => DACE_FEATURES[k].group === g.key) }));
  const t = useTip();

  return (
    <aside className="filters">
      <div className="filters-head">
        <div>
          <div className="filters-title">Filter & find</div>
          <div className="filters-sub">{resultCount} of {total} predicates</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close filters">✕</button>
      </div>

      <div className="filters-body">
        <FacetChips title="AHG class" colorMap={DACE_AHG_COLORS}
          options={DACE_AHG_ORDER.map((k) => ({ v: k, label: DACE_AHG_CLASSES[k].label }))}
          selected={f.ahgClasses} onToggle={(v) => toggleSet("ahgClasses", v)} />
        <FacetChips title="AHG subject — agentive R-of-I"
          options={[{ v: "allows", label: "√ allows (the book claims…)" }, { v: "blocks", label: "# blocks" }]}
          selected={f.ahgRofi} onToggle={(v) => toggleSet("ahgRofi", v)} />
        <FacetChips title="Semantic class (DACE)" colorMap={CLASS_COLORS}
          options={Object.keys(DACE_CLASSES).map((k) => ({ v: k, label: DACE_CLASSES[k].label }))}
          selected={f.classes} onToggle={(v) => toggleSet("classes", v)} />
        <FacetChips title="Levin class" colorMap={DACE_LEVIN_COLORS}
          options={DACE_LEVIN_ORDER.map((k) => ({ v: k, label: DACE_LEVIN_CLASSES[k].short }))}
          selected={f.levinClasses} onToggle={(v) => toggleSet("levinClasses", v)} />
        <FacetChips title="Factivity"
          options={Object.keys(DACE_CATS.factivity.values).map((v) => ({ v, label: v }))}
          selected={f.factivity} onToggle={(v) => toggleSet("factivity", v)} />
        <FacetChips title="Veridicality"
          options={Object.keys(DACE_CATS.veridicality.values).map((v) => ({ v, label: v }))}
          selected={f.veridicality} onToggle={(v) => toggleSet("veridicality", v)} />

        <div className="facet">
          <div className="facet-title feat-title">
            Feature requirements
            <div className="mode-seg">
              <button className={f.featureMode === "AND" ? "on" : ""} onClick={() => setF((s) => ({ ...s, featureMode: "AND" }))}>all (AND)</button>
              <button className={f.featureMode === "OR" ? "on" : ""} onClick={() => setF((s) => ({ ...s, featureMode: "OR" }))}>any (OR)</button>
            </div>
          </div>
          <div className="feat-legend">Click to require <b className="lg-on">present</b> · again for <b className="lg-off">absent</b> · again to clear</div>
          {groups.map(({ g, keys }) => (
            <div className="feat-group" key={g.key}>
              <div className="feat-group-label">{g.label}</div>
              <div className="feat-reqs">
                {keys.map((k) => {
                  const st = f.features[k];
                  return (
                    <button key={k} className={"freq" + (st === "on" ? " on" : st === "off" ? " off" : "")} onClick={() => cycleFeature(k)}
                      onMouseEnter={(e) => t && t.show(e, <FeatureTipCard fk={k} />)} onMouseLeave={() => t && t.hide()}>
                      {st === "on" ? "✓ " : st === "off" ? "✕ " : ""}{DACE_FEATURES[k].label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// Documents shown in the side panel. Each has a hash, so it can be linked to
// directly (dace.tstephen.com/#about) and cross-linked from inside a document.
const DACE_DOCS = {
  about:        { file: "docs/about-body.html", title: "About",                             color: "#1f7a63", hash: "about" },
  alternations: { file: "docs/alt-body.html",   title: "Complement-Embedding Alternations", color: "#1f7a63", hash: "alternations" },
  verb_classes: { file: "docs/vc-body.html",    title: "Verb Classes",                      color: "#3b6ea5", hash: "verb-classes" },
};
function docFromHash() {
  const h = window.location.hash.replace(/^#/, "");
  return Object.keys(DACE_DOCS).find((k) => DACE_DOCS[k].hash === h) || null;
}

function DocViewer({ doc, onClose }) {
  const d = DACE_DOCS[doc];
  const [state, setState] = React.useState({ loading: true, html: null, error: false });
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    let live = true;
    setState({ loading: true, html: null, error: false });
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    fetch(d.file)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then((t) => { if (live) setState({ loading: false, html: t, error: false }); })
      .catch(() => { if (live) setState({ loading: false, html: null, error: true }); });
    return () => { live = false; };
  }, [doc]);
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="doc-panel" role="dialog" aria-label={"DACE — " + d.title} onClick={(e) => e.stopPropagation()}>
        <div className="doc-panel-head" style={{ borderBottomColor: d.color }}>
          <span className="doc-panel-title" style={{ color: d.color }}>DACE — {d.title}</span>
          <button className="modal-close" style={{ position: "static" }} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="doc-panel-body" ref={bodyRef}>
          {state.loading && <div className="doc-status">Loading…</div>}
          {state.error && <div className="doc-status">This document didn’t load. Check your connection and open it again.</div>}
          {state.html && <div dangerouslySetInnerHTML={{ __html: state.html }} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DocViewer });

// The "Reading Room" look from the design handoff, fixed for the live site.
// Theme (auto/light/dark) and row density are reader settings — see settings.jsx.
const TWEAK_DEFAULTS = { direction: "reading", accent: "green", density: "cozy", dark: false };

const emptyFilters = () => ({
  query: "", classes: new Set(), ahgClasses: new Set(), ahgRofi: new Set(), levinClasses: new Set(), factivity: new Set(), veridicality: new Set(),
  features: {}, featureMode: "AND",
});

const AHG_COUNTS = (() => { const c = {}; window.DACE_PREDICATES.forEach((p) => { (p.ahg || []).forEach((m) => { c[m.c] = (c[m.c] || 0) + 1; }); }); return c; })();
const LEVIN_COUNTS = (() => { const c = {}; window.DACE_PREDICATES.forEach((p) => { if (p.levin_class) c[p.levin_class] = (c[p.levin_class] || 0) + 1; }); return c; })();

function ClassBar({ f, setF }) {
  const t = useTip();
  const toggleAHG = (c) => setF((s) => { const n = new Set(s.ahgClasses); n.has(c) ? n.delete(c) : n.add(c); return { ...s, ahgClasses: n }; });
  const toggleLevin = (c) => setF((s) => { const n = new Set(s.levinClasses); n.has(c) ? n.delete(c) : n.add(c); return { ...s, levinClasses: n }; });
  return (
    <div className="classbar">
      <span className="classbar-label ahg-label">AHG</span>
      <div className="classbar-pills">
        {DACE_AHG_ORDER.map((c) => {
          const on = f.ahgClasses.has(c);
          const col = DACE_AHG_COLORS[c];
          const ac = DACE_AHG_CLASSES[c];
          return (
            <button key={c} className={"clspill" + (on ? " on" : "")}
              style={on ? { background: col, borderColor: col, color: "#fff" } : { borderColor: col }}
              onClick={() => toggleAHG(c)}
              onMouseEnter={(e) => t && t.show(e, <div className="ftip"><div className="ftip-head"><span className="ftip-name">{ac.label}</span><span className="ftip-sec">{ac.paper}</span></div><div className="ftip-def">{ac.def}</div><div className="ftip-link">↗ Anand, Hacquard &amp; Grimshaw (2017)</div></div>)}
              onMouseLeave={() => t && t.hide()}>
              <span className="clspill-dot" style={{ background: on ? "#fff" : col }} />
              {ac.label}
              <span className="clspill-n">{AHG_COUNTS[c] || 0}</span>
            </button>
          );
        })}
        {f.ahgClasses.size > 0 && <button className="classbar-clear" onClick={() => setF((s) => ({ ...s, ahgClasses: new Set() }))}>all</button>}
      </div>
      <span className="classbar-sep" />
      <span className="classbar-label levin-label">Levin</span>
      <div className="classbar-pills">
        {DACE_LEVIN_ORDER.map((c) => {
          const on = f.levinClasses.has(c);
          const col = DACE_LEVIN_COLORS[c];
          const lc = DACE_LEVIN_CLASSES[c];
          return (
            <button key={c} className={"clspill" + (on ? " on" : "")}
              style={on ? { background: col, borderColor: col, color: "#fff" } : { borderColor: col }}
              onClick={() => toggleLevin(c)}
              onMouseEnter={(e) => t && t.show(e, <div className="ftip"><div className="ftip-head"><span className="ftip-name">{lc.short}</span></div><div className="ftip-def">{lc.def}</div></div>)}
              onMouseLeave={() => t && t.hide()}>
              <span className="clspill-dot" style={{ background: on ? "#fff" : col }} />
              {lc.label}
              <span className="clspill-n">{LEVIN_COUNTS[c] || 0}</span>
            </button>
          );
        })}
        {f.levinClasses.size > 0 && <button className="classbar-clear" onClick={() => setF((s) => ({ ...s, levinClasses: new Set() }))}>all</button>}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [layout, setLayout] = uS(DIRECTIONS[TWEAK_DEFAULTS.direction].layout);
  const [sort, setSort] = uS({ key: "verb", dir: "asc" });
  const [f, setF] = uS(emptyFilters);
  const [openDoc, setOpenDoc] = uS(docFromHash);
  const [annoVersion, setAnnoVersion] = uS(0);
  const annoFileRef = uR(null);
  const [showFilters, setShowFilters] = uS(false);
  const [selected, setSelected] = uS(null);

  // the open document follows the URL hash (#about, #alternations, #verb-classes)
  uE(() => {
    const onHash = () => setOpenDoc(docFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  uE(() => {
    const want = openDoc ? "#" + DACE_DOCS[openDoc].hash : "";
    if (window.location.hash !== want) {
      history.replaceState(null, "", want || window.location.pathname + window.location.search);
    }
  }, [openDoc]);

  const theme = computeTheme(t);
  const accent = ACCENTS[t.accent] || ACCENTS.green;

  const rows = uM(() => {
    const filtered = window.DACE_PREDICATES.filter((p) => predicateMatches(p, f));
    return sortPredicates(filtered, sort);
  }, [f, sort]);

  const onSort = (k) => setSort((s) => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" });

  const [modal, setModal] = uS(null);

  const onFeatureClick = React.useCallback((fk, state) => {
    setF((s) => {
      const nf = { ...s.features };
      const cur = nf[fk];
      if (!cur) nf[fk] = state;
      else if (cur === state) delete nf[fk];
      else nf[fk] = state;
      return { ...s, features: nf };
    });
  }, []);

  const activeCount =
    f.classes.size + f.ahgClasses.size + f.ahgRofi.size + f.levinClasses.size + f.factivity.size + f.veridicality.size + Object.keys(f.features).length;

  const sortOpts = [
    { k: "verb|asc", label: "A → Z" }, { k: "verb|desc", label: "Z → A" },
    { k: "ahg_class|asc", label: "AHG class" },
    { k: "semantic_class|asc", label: "Semantic class" },
    { k: "levin_class|asc", label: "Levin class" },
    { k: "factivity|asc", label: "Factivity" }, { k: "veridicality|asc", label: "Veridicality" },
    { k: "megav|desc", label: "MegaV ↓" }, { k: "megav|asc", label: "MegaV ↑" },
  ];

  return (
    <div className="root" style={theme} data-dir={t.direction} data-dark={t.dark ? "1" : "0"}>
      <TooltipLayer>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">DACE</span>
            <span className="brand-sub">Clause-embedding predicates · <b>{window.DACE_PREDICATES.length}</b></span>
          </div>
          <div className="search">
            <span className="search-ico">⌕</span>
            <input value={f.query} placeholder="Search predicate…" onChange={(e) => setF((s) => ({ ...s, query: e.target.value }))} />
            {f.query && <button className="search-clear" onClick={() => setF((s) => ({ ...s, query: "" }))}>✕</button>}
          </div>
          <div className="bar-controls">
            <Segmented value={layout} onChange={setLayout}
              options={[{ k: "table", label: "Matrix" }, { k: "list", label: "Reader" }, { k: "classes", label: "Classes" }]} />
            <label className="sort-sel">
              <span>Sort</span>
              <select value={sort.key + "|" + sort.dir} onChange={(e) => { const [k, d] = e.target.value.split("|"); setSort({ key: k, dir: d }); }}>
                {sortOpts.map((o) => <option key={o.k} value={o.k}>{o.label}</option>)}
              </select>
            </label>
            <button className={"filter-btn" + (showFilters ? " on" : "")} onClick={() => setShowFilters((v) => !v)}>
              Filters{activeCount > 0 && <span className="fbadge">{activeCount}</span>}
            </button>
            {activeCount > 0 && <button className="clear-btn" onClick={() => setF(emptyFilters())}>Clear</button>}
            <div className="bar-sep" />
            <div className="docs-links">
              <button className="doc-btn" onClick={() => setOpenDoc("about")}>About</button>
              <button className="doc-btn" onClick={() => setOpenDoc("alternations")}>Alternations</button>
              <button className="doc-btn" onClick={() => setOpenDoc("verb_classes")}>Verb Classes</button>
            </div>
            <SettingsMenu t={t} setTweak={setTweak} onLoadAnnotations={() => annoFileRef.current && annoFileRef.current.click()} />
            <input ref={annoFileRef} type="file" accept=".json" multiple style={{ display: "none" }}
              onChange={(e) => {
                const files = [...e.target.files];
                let done = 0, loaded = [];
                files.forEach((file) => {
                  const r = new FileReader();
                  r.onload = () => {
                    const res = window.daceImportAnno(r.result);
                    if (res.ok) loaded.push(res.count + " " + res.type);
                    if (++done === files.length) { setAnnoVersion((v) => v + 1); if (loaded.length) alert("Loaded " + loaded.join(", ") + "."); else alert("No DACE sidecar data found in the selected file(s)."); }
                  };
                  r.readAsText(file);
                });
                e.target.value = "";
              }} />
          </div>
        </header>

        <ClassBar f={f} setF={setF} />

        <div className="stage">
          {showFilters && <FilterPanel f={f} setF={setF} onClose={() => setShowFilters(false)} resultCount={rows.length} total={window.DACE_PREDICATES.length} />}
          <main className={"content layout-" + layout}>
            {layout === "table" && <TableView rows={rows} accent={accent} sort={sort} onSort={onSort} onOpen={setModal} />}
            {layout === "list" && <ListView rows={rows} accent={accent} selected={selected} onSelect={setSelected} onFeatureClick={onFeatureClick} />}
            {layout === "classes" && <ClassesView rows={rows} accent={accent} onOpen={setModal} />}
          </main>
        </div>

        {modal && <DetailModal p={modal} accent={accent} onClose={() => setModal(null)} onFeatureClick={onFeatureClick} />}
        {openDoc && <DocViewer doc={openDoc} onClose={() => setOpenDoc(null)} />}
      </TooltipLayer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
