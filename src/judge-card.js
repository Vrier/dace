// judge-card.js — the words on a Judge card: the question above the test sentence
// and the buttons under it. Shared by the Judge (src/judge-app.jsx) and the LLM
// judge (scripts/llm-judge.mjs), so an LLM is asked exactly what a person sees.
// Responses are the logged values; Yes on the nominal and meaning questions is
// logged as acceptable (= feature 1), No as unacceptable.

// Question types. Most cards ask whether a sentence is acceptable; two ask
// something else, with their own buttons (logged with the same response values):
//   nominal  derived_nominal — Yes / No, then the noun(s);
//   meaning  neg_raising — can the first sentence mean the second? (≈ in the frame)
window.DACE_QUESTION_TYPE = { derived_nominal: "nominal", neg_raising: "meaning" };

window.DACE_RESPONSE_BUTTONS = {
  acceptable:   { label: "Acceptable",   key: "1", cls: "v1",  sub: "the sentence is fine" },
  unacceptable: { label: "Unacceptable", key: "0", cls: "v0",  sub: "the sentence is out" },
  marginal:     { label: "Marginal",     key: "5", cls: "v5",  sub: "?  degraded" },
  cant_judge:   { label: "Can't judge",  key: "9", cls: "vcj", sub: "no clear reading" },
};
window.DACE_QUESTION_BUTTONS = {
  nominal: { acceptable: { label: "Yes", key: "1", cls: "v1", sub: "it has one" }, unacceptable: { label: "No", key: "0", cls: "v0", sub: "no such noun" } },
  meaning: { acceptable: { label: "Yes", key: "1", cls: "v1", sub: "it can mean that" }, unacceptable: { label: "No", key: "0", cls: "v0", sub: "it can't" },
             cant_judge: { label: "Can't tell", key: "9", cls: "vcj", sub: "no clear intuition" } },
};
window.daceCardButtons = function (fk) {
  return window.DACE_QUESTION_BUTTONS[window.DACE_QUESTION_TYPE[fk]] || window.DACE_RESPONSE_BUTTONS;
};

// The question, as HTML (the Judge renders it; the LLM judge strips the tags).
window.daceCardQuestion = function (fk, display) {
  const f = window.DACE_FEATURES[fk];
  const label = f ? f.label : fk;
  const v = "<b>" + display + "</b>";
  if (fk === "derived_nominal") {
    return "Does " + v + " have a nominalisation that takes the same complement — either a noun it is derived from (<i>hope</i> → <i>her hope that…</i>) or one formed with a suffix?" +
      '<ul class="card-suffixes">' + window.DACE_NOMINAL_SUFFIXES.map(([suf, eg]) => "<li><b>" + suf + "</b> <span>" + eg + "</span></li>").join("") + "</ul>";
  }
  if (fk === "neg_raising") return "Read the first sentence with ordinary, unstressed negation. Can it mean what the second sentence says, with the negation understood inside the clause? (<b>Yes</b> = neg-raising.)";
  if (fk === "weak_island") return "Can a <i>wh</i>-phrase be extracted out of " + v + "'s complement? Judge the sentence: <b>Acceptable</b> = bridge verb (feature value 0), <b>Unacceptable</b> = weak island (feature value 1).";
  if (fk === "stative") return "Is " + v + " stative? Judge the progressive: <b>Acceptable</b> = eventive (feature value 0), <b>Unacceptable</b> = stative (feature value 1).";
  return "Does " + v + " license the <b>" + label + "</b> construction?";
};
