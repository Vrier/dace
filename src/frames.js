// frames.js — class-aware test-sentence frames for DACE predicates.
// Each Levin class maps to an argument-structure FRAME TYPE; each feature has a
// frame template per type (falling back to `base`). Placeholders:
//   [VD] 3rd-sg present · [VD] simple past · [VN] past participle (passives) · [VG] -ing
//   [V] base · [ADJ] bare adjective of a copular predicate · [NOM] derived nominal
// Frames are in the past tense (Oct 2026): the simple present forces a habitual or
// stative reading on eventive predicates ("She catches on that…"), the past fits both.
// A template may be a string (one line) or {active, passive} (two voice lines, for psych).

// Levin class -> frame type
window.DACE_FRAME_TYPE = {
  "1.1": "cog", "1.2": "cog", "1.3": "cog", "1.4": "cog",
  "2.1": "cog", "2.2": "cog",
  "3.1": "psych",
  "4.1": "say", "4.2": "tell", "4.3": "say", "4.4": "say",
  "5.1": "desid", "6.1": "dir", "7.1": "raise", "8.1": "percep", "9.1": "impl",
};

// Copular (be_*) predicates: features that cannot apply to an adjective. The factive
// passive and the recipient ditransitive are verbal constructions — *be surprised*
// IS the factive passive of *surprise*, coded on the verb's row. These cells are
// fixed at 0 in the CSV (npm test checks), skipped by the Judge and shown as n/a.
window.DACE_COPULAR_NA = ["factive_passive", "ditransitive"];
// Features that are lexical facts settled in the CSV, not judgements: the Judge
// never shows them (phrasal = has a particle; be_copula = is a be-predicate).
window.DACE_UNJUDGED = ["phrasal", "be_copula"];
// Features whose value 1 means the test sentence is BAD: weak_island (1 = resists
// extraction) and stative (1 = stative, so the progressive is out). The Judge
// records Acceptable as 0 for these; daceTestSentence stars them when on.
window.DACE_INVERTED = ["weak_island", "stative"];
window.daceInapplicable = function (verb, fk) {
  return verb.startsWith("be_") && window.DACE_COPULAR_NA.includes(fk);
};

// Predicates that need a direct object before their clause (*She fooled that he had
// left; She fooled him that he had left). Their sentences come from the tell table,
// which puts a recipient in every frame where the object isn't what is being tested,
// so the test isn't spoiled by the missing object. Tell-class (4.2) verbs get that
// table anyway; this set is for object-taking verbs in other classes.
window.DACE_OBJECT_REQUIRED = new Set([
  "admonish", "chide", "deceive", "educate", "lecture", "pester", "tease",      // 4.1 Say
  "chastise", "congratulate", "inform", "insult", "notify", "rouse",            // 4.3 Confess
  "delude", "fool", "misinform", "mislead", "trick",                             // 4.4 Lie
]);
// Not here: Order-class verbs that need an object (force, exhort) keep the dir table,
// whose clausal frames are infinitival with the object already in place.
// The converse: Tell-class (4.2) verbs that take no bare object before their clause
// (*She swore him that…; confide and get across/through want to/through, which the
// frames leave out). They take the say table, with no recipient. Verbs whose object
// is optional (promise, signal, threaten, warn, advise, caution) stay on tell.
window.DACE_NO_BARE_OBJECT = new Set(["confide", "demonstrate", "get_across", "get_through", "pledge", "swear", "vow"]);
// The frame type a predicate's sentences come from: its class's, tell for the
// object-taking verbs above, say for the Tell verbs without one.
window.daceFrameType = function (levinClass, display) {
  const key = display.replace(/ /g, "_");
  if (DACE_OBJECT_REQUIRED.has(key)) return "tell";
  if (DACE_NO_BARE_OBJECT.has(key)) return "say";
  return DACE_FRAME_TYPE[levinClass] || "base";
};

// Psych verbs that strongly prefer the passive — active marked (?) marginal
window.DACE_PASSIVE_LEANING = new Set(["abash", "nonplus", "discomfit"]);

// --- conjugation ---
// Irregular pasts and participles for the verb heads in predicates.csv
// (multi-word predicates conjugate their first word: "catch on" → "caught on").
window.DACE_IRREGULAR = {
  bear: ["bore", "borne"], beseech: ["besought", "besought"], bet: ["bet", "bet"],
  bring: ["brought", "brought"], broadcast: ["broadcast", "broadcast"], burst: ["burst", "burst"],
  catch: ["caught", "caught"], come: ["came", "come"], feel: ["felt", "felt"], find: ["found", "found"],
  forecast: ["forecast", "forecast"], foresee: ["foresaw", "foreseen"], foretell: ["foretold", "foretold"],
  forget: ["forgot", "forgotten"], forgive: ["forgave", "forgiven"], get: ["got", "got"], give: ["gave", "given"],
  go: ["went", "gone"], hear: ["heard", "heard"], hold: ["held", "held"], hurt: ["hurt", "hurt"],
  know: ["knew", "known"], lay: ["laid", "laid"], let: ["let", "let"], lie: ["lied", "lied"],
  make: ["made", "made"], mean: ["meant", "meant"], mislead: ["misled", "misled"], overhear: ["overheard", "overheard"],
  put: ["put", "put"], read: ["read", "read"], say: ["said", "said"], see: ["saw", "seen"],
  sing: ["sang", "sung"], sink: ["sank", "sunk"], spellbind: ["spellbound", "spellbound"], stand: ["stood", "stood"],
  swear: ["swore", "sworn"], take: ["took", "taken"], teach: ["taught", "taught"], tell: ["told", "told"],
  think: ["thought", "thought"], throw: ["threw", "thrown"], understand: ["understood", "understood"],
  uphold: ["upheld", "upheld"], upset: ["upset", "upset"], weep: ["wept", "wept"], write: ["wrote", "written"],
  wot: ["wist", "wist"],
};
// Final consonant doubles before -ed/-ing in a stressed final CVC syllable
// (beg → begged, admit → admitted); British -l doubling (marvel → marvelled).
window.DACE_DOUBLING = new Set(["admit", "permit", "omit", "regret", "prefer", "concur", "demur", "submit",
  "dispel", "infer", "repel", "commit", "refer", "deter", "occur", "incur", "upset", "abet", "equip", "remit",
  "transmit", "quarrel", "signal", "marvel", "yodel", "carol", "counsel", "label", "level", "model", "travel"]);
function daceDouble(w) {
  if (DACE_DOUBLING.has(w)) return true;
  // one syllable, ends consonant-vowel-consonant, final consonant not w/x/y
  return /^[^aeiou]*[aeiou][bcdfghjklmnpqrstvz]$/.test(w) || /^[^aeiou]*qu[aeiou][bcdfghjklmnpqrstvz]$/.test(w);
}
function daceForms(display) {
  const v = display.replace(/_/g, " ");
  const fw = (w, fn) => { const p = w.split(" "); return [fn(p[0]), ...p.slice(1)].join(" "); };
  if (v.startsWith("be ")) {
    const adj = v.slice(3);
    return { v, v3: "is " + adj, ved: "was " + adj, vn: "been " + adj, ving: "being " + adj, adj };
  }
  const v3 = (w) => /(?:s|x|z|ch|sh|o)$/.test(w) ? w + "es" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s";
  const ed = (w) => DACE_IRREGULAR[w] ? DACE_IRREGULAR[w][0]
    : w.endsWith("e") ? w + "d" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ied" : w.endsWith("c") ? w + "ked" : daceDouble(w) ? w + w.slice(-1) + "ed" : w + "ed";
  const en = (w) => DACE_IRREGULAR[w] ? DACE_IRREGULAR[w][1] : ed(w);
  const ing = (w) => w.endsWith("ie") ? w.slice(0, -2) + "ying"
    : (w.endsWith("e") && !w.endsWith("ee") && !w.endsWith("ye") && !w.endsWith("oe")) ? w.slice(0, -1) + "ing"
    : w.endsWith("c") ? w + "king" : daceDouble(w) ? w + w.slice(-1) + "ing" : w + "ing";
  return { v, v3: fw(v, v3), ved: fw(v, ed), vn: fw(v, en), ving: fw(v, ing) };
}
window.daceForms = daceForms;

// --- frame templates ---
window.DACE_FRAMES = {
  base: {
    that_omission:    "She [VD] (that) he had left.",
    comp_inf:         "She [VD] [to lock the door].",  // subject-control to-VP; ECM has its own frame
    ecm:              "She [VD] [there to be a problem].",  // expletive object: ECM (believe) vs object control (*order)
    comp_interrog:    "She [VD] [whether he had left].",
    comp_gerund:      "She [VD] [having left].",
    comp_small_clause:"She [VD] [him a fool].",
    np_comp_alt:      "She [VD] [the news].",
    direct_speech:    "She [VD]: \u201cHe was late.\u201d",
    subjunctive_comp: "She [VD] [that he leave].",
    comp_for_to:      "She [VD] [for him to leave].",
    comp_bare_inf:    "She [VD] [him leave].",
    comp_exclamative: "She [VD] [what a linguist he is]!",
    comp_poss_ing:    "She [VD] [his leaving].",
    extraposition:    "It [VD] her [that he had left].",
    raising:          "There [VD] to be a problem.",  // expletive subject: raising vs control
    ditransitive:     "She [VD] him [that he had left].",
    factive_passive:  "It is [VN] [that he had left].",
    neg_raising:      "She didn\u2019t [V] he\u2019d come \u2248 She [VD] he wouldn\u2019t come.",
    weak_island:      "What did she [V] [that he bought ___]?",
    pro_complement:   "She [VD] so.",
    npi_licenser:     "She [VD] [that anyone left].",
    stative:          "She is [VG] that he is there.",
    factivity:        "She [VD] / didn\u2019t [V] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
    veridicality:     "She [VD] that p, but p is false \u2014 contradiction?",
    content_noun_fact:"She [VD] [the fact that he left].",
    derived_nominal:  "her [NOM] that he left",
    phrasal:          "She [VD] [that he was there].",
    be_copula:        "She is [glad / aware] [that he was wrong].",
  },

  // assertive report — like base, quotative emphasised
  say: {
    direct_speech:    "She [VD]: \u201cHe was late.\u201d",
    comp_inf:         "She [VD] [to have seen him].",
    np_comp_alt:      "She [VD] [the decision].",
    derived_nominal:  "her [NOM] that he had left",
  },

  // psych-causative — stimulus subject, experiencer object; active + passive
  psych: {
    that_omission:    "She was [VN] (that) he had left.",
    comp_inf:         "She was [VN] [to find the room empty].",
    comp_gerund:      "It [VD] her [his leaving].",
    np_comp_alt:      "[The news] [VD] her.",
    extraposition:    "It [VD] her [that he had left].",
    factive_passive:  "She was [VN] [that he had left].",
    factivity:        "She was [VN] / wasn\u2019t [VN] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
    veridicality:     "It [VD] her that p \u2014 does the matrix entail p?",
    stative:          "She is being [VN] that he is there.",
    content_noun_fact:"[The fact that he left] [VD] her.",
    derived_nominal:  "her [NOM] that he had left",
    comp_interrog:    "It [VD] her [whether he left].",
    direct_speech:    "It [VD] her: \u201cHe left.\u201d",
    pro_complement:   "It [VD] her so.",
    neg_raising:      "It didn\u2019t [V] her that he\u2019d come \u2248 It [VD] her that he wouldn\u2019t come.",
    comp_bare_inf:    "It [VD] her [him leave].",
    subjunctive_comp: "It [VD] her [that he leave].",
    be_copula:        "She is [VN] [that he was wrong].",
  },

  // tell / report-to — agent + recipient + clause
  tell: {
    that_omission:    "She [VD] him (that) the meeting was cancelled.",
    comp_inf:         "She [VD] him [to leave].",
    comp_interrog:    "She [VD] him [whether to come].",
    ditransitive:     "She [VD] him [that the meeting was cancelled].",
    factive_passive:  "He was [VN] [that the meeting was cancelled].",
    direct_speech:    "She [VD] him: \u201cThe meeting is cancelled.\u201d",
    np_comp_alt:      "She [VD] him [the news].",
    subjunctive_comp: "She [VD] him [that he leave].",
    derived_nominal:  "her [NOM] to him that the meeting was cancelled",
    extraposition:    "It [VD] him [that the meeting was cancelled].",
    pro_complement:   "She [VD] him so.",
    comp_gerund:      "She [VD] him [leaving].",
    factivity:        "She [VD] him / didn\u2019t [V] him [that p] \u2014 does p survive negation?",
    neg_raising:      "She didn\u2019t [V] him he\u2019d come \u2248 She [VD] him he wouldn\u2019t come.",
    // the object stays wherever it isn't the thing tested (*What did she tell that he bought?)
    weak_island:      "What did she [V] him [that he bought ___]?",
    npi_licenser:     "She [VD] him [that anyone had left].",
    comp_exclamative: "She [VD] him [what a linguist he is]!",
    stative:          "She is [VG] him that he is there.",
    content_noun_fact:"She [VD] him [the fact that he left].",
  },

  // desiderative — subject-control infinitive primary
  desid: {
    that_omission:    "She [VD] (that) he would come.",
    comp_inf:         "She [VD] [to leave].",
    comp_for_to:      "She [VD] [for him to leave].",
    extraposition:    "It [VD] her [to leave].",
    ditransitive:     "She [VD] him [that he would come].",
    factive_passive:  "She was [VN] [to leave].",
    derived_nominal:  "her [NOM] to leave",
    comp_interrog:    "She [VD] [whether to leave].",
    ecm:              "He was [VN] [to leave].",  // want-type verbs take expletive objects too; the passive tells them apart
  },

  // directive — agent + addressee, mandative / object-control
  dir: {
    that_omission:    "She [VD] (that) he leave at once.",
    comp_inf:         "She [VD] him [to leave].",
    subjunctive_comp: "She [VD] [that he leave].",
    ditransitive:     "She [VD] him [that he should leave].",
    factive_passive:  "He was [VN] [to leave].",
    np_comp_alt:      "She [VD] [his departure].",
    derived_nominal:  "her [NOM] that he leave",
    comp_interrog:    "She [VD] him [whether to leave].",
    extraposition:    "It [VD] him [to leave].",
    direct_speech:    "She [VD] him: \u201cLeave at once.\u201d",
  },

  // raising-evidential — expletive subject, raising
  raise: {
    that_omission:    "It [VD] (that) he is ill.",
    extraposition:    "It [VD] [that he is ill].",
    comp_inf:         "He [VD] [to be ill].",
    comp_interrog:    "It [VD] [whether he is ill].",
    ditransitive:     "It [VD] her [that he is ill].",
    factive_passive:  "He was [VN] [that he is ill].",
    ecm:              "It [VD] [him to be ill].",
    neg_raising:      "It didn\u2019t [V] he was ill \u2248 It [VD] he wasn\u2019t ill.",
    derived_nominal:  "the [NOM] that he is ill",
    stative:          "It is [VG] that he is ill.",
    factivity:        "It [VD] / didn\u2019t [V] [that he was ill] \u2014 no entailment of \u2018he is ill\u2019.",
    veridicality:     "It [VD] that p \u2014 does the matrix entail p?",
    pro_complement:   "It [VD] so.",
    content_noun_fact:"[The fact that he is ill] [VD].",
  },

  // perception — perceiver + perceived event
  percep: {
    that_omission:    "She [VD] (that) he was nervous.",
    comp_bare_inf:    "She [VD] [him cross the road].",
    comp_small_clause: "She [VD] [him angry].",  // verbless AP small clause
    comp_interrog:    "She [VD] [whether he was nervous].",
    np_comp_alt:      "She [VD] [the news].",
    derived_nominal:  "her [NOM] that he was nervous",
    ditransitive:     "She [VD] her [that he was nervous].",
    factive_passive:  "He was [VN] [that he was nervous].",
    pro_complement:   "She [VD] so.",
    direct_speech:    "She [VD]: \u201cHe was nervous.\u201d",
    extraposition:    "It [VD] her [that he was nervous].",
  },

  // implicative — infinitival, truth-entailing
  impl: {
    comp_inf:         "She [VD] [to escape].",
    that_omission:    "She [VD] (that) she would escape.",
    comp_interrog:    "She [VD] [whether to escape].",
    ditransitive:     "She [VD] him [that she had escaped].",
    factive_passive:  "She was [VN] [to escape].",
    extraposition:    "It [VD] her [to escape].",
    stative:          "She is [VG] to escape.",
    veridicality:     "She [VD] to escape \u2014 entails she escaped (implicative).",
    derived_nominal:  "her [NOM] to escape",
  },
};

// Copular predicates (be glad, be certain …): the frames that hinge on a verbal
// auxiliary are rewritten around the copula; [ADJ] is the bare adjective. Other
// features use the class frames, where "is glad" simply fills the verb slot.
window.DACE_FRAMES.copular = {
  extraposition:    "It was [ADJ] [that he had left].",
  neg_raising:      "She wasn\u2019t [ADJ] he\u2019d come \u2248 She was [ADJ] he wouldn\u2019t come.",
  weak_island:      "What was she [ADJ] [that he bought ___]?",
  factivity:        "She was [ADJ] / wasn\u2019t [ADJ] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
  veridicality:     "She was [ADJ] that p, but p is false \u2014 contradiction?",
  stative:          "She was being [ADJ] that he was there.",
  factive_passive:  null, // n/a — see DACE_COPULAR_NA
  ditransitive:     null,
  raising:          "There was [ADJ] to be a problem.",
  ecm:              "She was [ADJ] [him to be honest].",
};

// --- frame items and versions ---
// A frame ITEM is one template: "<feature>:<table>", where <table> is the frame type
// the template comes from ("base", "psych", "copular", …). Judgements are logged with
// the item and its version (window.DACE_FRAME_VERSIONS, generated into data.js from
// data/frames.lock.json), so a judgement always says which sentence was judged.
// Change a template → `npm test` fails until `npm run frames:lock` bumps its version.

// Where a feature's template comes from for a predicate: { item, tmpl } — tmpl is
// null for a copular n/a cell; the result is null if no table has a frame.
window.daceFrameSource = function (fk, levinClass, display) {
  if (display.startsWith("be ") && fk in DACE_FRAMES.copular) {
    return { item: fk + ":copular", tmpl: DACE_FRAMES.copular[fk] };
  }
  const frameType = window.daceFrameType(levinClass, display);
  const frames = DACE_FRAMES[frameType] || {};
  if (frames[fk] !== undefined) return { item: fk + ":" + frameType, tmpl: frames[fk] };
  if (DACE_FRAMES.base[fk] !== undefined) return { item: fk + ":base", tmpl: DACE_FRAMES.base[fk] };
  return null;
};

// Every template, keyed by item (n/a entries skipped) — what data/frames.lock.json hashes.
window.daceFrameTemplates = function () {
  const out = {};
  for (const [table, frames] of Object.entries(DACE_FRAMES)) {
    for (const [fk, tmpl] of Object.entries(frames)) if (tmpl !== null) out[fk + ":" + table] = tmpl;
  }
  return out;
};

// --- build a test sentence for a feature on a given predicate ---
// Default: HTML for the Explorer, starred when the predicate lacks the feature.
// opts.judge: as the Judge shows it — never starred (the judge decides), the
// that-omission test without "(that)", and the derived nominal left blank ("___"). opts.plain: plain text, voice lines joined
// with " | " (what the judgement log stores as the sentence judged).
window.daceTestSentence = function (fk, on, levinClass, display, _nominalIgnored, opts) {
  const o = opts || {};
  const src = window.daceFrameSource(fk, levinClass, display);
  if (!src) return null;
  if (src.tmpl === null) {
    return o.plain ? null : `<div class="test-line na">Not applicable to a copular predicate: this is a verbal construction.</div>`;
  }
  let tmpl = src.tmpl;
  if (o.judge && fk === "that_omission") {
    const drop = (s) => s.replace(/\(that\) /g, "");
    tmpl = typeof tmpl === "object" ? { active: drop(tmpl.active), passive: drop(tmpl.passive) } : drop(tmpl);
  }

  const frameType = window.daceFrameType(levinClass, display);
  const forms = daceForms(display);
  const verbKey = display.replace(/ /g, "_");
  const passiveLeaning = frameType === "psych" && DACE_PASSIVE_LEANING.has(verbKey);
  // judge mode leaves the nominal blank: showing a candidate would give the answer away
  const nomInfo = !o.judge && window.daceNominal ? window.daceNominal(verbKey, display) : null;
  const nominal = nomInfo ? nomInfo.nom : null;
  const nomCandidate = nomInfo ? nomInfo.candidate : false;

  const b = (s, attrs) => o.plain ? s : `<strong${attrs || ""}>${s}</strong>`;
  function fill(s) {
    return s
      .replace(/\[V3\]/g, b(forms.v3))
      .replace(/\[VD\]/g, b(forms.ved))
      .replace(/\[VN\]/g, b(forms.vn))
      .replace(/\[VG\]/g, b(forms.ving))
      .replace(/\[ADJ\]/g, b(forms.adj || forms.v))
      .replace(/\[NOM\]/g, nominal ? b(nominal, nomCandidate ? ' class="nom-candidate" title="candidate form"' : "") : o.judge ? "___" : "[nominal]")
      .replace(/\[V\]/g, b(forms.v));
  }
  const bad = !o.judge && (DACE_INVERTED.includes(fk) ? !!on : !on);
  const star = bad ? (o.plain ? "*" : `<span class="bad">*</span>`) : "";

  if (typeof tmpl === "object") {
    const aMark = passiveLeaning ? (o.plain ? "(?) " : `<span class="marginal">(?)</span> `) : "";
    if (o.plain) return `${star}${aMark}${fill(tmpl.active)} | ${star}${fill(tmpl.passive)}`;
    return (
      `<div class="test-line">${star}${aMark}${fill(tmpl.active)} <span class="voice">active</span></div>` +
      `<div class="test-line">${star}${fill(tmpl.passive)} <span class="voice">passive</span></div>`
    );
  }
  return o.plain ? `${star}${fill(tmpl)}` : `<div class="test-line">${star}${fill(tmpl)}</div>`;
};

// The Judge's item for a cell: { item, frame_v, text } — text is the plain sentence
// exactly as the Judge shows it. Null for cells with no frame (copular n/a).
window.daceTestItem = function (fk, levinClass, display) {
  const src = window.daceFrameSource(fk, levinClass, display);
  if (!src || src.tmpl === null) return null;
  const versions = window.DACE_FRAME_VERSIONS || {};
  return {
    item: src.item,
    frame_v: versions[src.item] || 0,
    text: window.daceTestSentence(fk, 1, levinClass, display, null, { judge: true, plain: true }),
  };
};

// Plain-text canonical example for a predicate (used as the editable default in the
// Judge and the example line in the Explorer). Uses the that_omission frame, or the
// first feature frame the predicate's class provides.
window.daceDefaultExample = function (verb, display, levinClass) {
  const tryFeatures = ["that_omission", "comp_inf", "direct_speech", "np_comp_alt", "extraposition"];
  for (const fk of tryFeatures) {
    const html = window.daceTestSentence(fk, 1, levinClass, display, null);
    if (html) {
      const d = document.createElement("div");
      d.innerHTML = html;
      d.querySelectorAll(".voice, .marginal, .bad").forEach((n) => n.remove()); // keep the plain sentence only
      const first = d.querySelector(".test-line");
      const text = (first ? first.textContent : d.textContent).trim();
      if (text) return text;
    }
  }
  return "";
};
