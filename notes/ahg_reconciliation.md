# AHG Reconciliation — Anand, Grimshaw & Hacquard (2017) vs. DACE

_Source: "Sentence Embedding Predicates, Factivity and Subjects" (Lauri Karttunen FestSchrift). Appendix transcribed and OCR-corrected._

## What was added

Four columns now live in `predicates.csv` / `data.js`, populated **only from the paper's Appendix** (not the project's own 9-way `semantic_class`):

| column | meaning |
|---|---|
| `ahg_class` | primary AHG category: communicative · doxastic · emotive · inferential |
| `ahg_rofi` | 1 = licenses an **agentive Repository-of-Information** subject (*the book claims…*); 0 = does not |
| `ahg_factive` | AHG's own factivity verdict (1/0) — note: *no communicative is factive* |
| `ahg_alt_classes` | other AHG tables the verb also appears in (multi-sense predicates) |
| `ahg_subclass` | finer subclass from the paper (see below) |

**Coverage:** after importing the appendix, **565 of 933** DACE predicates carry an AHG tag.

## Subclasses (`ahg_subclass`)

The paper sub-divides three of the four classes; these are now recorded verbatim:

- **Doxastic** R-of-I-licensers split four ways (paper ex. 27): **communicative-sense** (*calculate, conclude, deem, predict, judge…*), **forecast** (*anticipate, envisage, foresee, prognosticate, project*), **assumption** (*assume, presuppose, posit, surmise, trust…*), **reasoning** (*diagnose, establish, reason, reckon, verify*). These are the predicates that admit *book* subjects precisely because they don't require a sentient thinker.
- **Communicative** uses Grimshaw's (2015) say-verb typology: **say-by-means** (manner of production — *whisper, mumble, cackle, holler…*; these reject R-of-I subjects) and **non-say** (*impart, guarantee*, plus fn. 3's *tell, publish, record, verbalize, add in, put in, throw in*). The say-plus-force vs. affective-attitude split is exemplified but not exhaustively listed in the paper, so those rows are intentionally left blank rather than guessed.
- **Emotive** R-of-I-licensers are tagged **preference-reporting** (paper ex. 25: *hope, fear, worry, deplore, exult, despair, optimistic…*) — when they take a *book* subject they report an expressed preference.

## Item 3 — Appendix predicates absent from the DACE list (now imported)

The appendix held **232 predicates not in the original 701** (116 verbs + 116 adjectival/participial predicates). **All 232 have now been added** to `predicates.csv` → `data.js` → both Judge files, each placed in its AHG class/subclass per the paper. Adjectival predicates use the DACE `be_*` convention (`be_copula=1`). Every added row carries `notes = "added from AHG (2017) appendix; features estimated"` and is flagged in the UI with an **·est** marker — its AHG class is the paper's, but its syntactic feature values (that-omission, ECM, interrogative complements, …) are **best-guess defaults keyed off the class** and need real annotation before they're trusted.

The original breakdown of what was missing:

### Communicative

**Verbs missing (108):** advocate, animadvert, bawl, beef, beseech, blabber, bleat, blubber, bluster, bray, bring in, burble, cite, clear, concur, continue, counter, criticize, demur, expostulate, go on, gripe, grouse, hazard, hypothesize, impart, josh, kvetch, leave out, note down, overemphasize, philosophize, put out, radio in, ramble, reemphasize, reflect, relay, remonstrate, soliloquize, speculate, telegraph, tout, unveil, add in, apprise, blurt, boom, burst out, call, call in, call out, carol, chime in, chirp, chortle, chuckle, cluck, coo, cry out, editorialize, explode, fib, frown, gesticulate, gesture, get in, glare, grimace, grin, harrumph, jot down, laugh, pronounce, put in, rage, read out, recite, roar, shout out, shrug, sign, smirk, sneer, snicker, sniff, snuffle, sputter, squall, squawk, squeak, text, throw in, tisk, trill, trumpet, twitter, verbalize, warble, wave, wheeze, whistle, whoop, yammer, yap, yell out, yelp, yodel

**Adjectival predicates (9):** correct, emphatic, explicit, incorrect, insistent, right, steadfast, unanimous, vehement

### Doxastic

**Verbs missing (12):** envisage, postulate, prognosticate, project, absorb, catch, get, glimpse, mystified, puzzled, smell, internalize

**Adjectival predicates (14):** ignorant, mindful, uninformed, unsurprised, well-aware, clueless, cocksure, cognizant, doubtful, dubious, paranoid, positive, unconvinced, unsure

### Inferential

**Verbs missing (6):** betray, highlight, illustrate, implicate, manifest, teach

### Emotive

**Verbs missing (10):** obsess, admire, adore, bear, cherish, face, respect, stand, tolerate, value

**Adjectival predicates (96):** adamant, hopeful, optimistic, pessimistic, sanguine, suspicious, abashed, aggrieved, aghast, amazed, amused, anguished, apologetic, apoplectic, appalled, appreciative, astonished, astounded, awed, befuddled, bemused, bewildered, bitter, concerned, delirious, depressed, depressing, despairing, disgruntled, disgusted, dismayed, displeased, dissatisfied, distraught, ecstatic, elated, embarrassed, envious, euphoric, exhilarated, exultant, flabbergasted, fortunate, frantic, frightened, giddy, gleeful, grateful, gratified, heartbroken, heartsick, impatient, incredulous, indignant, irate, joyful, jubilant, leery, livid, lucky, nervous, oblivious, overjoyed, pained, peeved, pissed, regretful, remorseful, resentful, scared, self-aware, shocked, sorrowful, unabashed, unconcerned, uneasy, unfazed, ungrateful, unhappy, unimpressed, unlucky, uptight, wistful, wrathful, anxious, apprehensive, fearful, fretful, keen, maniacal, overconfident, petrified, resolute, self-assured, upbeat, wary

> **Note on the adjectival entries.** AHG's emotive and doxastic tables deliberately mix verbs with adjectival predicates (*be aware / glad / optimistic that…*) because their two generalizations are about the **predicate**, not its part of speech. DACE is verb-centric and carries only a handful as `be_*` copular rows (`be_glad`, `be_surprised`, …). These are *gaps by design*, not errors — see Suggestion 3 below.

---

## Item 4 — Suggestions for improving the work from this paper

These are options, not changes already made — flagged for your call before building.

1. **Capture the say-verb decomposition (Grimshaw 2015).** The single most load-bearing distinction in the paper is *why* some communicatives reject R-of-I subjects: **say-by-means** verbs (*whisper, mutter, shout* — physical emission) exclude them, while **say-plus-force** (*assert, report*) and **say-attitude** (*bitch, gripe*) allow them. That maps cleanly to a new `say_type` enum (`say-means` / `say-force` / `say-attitude` / `non-say`) and would *explain* the `ahg_rofi` column rather than just record it. The paper's "a few words" complement test (§(21)) is a ready-made diagnostic and could become a DACE feature column.

2. **Restore the boldface sub-annotations lost to OCR.** The appendix marks, in boldface: (a) doxastics/emotives that *also have a communicative sense* (the explanation for stray R-of-I subjects), and (b) communicatives that are *not* say verbs (*impart, guarantee* — 34 of 319). These are exactly the multi-sense cases we now flag with `ahg_alt_classes`; transcribing the boldface from a clean PDF would let us mark them precisely rather than inferring from table overlap.

3. **Add the doxastic sub-classes.** The paper explicitly partitions R-of-I-licensing doxastics into **Forecast** (*anticipate, foresee, predict, project*), **Assume** (*appreciate, presuppose, posit, surmise, trust*), and **Reason** (*diagnose, reason, reckon, verify*). These are enumerated verbatim — a low-risk `ahg_doxastic_subclass` column.

4. **Model the frame–factivity alternation (Table 3).** *worry, obsess, concern, distress, upset, grieve…* flip factivity **and** R-of-I admissibility depending on frame (`that-clause-V-DP` vs `DP-V-that-clause` vs `DP-be-Adj-that-clause`). DACE already tracks `extraposition`; a per-frame factivity field would let the Explorer show the paper's headline argument that *communicative ⇒ never factive* directly.

5. **Surface the negative correlation.** The paper's central empirical claim — *no factive predicate admits an agentive R-of-I subject* — is now checkable in our data (`ahg_factive=1` ⇒ `ahg_rofi=0` should hold for all but the discussed counterexamples *exult, deplore, appreciate, discern, make out, recognize*). Worth a one-panel "generalizations" dashboard, and a data-integrity check that flags violations.

6. **Reconcile DACE `factivity` against `ahg_factive`.** The two columns disagree in interesting places (e.g. DACE marks several communicatives factive that AHG argue only *appear* factive — *tell, admit, acknowledge*). A diff view would make those theory-level disagreements explicit instead of hiding them.

7. **Add the missing manner-of-speaking verbs (optional).** ~110 communicative verbs in the appendix aren't in DACE (mostly say-by-means: *bawl, bleat, burble, chortle, holler, trill, yodel…*). If DACE aims to be a complete that-clause inventory they're worth importing; if it's a curated core, they're reasonably excluded. Your call. **(Done — see Item 3.)**

---

## Which DACE predicates are still unclassified (368), and where they'd fit

These predicates have no AHG tag because they sit outside the paper's four that-clause attitude/speech categories. Grouped by DACE `semantic_class`, with a suggested AHG home:

| DACE class | n | examples | suggested broad class |
|---|---|---|---|
| **psych** | 151 | amaze, annoy, delight, frighten, astonish, console, reassure, persuade | **Emotive–causative.** AHG's emotives are *subject*-experiencers (*I love that p*); these are the *object*-experiencer causative twins (*that p amazed me*). A natural 5th bucket — many are factive (*the fact that p delighted her*) and would sharpen the factivity story. |
| **communicative** | 142 | describe, discuss, convey, broadcast, email, communicate, debate, denounce | **Communicative (non-say).** The paper itself notes (§1.2.4) that *discuss, speak, utter* "report events of linguistic production" and are **not** say verbs, yet pattern with say-plus-force on subjects. These extend the Communicative class as its non-say wing. |
| **cognitive** | 32 | assess, evaluate, contemplate, identify, gauge, ponder, fathom | **Doxastic.** Cognitive acts adjacent to the *assumption*/*reasoning* subclasses; *assess/evaluate/gauge* especially look like R-of-I-licensers (*the report assesses that…*) and could be tested against the subject diagnostic. |
| **emotive** | 20 | mourn, panic, cringe, bemoan, bewail, welcome, disdain | **Emotive** (a few — *bemoan, bewail* — are emotive-**communicative**, like the existing *lament*). |
| **directive** | 9 | require, permit, allow, force, mandate, prescribe | **Outside AHG.** Bouletic/deontic; embed infinitives & subjunctives, not declarative that-clause attitudes. Keep separate. |
| **evidential** | 7 | seem, appear, turn out, transpire, emerge, happen, follow | **Inferential-adjacent but subjectless.** Raising verbs with no thematic subject, so the R-of-I diagnostic doesn't apply; best left as their own evidential/raising class. |
| **desiderative** | 4 | want, intend, plan, consent | **Outside AHG.** Bouletic, infinitival. |
| **perception** | 3 | watch, spot, witness | **Outside AHG.** Direct perception (*see that p* is doxastic, but these are eventive perception). |

**Net recommendation:** the two large buckets — **psych (151)** and **non-say communicative (142)** — are the real opportunity. Adding an **Emotive–causative** class and folding the non-say verba dicendi into **Communicative** would lift AHG coverage from 565/933 to ~860/933 and let the Explorer state the paper's two generalizations across nearly the whole inventory. The remaining ~70 (directives, desideratives, raising-evidentials, perception) are genuinely out of scope and best left untagged. I've held off on these pending your go-ahead, since each implies a theoretical commitment the paper doesn't make explicitly.

