// ahg.js — genuine Anand, Grimshaw & Hacquard (2017) classification.
// Distinct from the project's own 9-way `semantic_class` scheme (now surfaced as "Semantic").
// Source: "Sentence Embedding Predicates, Factivity and Subjects", Karttunen FestSchrift, Appendix.
const AHG_VC = "docs/verb_classes.html";

window.DACE_AHG_CLASSES = {
  communicative: {
    label: "Communicative",
    def: "Expresses a communicative act or discourse move (say, claim, report). Uniquely licenses agentive Repository-of-Information subjects (the book claims…), and — per AHG's factivity generalization — is never truly factive.",
    paper: "§1.2 · the subject & factivity generalizations",
  },
  doxastic: {
    label: "Doxastic",
    def: "Expresses a belief or cognitive state (believe, know, conclude, assume). Requires a sentient subject — unless the predicate also carries a communicative sense, which is why ~28% nonetheless admit R-of-I subjects.",
    paper: "§1.2.5",
  },
  emotive: {
    label: "Emotive",
    def: "Expresses an affective attitude (love, hate, fear, regret). Sentient experiencers only, save for a handful of emotive-doxastics (hope, fear, worry, deplore) that can report an expressed preference.",
    paper: "§1.2.5",
  },
  inferential: {
    label: "Inferential",
    def: "Reports a demonstration or evidential inference (show, demonstrate, imply, prove). Accepts the widest range of subjects — sentient, R-of-I, and bare inanimates (the bloody glove shows…).",
    paper: "§1.2.1",
  },
};

window.DACE_AHG_ORDER = ["communicative", "doxastic", "emotive", "inferential"];

window.DACE_AHG_COLORS = {
  communicative: "#2f7d63",
  doxastic:      "#3b6ea5",
  emotive:       "#bd6a4c",
  inferential:   "#8a5cb8",
};

// membership of predicate p in a given AHG class -> { c, r, f } or null
window.daceAhgMembership = (p, cls) => ((p && p.ahg) || []).find((x) => x.c === cls) || null;

// the four appendix cells, in display order (R-of-I primary, factivity secondary)
window.DACE_AHG_CELLS = [
  { r: 1, f: 1, label: "Allows R-of-I · factive",      short: "√ R-of-I · factive" },
  { r: 1, f: 0, label: "Allows R-of-I · non-factive",  short: "√ R-of-I · non-factive" },
  { r: 0, f: 1, label: "No R-of-I · factive",          short: "# R-of-I · factive" },
  { r: 0, f: 0, label: "No R-of-I · non-factive",      short: "# R-of-I · non-factive" },
];
