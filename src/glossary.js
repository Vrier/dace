// DACE glossary — feature definitions, short examples, and deep-links into the
// source repository's documentation. Each binary/categorical column in
// predicates.csv corresponds to a numbered section of alternations.md; semantic
// classes correspond to Parts of verb_classes.md.

const ALT = "docs/alternations.html";
const VC = "docs/verb_classes.html";

// group keys map to the five Parts of alternations.md
window.DACE_GROUPS = [
  { key: "A", label: "Complement-type selection", note: "What morphosyntactic form the complement may take." },
  { key: "B", label: "Matrix structural alternations", note: "Levin-style rearrangements at the matrix-clause level." },
  { key: "C", label: "Complement–matrix interface", note: "Substitution and polarity that cross the clause boundary." },
  { key: "D", label: "Semantic & inferential properties", note: "Inference patterns over the truth and type of the complement." },
  { key: "E", label: "Morpholexical classification", note: "Properties of the predicate's own lexical form." },
];

// feature key -> { label, group, def, eg, sec, url, kind }
// kind: "binary" | "cat" (categorical) — categorical ones get value glossaries below.
window.DACE_FEATURES = {
  that_omission:    { label: "That-omission",        group: "A", sec: 1,  url: ALT + "#1-the-declarative-that-clause-complement",
    def: "The complementiser <i>that</i> may be dropped before the finite declarative complement.", eg: "She believed (that) he was innocent." ,
    test: "Insert / remove <i>that</i>: <em>She [VERB3] (that) he had left.</em> — is omission natural?" },
  comp_inf:         { label: "Infinitival",          group: "A", sec: 2,  url: ALT + "#2-the-infinitival-complement-alternation",
    def: "Alternates a finite <i>that</i>-clause with a non-finite <i>to</i>-VP complement.", eg: "He expects to win / that he will win." ,
    test: "<em>She [VERB3] [to leave / him to leave].</em> — can the that-clause be replaced by a to-VP?" },
  ecm:              { label: "ECM",                  group: "A", sec: 2,  url: ALT + "#2-the-infinitival-complement-alternation",
    def: "Exceptional Case Marking: the embedded subject surfaces as accusative in the matrix (raising-to-object).", eg: "She believes him to be honest." ,
    test: "<em>She [VERB3] him to be honest.</em> — accusative subject of infinitive, no theta-role from matrix." },
  comp_interrog:    { label: "Interrogative",        group: "A", sec: 3,  url: ALT + "#3-the-interrogative-complement-alternation",
    def: "Responsive predicate — takes an embedded question alongside a declarative.", eg: "She knows whether he left." ,
    test: "<em>She [VERB3] [whether / who / where he went].</em> — replace declarative with wh-clause." },
  comp_gerund:      { label: "Gerund",               group: "A", sec: 4,  url: ALT + "#4-the-gerund-complement-alternation",
    def: "Alternates a finite clause with an <i>-ing</i> gerundive complement.", eg: "He regretted leaving early." ,
    test: "<em>She [VERB3] [leaving early].</em> — replace that-clause with -ing gerund form." },
  comp_small_clause:{ label: "Small clause",         group: "A", sec: 5,  url: ALT + "#5-the-small-clause-complement",
    def: "Selects a verbless predicative phrase as complement.", eg: "I consider him a fool." ,
    test: "<em>She [VERB3] [him a fool / the proposal unacceptable].</em> — predicative phrase without tensed verb." },
  np_comp_alt:      { label: "NP complement",        group: "A", sec: 6,  url: ALT + "#6-the-np-complement-alternation",
    def: "Alternates a finite clause with a noun-phrase object.", eg: "She announced the decision / that she'd resign." ,
    test: "<em>She [VERB3] [the decision / the fact].</em> — replace clause with propositional NP." },
  direct_speech:    { label: "Direct speech",        group: "A", sec: 7,  url: ALT + "#7-the-quotative-direct-speech-alternation",
    def: "Quotative frame — admits a verbatim direct-speech complement.", eg: "\u201cI quit,\u201d she said." ,
    test: "<em>She [VERB3]: \u201cHe was late.\u201d</em> — verbatim quoted string in place of that-clause." },
  subjunctive_comp: { label: "Mandative subj.",      group: "A", sec: 8,  url: ALT + "#8-the-mandative-subjunctive-complement",
    def: "Selects a mandative subjunctive complement (bare base verb).", eg: "She insisted that he be present." ,
    test: "<em>She [VERB3] [that he <b>leave</b>].</em> — bare base form (not inflected) in embedded clause." },
  comp_for_to:      { label: "For-to",               group: "A", sec: 9,  url: ALT + "#9-the-for-to-infinitival-complement",
    def: "Permits an infinitival complement with an overt <i>for</i>-subject.", eg: "She prefers for him to leave." ,
    test: "<em>She [VERB3] [for him to leave].</em> — embedded subject inside for-CP; expletive it possible." },
  comp_bare_inf:    { label: "Bare infinitive",      group: "A", sec: 10, url: ALT + "#10-the-bare-infinitive-vs-participial-progressive-complement",
    def: "Perception frame — bare infinitive vs. participial complement.", eg: "I saw him leave / leaving." ,
    test: "<em>She [VERB3] [him leave / him leaving].</em> — complete event vs. ongoing; aspectual contrast." },
  comp_exclamative: { label: "Wh-exclamative",       group: "A", sec: 11, url: ALT + "#11-the-embedded-wh-exclamative-complement",
    def: "Admits an embedded wh-exclamative complement.", eg: "You won't believe how tall he is." ,
    test: "<em>She [VERB3] [what a linguist he is]!</em> — degree-evaluative wh-phrase; requires factive context." },
  comp_poss_ing:    { label: "Poss-ing",             group: "A", sec: 12, url: ALT + "#12-the-possessive-vs-accusative-gerund-poss-ing-acc-ing",
    def: "Allows a possessive (vs. accusative) subject on the gerund.", eg: "I resented his leaving." ,
    test: "<em>She [VERB3] [<b>his</b> leaving].</em> — genitive/possessive subject on gerund; contrast accusative." },

  extraposition:    { label: "Extraposition",        group: "B", sec: 13, url: ALT + "#13-the-extraposition-alternation",
    def: "Alternates a clausal subject with an expletive-<i>it</i> matrix.", eg: "It surprised me that she came." ,
    test: "<em>It [VERB]-ed her [that he had come].</em> — expletive <i>it</i> subject; clausal subject extraposed." },
  raising:          { label: "Raising",              group: "B", sec: 14, url: ALT + "#14-the-raising-alternation",
    def: "Subject-to-subject raising — impersonal vs. raised-subject frame.", eg: "It seems he left / He seems to have left." ,
    test: "<em>He [VERB]s [to be ill].</em> — raised subject; also: <em>There [VERB]s to be a problem.</em>" },
  ditransitive:     { label: "Ditransitive",         group: "B", sec: 15, url: ALT + "#15-the-recipient-ditransitive-alternation",
    def: "Takes an optional/obligatory recipient NP before the clause.", eg: "She told me that he left." ,
    test: "<em>She [VERB]-ed him [that he should leave].</em> — recipient NP between verb and clause." },
  factive_passive:  { label: "Factive passive",      group: "B", sec: 16, url: ALT + "#16-the-factive-passive",
    def: "Allows the factive passive with expletive subject.", eg: "It is known that he left." ,
    test: "<em>She was [VERB]-ed [that he had left].</em> — experiencer/recipient promoted to subject; clause retained." },
  neg_raising:      { label: "Neg-raising",          group: "B", sec: 17, url: ALT + "#17-negative-raising",
    def: "Matrix negation is interpreted in the embedded clause.", eg: "I don't think he left \u2248 I think he didn't." ,
    test: "<em>I don't [VERB] he'll come \u2248 I [VERB] he won't come.</em> — negation shifts to embedded clause." },
  weak_island:      { label: "Weak island / bridge", group: "B", sec: 18, url: ALT + "#18-weak-island-sensitivity-and-bridge-effects",
    def: "Bridge behaviour: permits long-distance extraction from the complement.", eg: "Who did she say that he saw __?" ,
    test: "<em>What did she [VERB] [that he bought ___]?</em> — wh-extraction from embedded clause; degradation = weak island." },

  pro_complement:   { label: "Pro-complement (so/not)", group: "C", sec: 19, url: ALT + "#19-the-pro-complement-sonot-alternation",
    def: "Allows the proform <i>so</i>/<i>not</i> in place of the clause.", eg: "I think so. / I hope not." ,
    test: "<em>She [VERB]s so. / She [VERB]s not.</em> — proform substitutes for entire embedded clause." },
  npi_licenser:     { label: "NPI licenser",         group: "C", sec: 20, url: ALT + "#20-npi-licensing",
    def: "Licenses negative-polarity items in its complement.", eg: "I doubt he has any money." ,
    test: "<em>She [VERB]s [that anyone left].</em> — strong NPI (<i>any</i>, <i>ever</i>) in complement." },

  stative:          { label: "Stative",              group: "D", sec: 21, url: ALT + "#21-the-stativeachievement-distinction",
    def: "Lexical aspect is stative rather than an achievement/event.", eg: "She knows the answer (state)." ,
    test: "<em>*She is [VERB]-ing that he is there.</em> — progressive anomalous if stative; also: *<em>in ten minutes she [VERB]-ed</em>." },
  factivity:        { label: "Factivity",            group: "D", sec: 22, url: ALT + "#22-factivity", kind: "cat",
    def: "Whether the predicate presupposes the truth of its complement." ,
    test: "<em>She [VERB]s / doesn't [VERB] [that he left].</em> — does \u2018he left\u2019 hold under negation / questioning?" },
  veridicality:     { label: "Veridicality",         group: "D", sec: 23, url: ALT + "#23-veridicality", kind: "cat",
    def: "Whether the truth of the matrix entails the truth of the complement." ,
    test: "<em>She [VERB]s that p, but p is false.</em> — contradiction for veridical; compatible for non-veridical." },
  content_noun_fact:{ label: "Content-noun",         group: "D", sec: 24, url: ALT + "#24-content-noun-compatibility",
    def: "Grammatical with a content noun (<i>the fact / idea that\u2026</i>).", eg: "the fact that he left" ,
    test: "<em>She [VERB3] [the fact / claim / news that he left].</em> — content noun inserted before clause." },

  derived_nominal:  { label: "Derived nominal",      group: "E", sec: 25, url: ALT + "#25-derived-nominals",
    def: "Has a corresponding derived nominal taking the same complement.", eg: "belief / claim / discovery that\u2026" ,
    test: "<em>her [NOMINAL] that p</em> / <em>her [NOMINAL] of having done so</em> — nominal inherits argument structure." },
  phrasal:          { label: "Phrasal",              group: "E", sec: 26, url: ALT + "#26-phrasal-verb-status",
    def: "Multi-word phrasal verb (verb + particle).", eg: "find out, point out, figure out" ,
    test: "<em>She [VERB PARTICLE] [that he was there].</em> — multi-word form; particle is part of the predicate." },
  be_copula:        { label: "Copular",              group: "E", sec: 27, url: ALT + "#27-copular-be-adjectivenoun-constructions",
    def: "A copular <i>be</i> + adjective/noun predicate.", eg: "be glad / be aware that\u2026" ,
    test: "<em>She is [ADJ/N] [that he was wrong].</em> — copula + predicative adjective/noun embedding a clause." },
};

// categorical value glossaries
window.DACE_CATS = {
  factivity: {
    label: "Factivity",
    values: {
      "factive":        { label: "factive",        def: "Presupposes the complement is true (survives negation)." },
      "semi-factive":   { label: "semi-factive",   def: "Factive in unembedded assertions; presupposition is suspendable." },
      "non-factive":    { label: "non-factive",    def: "No truth presupposition; complement merely asserted." },
      "counter-factive":{ label: "counter-factive", def: "Presupposes the complement is false." },
    }
  },
  veridicality: {
    label: "Veridicality",
    values: {
      "veridical":      { label: "veridical",      def: "Matrix truth entails complement truth." },
      "non-veridical":  { label: "non-veridical",  def: "Matrix truth entails nothing about complement truth." },
      "anti-veridical": { label: "anti-veridical", def: "Matrix truth entails complement falsity." },
    }
  }
};

// semantic_class -> { label, def, url, accent (hue token) }
window.DACE_CLASSES = {
  cognitive:     { label: "Cognitive",     url: VC + "#part-i-cognitive-predicates",
    def: "A propositional attitude of a cognitive agent toward a proposition (know, believe, realize)." },
  communicative: { label: "Communicative", url: VC + "#part-iv-communicative-predicates",
    def: "Verbs of saying \u2014 a complement denoting a transmitted message (say, claim, report)." },
  emotive:       { label: "Emotive",       url: VC + "#part-ii-emotive-predicates",
    def: "An affective attitude of an experiencer toward a proposition (regret, fear, be glad)." },
  psych:         { label: "Psych-causative", url: VC + "#part-iii-psych-causative-predicates",
    def: "Object-experiencer causatives where the stimulus clause induces a mental state (amaze, annoy)." },
  desiderative:  { label: "Desiderative",  url: VC + "#part-v-desiderative-predicates",
    def: "Verbs of wanting and intending toward an unrealised state (want, hope, intend)." },
  directive:     { label: "Directive",     url: VC + "#part-vi-directive-predicates",
    def: "Verbs imposing an action on an addressee (order, ask, command, allow)." },
  evidential:    { label: "Raising-evidential", url: VC + "#part-vii-raising-evidential-predicates",
    def: "Raising predicates conveying an evidential source for the proposition (seem, appear, turn out)." },
  perception:    { label: "Perception",    url: VC + "#part-viii-perception-predicates",
    def: "Verbs of direct sensory apprehension (see, hear, notice, feel)." },
  imaginative:   { label: "Imaginative",   url: VC + "#14-imagine-verbs",
    def: "Verbs of mental construction of a non-actual scenario (imagine, dream, pretend)." },
};

// csv: the site's own copy of data/predicates.csv (copied into site/data/ by the build)
window.DACE_LINKS = { alt: ALT, vc: VC, csv: "data/predicates.csv" };

// Minimal pairs shown under the Judge's question: one predicate that clearly has
// the feature and one that clearly lacks it. Edit freely — plain text, * marks the
// bad sentence. (stative has no acceptability contrast; the pair shows the two aspects.)
window.DACE_FEATURE_PAIRS = {
  that_omission:    { good: "She thought he had left.",                 bad: "*She resented he had left." },
  comp_inf:         { good: "She expected to win.",                     bad: "*She doubted to win." },
  ecm:              { good: "She believed him to be honest.",           bad: "*She thought him to be honest." },
  comp_interrog:    { good: "She knew whether he had left.",            bad: "*She believed whether he had left." },
  comp_gerund:      { good: "She regretted leaving early.",             bad: "*She thought leaving early." },
  comp_small_clause:{ good: "She considered him a fool.",               bad: "*She knew him a fool." },
  np_comp_alt:      { good: "She announced the decision.",              bad: "*She thought the decision." },
  direct_speech:    { good: "\u201cI quit,\u201d she said.",             bad: "*\u201cI quit,\u201d she believed." },
  subjunctive_comp: { good: "She insisted that he be present.",         bad: "*She knew that he be present." },
  comp_for_to:      { good: "She preferred for him to leave.",          bad: "*She thought for him to leave." },
  comp_bare_inf:    { good: "She saw him leave.",                       bad: "*She knew him leave." },
  comp_exclamative: { good: "She realized what a linguist he was.",     bad: "*She thought what a linguist he was." },
  comp_poss_ing:    { good: "She resented his leaving.",                bad: "*She saw his leaving." },
  extraposition:    { good: "It surprised her that he had left.",       bad: "*It regretted her that he had left." },
  raising:          { good: "There seemed to be a problem.",            bad: "*There hoped to be a problem." },
  ditransitive:     { good: "She told him that it was over.",           bad: "*She said him that it was over." },
  factive_passive:  { good: "She was surprised that he had left.",      bad: "*She was regretted that he had left." },
  neg_raising:      { good: "I didn\u2019t think he left \u2248 I thought he didn\u2019t.", bad: "I didn\u2019t know he left \u2260 I knew he didn\u2019t." },
  weak_island:      { good: "Who did she say that he saw __?",          bad: "*Who did she regret that he saw __?" },
  pro_complement:   { good: "I think so. / I hope not.",                bad: "*I regret so. / *I regret not." },
  npi_licenser:     { good: "I doubt he has any money.",                bad: "*I know he has any money." },
  stative:          { good: "know: *She is knowing the answer.",        bad: "discover: She is discovering the answer." },
  content_noun_fact:{ good: "She regretted the fact that he had left.", bad: "*She thought the fact that he had left." },
  derived_nominal:  { good: "believe \u2192 her belief that he had left", bad: "think \u2192 *her thinkment / *her thought that he had left" },
};

// Nominalising suffixes, with an example each, for the derived-nominal question.
window.DACE_NOMINAL_SUFFIXES = [
  ["-tion / -sion", "assert \u2192 assertion, decide \u2192 decision"],
  ["-ment", "announce \u2192 announcement"],
  ["-ance / -ence", "assure \u2192 assurance, insist \u2192 insistence"],
  ["-al", "deny \u2192 denial, propose \u2192 proposal"],
  ["-y / -ery", "discover \u2192 discovery"],
  ["-ure", "disclose \u2192 disclosure, fail \u2192 failure"],
  ["zero (noun = verb)", "claim \u2192 claim, hope \u2192 hope, doubt \u2192 doubt"],
];
