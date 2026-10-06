// nominals.js — derived nominal forms for predicates where derived_nominal=1
// Format: verb_key -> nominal string (shown in detail view instead of just a checkmark)

window.DACE_NOMINALS = {
  // Cognitive
  know: "knowledge", realize: "realization", discover: "discovery",
  understand: "understanding", recognize: "recognition", conclude: "conclusion",
  deduce: "deduction", infer: "inference", believe: "belief", think: "thought",
  suppose: "supposition", assume: "assumption", suspect: "suspicion",
  expect: "expectation", doubt: "doubt", notice: "notice", observe: "observation",
  perceive: "perception", sense: "sense", discern: "discernment", divine: "divination",
  intuit: "intuition", grasp: "grasp", fathom: "fathom", register: "registration",
  credit: "credit", appreciate: "appreciation", calculate: "calculation",
  conceive: "conception", conjecture: "conjecture", determine: "determination",
  estimate: "estimate", find: "finding", guess: "guess", judge: "judgment",
  deem: "judgment", consider: "consideration", maintain: "maintenance",
  presume: "presumption", reckon: null, trust: "trust", verify: "verification",
  anticipate: "anticipation", pretend: "pretense", imagine: "imagination",
  dream: "dream", contend: "contention",

  // Communicative
  claim: "claim", assert: "assertion", report: "report", announce: "announcement",
  admit: "admission", deny: "denial", acknowledge: "acknowledgement",
  mention: "mention", insist: "insistence", argue: "argument", suggest: "suggestion",
  warn: "warning", predict: "prediction", confirm: "confirmation",
  reveal: "revelation", prove: "proof", explain: "explanation",
  declare: "declaration", decree: "decree", exclaim: "exclamation",
  guarantee: "guarantee", imply: "implication", indicate: "indication",
  note: "note", proclaim: "proclamation", promise: "promise",
  propose: "proposal", recall: "recollection", state: "statement",
  swear: "oath", vow: "vow", avow: "avowal", protest: "protest",
  profess: "profession", hold: null, opine: null, intimate: "intimation",
  venture: null, object: "objection", grant: null, plead: "plea",
  represent: "representation", threaten: "threat", pledge: "pledge",
  caution: "caution", recommend: "recommendation", admonish: "admonishment",
  declaim: "declamation", adjudge: "judgment", recant: "recantation",
  petition: "petition", concede: "concession",

  // Emotive
  regret: "regret", be_glad: "gladness", be_sorry: "sorrow",
  be_surprised: "surprise", be_proud: "pride", lament: "lament",
  fear: "fear", dread: "dread", worry: "worry", complain: "complaint",
  rejoice: "rejoicing", exult: "exultation", bemoan: "bemoaning",
  bewail: "bewailing", abhor: "abhorrence", welcome: "welcome",
  disdain: "disdain", be_afraid: "fear", be_aware: "awareness",
  be_certain: "certainty", be_confident: "confidence",
  be_conscious: "consciousness", be_convinced: "conviction",
  be_happy: "happiness", be_pleased: "pleasure", be_relieved: "relief",
  be_sad: "sadness", be_satisfied: "satisfaction", be_sure: "certainty",
  be_unaware: null, be_uncertain: "uncertainty", be_worried: "worry",

  // Desiderative
  hope: "hope", wish: "wish", desire: "desire", intend: "intention",
  decide: "decision", prefer: "preference", agree: "agreement",
  accept: "acceptance",

  // Directive
  order: "order", request: "request", command: "command",
  require: "requirement", demand: "demand",

  // Evidential
  emerge: "emergence", transpire: null,

  // Perception (already handled above mostly)
  feel: "feeling",
};

// Generate a nominal candidate for any verb.
// Returns { nom: string, candidate: boolean }
// candidate=true means it is an unattested/constructed form, shown with ?
window.daceNominal = function(verb, display) {
  if (window.DACE_CUSTOM_NOMINALS && window.DACE_CUSTOM_NOMINALS[verb]) return { nom: window.DACE_CUSTOM_NOMINALS[verb], candidate: false, custom: true };
  const known = DACE_NOMINALS[verb];
  if (known) return { nom: known, candidate: false };
  if (known === null) {
    // explicitly marked as having no nominal — generate candidate
  }
  const v = (display || verb).replace(/_/g, ' ').replace(/^be /, '');
  // try common derivational patterns in order of productivity
  let cand;
  if (/ise$|ize$/.test(v))       cand = v.replace(/(ise|ize)$/, 'ization');
  else if (/ify$/.test(v))       cand = v.replace(/ify$/, 'ification');
  else if (/ate$/.test(v))       cand = v.replace(/ate$/, 'ation');
  else if (/[^aeiou]e$/.test(v)) cand = v;          // e.g. "hope" → "hope"
  else if (/[^aeiou]y$/.test(v)) cand = v.replace(/y$/, 'ying');  // e.g. "cry" → "crying"
  else                            cand = v;          // e.g. "weep" → "weep", "sigh" → "sigh"
  return { nom: cand, candidate: true };
};
