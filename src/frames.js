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
    comp_inf:         "She [VD] [him to be honest].",
    ecm:              "She [VD] [him to be honest].",
    comp_interrog:    "She [VD] [whether / who / where he went].",
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
    raising:          "He [VD] [to be ill].",
    ditransitive:     "She [VD] him [that he had left].",
    factive_passive:  "It is [VN] [that he had left].",
    neg_raising:      "She didn\u2019t [V] he\u2019d come \u2248 She [VD] he wouldn\u2019t come.",
    weak_island:      "What did she [V] [that he bought ___]?",
    pro_complement:   "She [VD] so. / She [VD] not.",
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
    comp_inf:         "She [VD] [him to be the culprit].",
    np_comp_alt:      "She [VD] [the news / the decision].",
    derived_nominal:  "her [NOM] that he had left",
  },

  // psych-causative — stimulus subject, experiencer object; active + passive
  psych: {
    that_omission:    { active: "It [VD] her (that) he had left.", passive: "She was [VN] (that) he had left." },
    comp_inf:         { active: "It [VD] her [to find the room empty].", passive: "She was [VN] [to find the room empty]." },
    comp_gerund:      { active: "It [VD] her [his leaving].", passive: "She was [VN] at [his leaving]." },
    np_comp_alt:      "[The news] [VD] her.",
    extraposition:    "It [VD] her [that he had left].",
    factive_passive:  "She was [VN] [that he had left].",
    factivity:        "She was [VN] / wasn\u2019t [VN] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
    veridicality:     "It [VD] her that p \u2014 does the matrix entail p?",
    stative:          "She was [VN] that p (state) vs. eventive active use.",
    content_noun_fact:"[The fact that he left] [VD] her.",
    derived_nominal:  "her [NOM] that he had left",
    comp_interrog:    "It [VD] her [whether he left].",
    direct_speech:    "It [VD] her: \u201cHe left.\u201d",
    ditransitive:     "It [VD] her him [that he left].",
    raising:          "She [VD] [to be there].",
    pro_complement:   "It [VD] her so.",
    neg_raising:      "It didn\u2019t [V] her he\u2019d come (\u2260 it [VD] her he wouldn\u2019t).",
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
    raising:          "She [VD] him [to be ill].",
    pro_complement:   "She [VD] him so.",
    comp_gerund:      "She [VD] him [leaving].",
    factivity:        "She [VD] him / didn\u2019t [V] him [that p] \u2014 does p survive negation?",
  },

  // desiderative — subject-control infinitive primary
  desid: {
    that_omission:    "She [VD] (that) he would come.",
    comp_inf:         "She [VD] [to leave].",
    comp_for_to:      "She [VD] [for him to leave].",
    ecm:              "She [VD] [him to leave].",
    extraposition:    "It [VD] her [to leave].",
    ditransitive:     "She [VD] him [to leave].",
    factive_passive:  "She was [VN] [to leave].",
    derived_nominal:  "her [NOM] to leave / that he would come",
    raising:          "She [VD] [to be there].",
    comp_interrog:    "She [VD] [whether to leave].",
  },

  // directive — agent + addressee, mandative / object-control
  dir: {
    that_omission:    "She [VD] (that) he leave at once.",
    comp_inf:         "She [VD] him [to leave].",
    subjunctive_comp: "She [VD] [that he leave].",
    ditransitive:     "She [VD] him [to leave].",
    factive_passive:  "He was [VN] [to leave].",
    np_comp_alt:      "She [VD] [his departure].",
    derived_nominal:  "her [NOM] that he leave / for him to leave",
    comp_interrog:    "She [VD] him [whether to leave].",
    extraposition:    "It [VD] him [to leave].",
    raising:          "She [VD] [to leave].",
    direct_speech:    "She [VD] him: \u201cLeave at once.\u201d",
  },

  // raising-evidential — expletive subject, raising
  raise: {
    that_omission:    "It [VD] (that) he is ill.",
    raising:          "He [VD] [to be ill]. / There [VD] to be a problem.",
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
    comp_bare_inf:    "She [VD] [him leave] / [him leaving].",
    comp_small_clause:"She [VD] [him cross the road].",
    comp_interrog:    "She [VD] [whether he was nervous].",
    comp_inf:         "She [VD] [him leave].",
    np_comp_alt:      "She [VD] [the news].",
    derived_nominal:  "her [NOM] that he was nervous",
    raising:          "She [VD] [to be nervous].",
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
    ditransitive:     "She [VD] him [to escape].",
    factive_passive:  "She was [VN] [to escape].",
    raising:          "She [VD] [to escape].",
    extraposition:    "It [VD] her [to escape].",
    stative:          "She is [VG] to escape (achievement \u2014 progressive OK).",
    veridicality:     "She [VD] to escape \u2014 entails she escaped (implicative).",
    derived_nominal:  "her [NOM] to escape",
    ecm:              "She [VD] [him to escape].",
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
};

// --- build a test sentence (HTML) for a feature on a given predicate ---
window.daceTestSentence = function (fk, on, levinClass, display, _nominalIgnored) {
  const frameType = DACE_FRAME_TYPE[levinClass] || "base";
  const frames = DACE_FRAMES[frameType] || {};
  let tmpl = frames[fk];
  if (display.startsWith("be ") && fk in DACE_FRAMES.copular) {
    tmpl = DACE_FRAMES.copular[fk];
    if (tmpl === null) return `<div class="test-line na">Not applicable to a copular predicate: this is a verbal construction.</div>`;
  }
  if (tmpl === undefined) tmpl = DACE_FRAMES.base[fk];
  if (tmpl === undefined) return null;

  const forms = daceForms(display);
  const verbKey = display.replace(/ /g, "_");
  const passiveLeaning = frameType === "psych" && DACE_PASSIVE_LEANING.has(verbKey);
  const nomInfo = window.daceNominal ? window.daceNominal(verbKey, display) : null;
  const nominal = nomInfo ? nomInfo.nom : null;
  const nomCandidate = nomInfo ? nomInfo.candidate : false;

  function fill(s) {
    return s
      .replace(/\[V3\]/g, `<strong>${forms.v3}</strong>`)
      .replace(/\[VD\]/g, `<strong>${forms.ved}</strong>`)
      .replace(/\[VN\]/g, `<strong>${forms.vn}</strong>`)
      .replace(/\[VG\]/g, `<strong>${forms.ving}</strong>`)
      .replace(/\[ADJ\]/g, `<strong>${forms.adj || forms.v}</strong>`)
      .replace(/\[NOM\]/g, nominal ? `<strong${nomCandidate ? ' class="nom-candidate" title="candidate form"' : ''}>${nominal}</strong>` : "[nominal]")
      .replace(/\[V\]/g, `<strong>${forms.v}</strong>`);
  }
  const bad = DACE_INVERTED.includes(fk) ? !!on : !on;
  const star = bad ? `<span class="bad">*</span>` : "";

  if (typeof tmpl === "object") {
    const aMark = passiveLeaning ? `<span class="marginal">(?)</span> ` : "";
    return (
      `<div class="test-line">${star}${aMark}${fill(tmpl.active)} <span class="voice">active</span></div>` +
      `<div class="test-line">${star}${fill(tmpl.passive)} <span class="voice">passive</span></div>`
    );
  }
  return `<div class="test-line">${star}${fill(tmpl)}</div>`;
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
