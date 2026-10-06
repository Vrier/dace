// frames.js — class-aware test-sentence frames for DACE predicates.
// Each Levin class maps to an argument-structure FRAME TYPE; each feature has a
// frame template per type (falling back to `base`). Placeholders:
//   [V3] 3rd-sg present · [VD] past/participle · [VG] -ing · [V] base · [NOM] derived nominal
// A template may be a string (one line) or {active, passive} (two voice lines, for psych).

// Levin class -> frame type
window.DACE_FRAME_TYPE = {
  "1.1": "cog", "1.2": "cog", "1.3": "cog", "1.4": "cog",
  "2.1": "cog", "2.2": "cog",
  "3.1": "psych",
  "4.1": "say", "4.2": "tell", "4.3": "say", "4.4": "say",
  "5.1": "desid", "6.1": "dir", "7.1": "raise", "8.1": "percep", "9.1": "impl",
};

// Psych verbs that strongly prefer the passive — active marked (?) marginal
window.DACE_PASSIVE_LEANING = new Set(["abash", "nonplus", "discomfit"]);

// --- conjugation ---
function daceForms(display) {
  const v = display.replace(/_/g, " ");
  const fw = (w, fn) => { const p = w.split(" "); return [fn(p[0]), ...p.slice(1)].join(" "); };
  if (v.startsWith("be ")) {
    const adj = v.slice(3);
    return { v, v3: "is " + adj, ved: "was " + adj, ving: "being " + adj };
  }
  return {
    v,
    v3: fw(v, (w) => /(?:s|x|z|ch|sh)$/.test(w) ? w + "es" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s"),
    ved: fw(v, (w) => w.endsWith("e") ? w + "d" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ied" : w + "ed"),
    ving: fw(v, (w) => (w.endsWith("e") && !w.endsWith("ee")) ? w.slice(0, -1) + "ing" : w + "ing"),
  };
}
window.daceForms = daceForms;

// --- frame templates ---
window.DACE_FRAMES = {
  base: {
    that_omission:    "She [V3] (that) he had left.",
    comp_inf:         "She [V3] [him to be honest].",
    ecm:              "She [V3] [him to be honest].",
    comp_interrog:    "She [V3] [whether / who / where he went].",
    comp_gerund:      "She [V3] [having left].",
    comp_small_clause:"She [V3] [him a fool].",
    np_comp_alt:      "She [V3] [the news].",
    direct_speech:    "She [V3]: \u201cHe was late.\u201d",
    subjunctive_comp: "She [V3] [that he leave].",
    comp_for_to:      "She [V3] [for him to leave].",
    comp_bare_inf:    "She [V3] [him leave].",
    comp_exclamative: "She [V3] [what a linguist he is]!",
    comp_poss_ing:    "She [V3] [his leaving].",
    extraposition:    "It [VD] her [that he had left].",
    raising:          "He [V3] [to be ill].",
    ditransitive:     "She [VD] him [that he had left].",
    factive_passive:  "It is [VD] [that he had left].",
    neg_raising:      "She doesn\u2019t [V] he\u2019ll come \u2248 She [V3] he won\u2019t come.",
    weak_island:      "What did she [V] [that he bought ___]?",
    pro_complement:   "She [V3] so. / She [V3] not.",
    npi_licenser:     "She [V3] [that anyone left].",
    stative:          "She is [VG] that he is there.",
    factivity:        "She [V3] / doesn\u2019t [V] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
    veridicality:     "She [V3] that p, but p is false \u2014 contradiction?",
    content_noun_fact:"She [V3] [the fact that he left].",
    derived_nominal:  "her [NOM] that he left",
    phrasal:          "She [V3] [that he was there].",
    be_copula:        "She is [glad / aware] [that he was wrong].",
  },

  // assertive report — like base, quotative emphasised
  say: {
    direct_speech:    "She [VD]: \u201cHe was late.\u201d",
    comp_inf:         "She [V3] [him to be the culprit].",
    np_comp_alt:      "She [VD] [the news / the decision].",
    derived_nominal:  "her [NOM] that he had left",
  },

  // psych-causative — stimulus subject, experiencer object; active + passive
  psych: {
    that_omission:    { active: "It [VD] her (that) he had left.", passive: "She was [VD] (that) he had left." },
    comp_inf:         { active: "It [VD] her [to find the room empty].", passive: "She was [VD] [to find the room empty]." },
    comp_gerund:      { active: "It [VD] her [his leaving].", passive: "She was [VD] at [his leaving]." },
    np_comp_alt:      "[The news] [VD] her.",
    extraposition:    "It [VD] her [that he had left].",
    factive_passive:  "She was [VD] [that he had left].",
    factivity:        "She was [VD] / wasn\u2019t [VD] [that he left] \u2014 does \u2018he left\u2019 survive negation?",
    veridicality:     "It [VD] her that p \u2014 does the matrix entail p?",
    stative:          "She was [VD] that p (state) vs. eventive active use.",
    content_noun_fact:"[The fact that he left] [VD] her.",
    derived_nominal:  "her [NOM] that he had left",
    comp_interrog:    "It [VD] her [whether he left].",
    direct_speech:    "It [VD] her: \u201cHe left.\u201d",
    ditransitive:     "It [VD] her him [that he left].",
    raising:          "She [VD] [to be there].",
    pro_complement:   "It [VD] her so.",
    neg_raising:      "It doesn\u2019t [V] her he\u2019ll come (\u2260 it [V]s her he won\u2019t).",
    comp_bare_inf:    "It [VD] her [him leave].",
    subjunctive_comp: "It [VD] her [that he leave].",
    be_copula:        "She is [VD] [that he was wrong].",
  },

  // tell / report-to — agent + recipient + clause
  tell: {
    that_omission:    "She [VD] him (that) the meeting was cancelled.",
    comp_inf:         "She [VD] him [to leave].",
    comp_interrog:    "She [VD] him [whether to come].",
    ditransitive:     "She [VD] him [that the meeting was cancelled].",
    factive_passive:  "He was [VD] [that the meeting was cancelled].",
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
    that_omission:    "She [V3] (that) he would come.",
    comp_inf:         "She [V3] [to leave].",
    comp_for_to:      "She [V3] [for him to leave].",
    ecm:              "She [V3] [him to leave].",
    extraposition:    "It [VD] her [to leave].",
    ditransitive:     "She [VD] him [to leave].",
    factive_passive:  "She was [VD] [to leave].",
    derived_nominal:  "her [NOM] to leave / that he would come",
    raising:          "She [V3] [to be there].",
    comp_interrog:    "She [V3] [whether to leave].",
  },

  // directive — agent + addressee, mandative / object-control
  dir: {
    that_omission:    "She [VD] (that) he leave at once.",
    comp_inf:         "She [VD] him [to leave].",
    subjunctive_comp: "She [VD] [that he leave].",
    ditransitive:     "She [VD] him [to leave].",
    factive_passive:  "He was [VD] [to leave].",
    np_comp_alt:      "She [VD] [his departure].",
    derived_nominal:  "her [NOM] that he leave / for him to leave",
    comp_interrog:    "She [VD] him [whether to leave].",
    extraposition:    "It [VD] him [to leave].",
    raising:          "She [VD] [to leave].",
    direct_speech:    "She [VD] him: \u201cLeave at once.\u201d",
  },

  // raising-evidential — expletive subject, raising
  raise: {
    that_omission:    "It [V3] (that) he is ill.",
    raising:          "He [V3] [to be ill]. / There [V3] to be a problem.",
    extraposition:    "It [V3] [that he is ill].",
    comp_inf:         "He [V3] [to be ill].",
    comp_interrog:    "It [V3] [whether he is ill].",
    ditransitive:     "It [V3] her [that he is ill].",
    factive_passive:  "He was [VD] [that he is ill].",
    ecm:              "It [V3] [him to be ill].",
    neg_raising:      "It doesn\u2019t [V] he\u2019s ill \u2248 It [V3] he isn\u2019t ill.",
    derived_nominal:  "the [NOM] that he is ill",
    stative:          "It is [VG] that he is ill.",
    factivity:        "It [V3] / doesn\u2019t [V] [that he is ill] \u2014 no entailment of \u2018he is ill\u2019.",
    veridicality:     "It [V3] that p \u2014 does the matrix entail p?",
    pro_complement:   "It [V3] so.",
    content_noun_fact:"[The fact that he is ill] [V3].",
  },

  // perception — perceiver + perceived event
  percep: {
    that_omission:    "She [V3] (that) he was nervous.",
    comp_bare_inf:    "She [V3] [him leave] / [him leaving].",
    comp_small_clause:"She [V3] [him cross the road].",
    comp_interrog:    "She [V3] [whether he was nervous].",
    comp_inf:         "She [V3] [him leave].",
    np_comp_alt:      "She [V3] [the news].",
    derived_nominal:  "her [NOM] that he was nervous",
    raising:          "She [V3] [to be nervous].",
    ditransitive:     "She [V3] her [that he was nervous].",
    factive_passive:  "He was [VD] [that he was nervous].",
    pro_complement:   "She [V3] so.",
    direct_speech:    "She [V3]: \u201cHe was nervous.\u201d",
    extraposition:    "It [VD] her [that he was nervous].",
  },

  // implicative — infinitival, truth-entailing
  impl: {
    comp_inf:         "She [V3] [to escape].",
    that_omission:    "She [V3] (that) she would escape.",
    comp_interrog:    "She [V3] [whether to escape].",
    ditransitive:     "She [VD] him [to escape].",
    factive_passive:  "She was [VD] [to escape].",
    raising:          "She [V3] [to escape].",
    extraposition:    "It [VD] her [to escape].",
    stative:          "She is [VG] to escape (achievement \u2014 progressive OK).",
    veridicality:     "She [VD] to escape \u2014 entails she escaped (implicative).",
    derived_nominal:  "her [NOM] to escape",
    ecm:              "She [V3] [him to escape].",
  },
};

// --- build a test sentence (HTML) for a feature on a given predicate ---
window.daceTestSentence = function (fk, on, levinClass, display, _nominalIgnored) {
  const frameType = DACE_FRAME_TYPE[levinClass] || "base";
  const frames = DACE_FRAMES[frameType] || {};
  let tmpl = frames[fk];
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
      .replace(/\[VG\]/g, `<strong>${forms.ving}</strong>`)
      .replace(/\[NOM\]/g, nominal ? `<strong${nomCandidate ? ' class="nom-candidate" title="candidate form"' : ''}>${nominal}</strong>` : "[nominal]")
      .replace(/\[V\]/g, `<strong>${forms.v}</strong>`);
  }
  const star = on ? "" : `<span class="bad">*</span>`;

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
