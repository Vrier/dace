// engine.jsx — filtering/sorting logic + shared UI atoms for DACE Explorer.
const { useState, useEffect, useRef, useCallback } = React;

const CLASS_COLORS = {
  cognitive: "#3b6ea5", communicative: "#1f7a63", emotive: "#bd6a4c",
  psych: "#8a5cb8", desiderative: "#c0902e", directive: "#b23f63",
  evidential: "#3f8f78", perception: "#5878c0", imaginative: "#9a7b3f",
};

// ---------- filtering & sorting ----------
function predicateMatches(p, f) {
  if (f.query) {
    const q = f.query.toLowerCase();
    if (!(p.verb.toLowerCase().includes(q) || p.display.toLowerCase().includes(q) || p.lemma.toLowerCase().includes(q))) return false;
  }
  if (f.classes.size && !f.classes.has(p.semantic_class)) return false;
  if (f.ahgClasses && f.ahgClasses.size) {
    const mem = (p.ahg || []).map((x) => x.c);
    if (!mem.some((c) => f.ahgClasses.has(c))) return false;
  }
  if (f.ahgRofi && f.ahgRofi.size) {
    if (p.ahg_class === "") return false;
    // per-sense: test the membership(s) matching the selected AHG classes (all senses if none selected)
    const mems = (p.ahg && p.ahg.length) ? p.ahg : [{ c: p.ahg_class, r: p.ahg_rofi, f: p.ahg_factive }];
    const pool = (f.ahgClasses && f.ahgClasses.size) ? mems.filter((m) => f.ahgClasses.has(m.c)) : mems;
    if (!pool.some((m) => f.ahgRofi.has(m.r === 1 ? "allows" : "blocks"))) return false;
  }
  if (f.levinClasses.size && !f.levinClasses.has(p.levin_class)) return false;
  if (f.factivity.size && !f.factivity.has(p.factivity)) return false;
  if (f.veridicality.size && !f.veridicality.has(p.veridicality)) return false;
  // binary feature requirements (tri-state)
  const reqs = Object.entries(f.features); // [key, 'on'|'off']
  if (reqs.length) {
    const checks = reqs.map(([k, want]) => (want === "on" ? p[k] === 1 : p[k] === 0));
    if (f.featureMode === "AND") { if (!checks.every(Boolean)) return false; }
    else { if (!checks.some(Boolean)) return false; }
  }
  return true;
}

function sortPredicates(list, sort) {
  const { key, dir } = sort;
  const mul = dir === "asc" ? 1 : -1;
  const arr = [...list];
  arr.sort((a, b) => {
    let av, bv;
    if (key === "verb") { av = a.display; bv = b.display; }
    else { av = (a[key] || "") + ""; bv = (b[key] || "") + ""; }
    const c = av.localeCompare(bv);
    return c !== 0 ? c * mul : a.display.localeCompare(b.display);
  });
  return arr;
}

// ---------- tooltip (single shared floating layer) ----------
const TipCtx = React.createContext(null);
function TooltipLayer({ children }) {
  const [tip, setTip] = useState(null); // {x,y,node}
  const show = useCallback((e, node) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, node });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return (
    <TipCtx.Provider value={{ show, hide }}>
      {children}
      {tip && (
        <div className="dace-tip" style={{ left: tip.x, top: tip.y }}>
          <div className="dace-tip-inner">{tip.node}</div>
        </div>
      )}
    </TipCtx.Provider>
  );
}
function useTip() { return React.useContext(TipCtx); }

// hover wrapper
function Tip({ node, children, className, style, as = "span", ...rest }) {
  const t = useTip();
  const C = as;
  return (
    <C className={className} style={style}
       onMouseEnter={(e) => t && t.show(e, node)}
       onMouseLeave={() => t && t.hide()}
       {...rest}>
      {children}
    </C>
  );
}

// ---------- feature tooltip content ----------
function FeatureTipCard({ fk }) {
  const f = DACE_FEATURES[fk];
  if (!f) return null;
  return (
    <div className="ftip">
      <div className="ftip-head">
        <span className="ftip-name">{f.label}</span>
        <span className="ftip-sec">§{f.sec}</span>
      </div>
      <div className="ftip-def" dangerouslySetInnerHTML={{ __html: f.def }} />
      {f.test && <div className="ftip-test" dangerouslySetInnerHTML={{ __html: f.test }} />}
      {f.eg && <div className="ftip-eg">{f.eg}</div>}
      <div className="ftip-link">↗ open §{f.sec} in alternations.md</div>
    </div>
  );
}

// ---------- atoms ----------
function Dot({ on, accent }) {
  return <span className={"fdot" + (on ? " on" : "")} style={on ? { background: accent, borderColor: accent } : null} />;
}


function ClassChip({ cls, link = true, small = false }) {
  const c = DACE_CLASSES[cls];
  const color = CLASS_COLORS[cls] || "#888";
  const t = useTip();
  const body = (
    <span className={"cls-chip" + (small ? " sm" : "")}
      onMouseEnter={(e) => t && t.show(e, <div className="ftip"><div className="ftip-def">{c ? c.def : cls}</div><div className="ftip-link">↗ verb_classes.md</div></div>)}
      onMouseLeave={() => t && t.hide()}>
      <span className="cls-dot" style={{ background: color }} />
      {c ? c.label : cls}
    </span>
  );
  if (link && c) return <a className="cls-link" href={c.url} target="_blank" rel="noopener">{body}</a>;
  return body;
}

function CatTag({ kind, value }) {
  const cat = DACE_CATS[kind];
  const v = cat && cat.values[value];
  const t = useTip();
  const tone =
    kind === "factivity"
      ? (value === "factive" ? "pos" : value === "counter-factive" ? "neg" : value === "semi-factive" ? "mid" : "neu")
      : (value === "veridical" ? "pos" : value === "anti-veridical" ? "neg" : "neu");
  return (
    <span className={"cat-tag " + tone}
      onMouseEnter={(e) => t && t.show(e, <div className="ftip"><div className="ftip-head"><span className="ftip-name">{v ? v.label : value}</span><span className="ftip-sec">{cat ? cat.label : ""}</span></div><div className="ftip-def">{v ? v.def : ""}</div></div>)}
      onMouseLeave={() => t && t.hide()}>
      {value}
    </span>
  );
}

// Semantic (9-way) class order
const CLASS_ORDER = Object.keys(CLASS_COLORS);

const SUBCLASS_LABEL = {
  "communicative-sense": "communicative-sense", forecast: "forecast", assume: "assumption", reason: "reasoning",
  "say-means": "say-by-means", "non-say": "non-say", preference: "preference-reporting",
};
const isEstimated = (p) => typeof p.notes === "string" && /features estimated/i.test(p.notes);

// ---- genuine AHG (4-way) chip ----
function AhgChip({ p, withRofi = true, small = false }) {
  const t = useTip();
  if (!p.ahg_class) return <span className="ahg-none">—</span>;
  const c = DACE_AHG_CLASSES[p.ahg_class];
  const color = DACE_AHG_COLORS[p.ahg_class];
  const alt = p.ahg_alt_classes || p.ahg_alt || "";
  const sub = p.ahg_subclass ? SUBCLASS_LABEL[p.ahg_subclass] || p.ahg_subclass : "";
  return (
    <span className={"ahg-chip" + (small ? " sm" : "")}
      onMouseEnter={(e) => t && t.show(e,
        <div className="ftip">
          <div className="ftip-head"><span className="ftip-name">{c.label}{sub ? " · " + sub : ""}</span><span className="ftip-sec">{c.paper}</span></div>
          <div className="ftip-def">{c.def}</div>
          <div className="ftip-test">{p.ahg_rofi ? "√ licenses an agentive R-of-I subject" : "# excludes R-of-I subjects"}{p.ahg_factive ? " · AHG-factive" : ""}</div>
          {alt && <div className="ftip-eg">also listed as: {alt.split(";").map((x) => DACE_AHG_CLASSES[x] ? DACE_AHG_CLASSES[x].label : x).join(", ")} sense</div>}
          {isEstimated(p) && <div className="ftip-eg est">⚠ added from the paper — feature values are best-guess estimates</div>}
          <div className="ftip-link">↗ Anand, Grimshaw &amp; Hacquard (2017)</div>
        </div>)}
      onMouseLeave={() => t && t.hide()}>
      <span className="cls-dot" style={{ background: color }} />
      {c.label}
      {sub && <span className="ahg-sub">{sub}</span>}
      {withRofi && <span className={"ahg-rofi " + (p.ahg_rofi ? "yes" : "no")}>{p.ahg_rofi ? "√R" : "#R"}</span>}
    </span>
  );
}

// Levin chip — small inline label for a Levin subclass
function LevinChip({ code, small = false }) {
  const lc = DACE_LEVIN_CLASSES[code];
  const color = DACE_LEVIN_COLORS[code] || "#888";
  const t = useTip();
  if (!lc) return null;
  return (
    <a className={"levin-chip" + (small ? " sm" : "")} href={lc.url} target="_blank" rel="noopener"
      onMouseEnter={(e) => t && t.show(e, <div className="ftip"><div className="ftip-head"><span className="ftip-name">{lc.fullName || lc.short}</span><span className="ftip-sec">{lc.levin}</span></div><div className="ftip-def">{lc.def}</div><div className="ftip-link">↗ verb_classes.html</div></div>)}
      onMouseLeave={() => t && t.hide()}>
      <span className="cls-dot" style={{ background: color }} />
      {lc.fullName || lc.label}
    </a>
  );
}

Object.assign(window, {
  CLASS_COLORS, CLASS_ORDER, AhgChip, SUBCLASS_LABEL, isEstimated, predicateMatches, sortPredicates,
  TooltipLayer, useTip, Tip, FeatureTipCard,
  Dot, ClassChip, CatTag, LevinChip,
});
