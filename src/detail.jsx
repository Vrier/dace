// detail.jsx — predicate detail (all flags grouped + Wiktionary) + Wiktionary fetch.
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

const WIKT_CACHE = {};
async function fetchWiktionary(lemma) {
  if (WIKT_CACHE[lemma]) return WIKT_CACHE[lemma];
  const url = "https://en.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(lemma.replace(/ /g, "_"));
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  const en = json.en || [];
  WIKT_CACHE[lemma] = en;
  return en;
}

function WiktionarySenses({ lemma, display }) {
  const [state, setState] = useStateD({ loading: true, error: null, data: null });
  useEffectD(() => {
    let live = true;
    setState({ loading: true, error: null, data: null });
    fetchWiktionary(lemma)
      .then((d) => { if (live) setState({ loading: false, error: null, data: d }); })
      .catch((e) => { if (live) setState({ loading: false, error: e.message, data: null }); });
    return () => { live = false; };
  }, [lemma]);

  const pageUrl = "https://en.wiktionary.org/wiki/" + encodeURIComponent(lemma.replace(/ /g, "_")) + "#English";
  // only verb part-of-speech entries
  const verbEntries = (state.data || []).filter((pos) => /verb/i.test(pos.partOfSpeech));

  return (
    <div className="wikt">
      <div className="sec-head">
        <h4>Wiktionary
          {lemma !== display && <span className="wikt-lemma"> · queried as <i>{lemma}</i></span>}
        </h4>
        <a className="wikt-out" href={pageUrl} target="_blank" rel="noopener">Open entry ↗</a>
      </div>
      {state.loading && <div className="wikt-status">Loading senses…</div>}
      {state.error && (
        <div className="wikt-status err">
          Couldn’t load live definitions ({state.error}). <a href={pageUrl} target="_blank" rel="noopener">View on Wiktionary ↗</a>
        </div>
      )}
      {state.data && verbEntries.length === 0 && (
        <div className="wikt-status">No English <i>verb</i> sense found. <a href={pageUrl} target="_blank" rel="noopener">View full entry ↗</a></div>
      )}
      {verbEntries.map((pos, i) => (
        <div className="wikt-pos" key={i}>
          <div className="wikt-pos-label">{pos.partOfSpeech}</div>
          <ol className="wikt-defs">
            {pos.definitions.slice(0, 6).map((d, j) => (
              <li key={j}>
                <span className="wikt-def" dangerouslySetInnerHTML={{ __html: d.definition }} />
                {d.examples && d.examples.length > 0 && (
                  <span className="wikt-ex" dangerouslySetInnerHTML={{ __html: "“" + d.examples[0].replace(/<[^>]*>/g, "") + "”" }} />
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function FlagRow({ fk, on, accent, verb, display, levinClass, onFeatureClick }) {
  const f = DACE_FEATURES[fk];
  const t = useTip();
  const nomInfo = (fk === 'derived_nominal' && window.daceNominal) ? window.daceNominal(verb, display) : null;
  const nominal = nomInfo ? nomInfo.nom : null;
  const nomCandidate = nomInfo ? nomInfo.candidate : false;
  const testHtml = window.daceTestSentence ? window.daceTestSentence(fk, on, levinClass, display, nominal) : null;
  const tipContent = (
    <div className="ftip">
      <div className="ftip-head">
        <span className="ftip-name">{f.label}</span>
        <span className="ftip-sec">§{f.sec}</span>
      </div>
      <div className="ftip-def" dangerouslySetInnerHTML={{ __html: f.def }} />
      {testHtml && <div className="ftip-test" dangerouslySetInnerHTML={{ __html: testHtml }} />}
      <div className="ftip-link">↗ open §{f.sec} in alternations · click ▸ to filter</div>
    </div>
  );
  return (
    <div className={"flag" + (on ? " on" : " off")}>
      <a className="flag-doc" href={f.url} target="_blank" rel="noopener"
         onMouseEnter={(e) => t && t.show(e, tipContent)}
         onMouseLeave={() => t && t.hide()}>
        <Dot on={on} accent={accent} />
        <span className="flag-label">
          {f.label}
          {nominal && <em className="flag-nominal"> → {nomCandidate ? <span className="nom-candidate" title="candidate form — not an established nominal">?{nominal}</span> : nominal}</em>}
        </span>
        <span className="flag-sec">§{f.sec}</span>
      </a>
      {onFeatureClick && (
        <button className="flag-filter" title="Filter list to predicates where this feature is present"
          onClick={() => onFeatureClick(fk, on ? 'on' : 'off')}>
          {on ? '▸' : '·'}
        </button>
      )}
    </div>
  );
}

function DetailBody({ p, accent, onFeatureClick }) {
  // group features by Part
  const groups = DACE_GROUPS.map((g) => ({
    g,
    keys: window.DACE_BINARY_COLS.filter((k) => DACE_FEATURES[k] && DACE_FEATURES[k].group === g.key),
  }));
  const customEx = window.DACE_CUSTOM_SENTENCES && window.DACE_CUSTOM_SENTENCES[p.verb];
  const example = customEx || (window.daceDefaultExample ? window.daceDefaultExample(p.verb, p.display, p.levin_class) : "");
  return (
    <div className="detail">
      <div className="detail-top">
        <div className="detail-title">
          <h2>{p.display}</h2>
          {p.verb !== p.display && <code className="detail-key">{p.verb}</code>}
          {isEstimated(p) && <span className="detail-est" title="This predicate was imported from a source inventory (AHG 2017 appendix or a verb_classes.md members list). Its class follows the source; the syntactic feature values are best-guess estimates pending annotation.">imported · est. features</span>}
        </div>
        <div className="detail-meta">
          {p.ahg_class && <React.Fragment><span className="class-label-tag ahg">AHG</span><AhgChip p={p} /></React.Fragment>}
          <span className="class-label-tag sem">Sem</span><ClassChip cls={p.semantic_class} />
          {p.levin_class && <React.Fragment><span className="class-label-tag levin">Levin</span><LevinChip code={p.levin_class} /></React.Fragment>}
          <CatTag kind="factivity" value={p.factivity} />
          <CatTag kind="veridicality" value={p.veridicality} />
        </div>
      </div>

      <WiktionarySenses lemma={p.lemma} display={p.display} />


      {example && <div className="detail-example"><span className={"ex-tag" + (customEx ? " custom" : "")}>{customEx ? "custom example" : "example"}</span><span className="ex-text">{example}</span></div>}

      {p.notesClean && <div className="detail-notes"><span className="notes-tag">note</span>{p.notesClean}</div>}

      <div className="flags-wrap">
        {groups.map(({ g, keys }) => (
          <div className="flag-group" key={g.key}>
            <div className="flag-group-head">
              <span className="fgh-key">{g.key}</span>
              <span className="fgh-label">{g.label}</span>
            </div>
            <div className="flag-grid">
              {keys.map((k) => <FlagRow key={k} fk={k} on={p[k] === 1} accent={accent} verb={p.verb} display={p.display} levinClass={p.levin_class} onFeatureClick={onFeatureClick} />)}
              {g.key === "D" && (
                <React.Fragment>
                  <div className="flag cat-flag">
                    <span className="flag-label">Factivity</span>
                    <CatTag kind="factivity" value={p.factivity} />
                  </div>
                  <div className="flag cat-flag">
                    <span className="flag-label">Veridicality</span>
                    <CatTag kind="veridicality" value={p.veridicality} />
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="detail-foot">
        <a href={DACE_LINKS.csv} download>Download predicates.csv</a>
        <a href={DACE_CLASSES[p.semantic_class] ? DACE_CLASSES[p.semantic_class].url : DACE_LINKS.vc} target="_blank" rel="noopener">Class in Verb Classes ↗</a>
      </div>
    </div>
  );
}

// modal wrapper for table/cards
function DetailModal({ p, accent, onClose, onFeatureClick }) {
  useEffectD(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!p) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <DetailBody p={p} accent={accent} onFeatureClick={onFeatureClick} />
      </div>
    </div>
  );
}

Object.assign(window, { DetailBody, DetailModal, WiktionarySenses });
