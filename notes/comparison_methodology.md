# DACE — Methodology for Cross-Inventory Comparison

*Goal: make DACE (a) the **superset** of clause-embedding predicate inventories in the literature, and (b) a **concordance** that can say, for any predicate, which published lists contain it and what each list claims about it.*

The AHG (2017) reconciliation (`docs/ahg_reconciliation.md`) is the pilot for this
methodology: import the source's list verbatim into per-source columns, measure
overlap, import the gaps with estimated features flagged **·est**, and diff the
source's judgments against DACE's own. This document generalizes that into a
repeatable seven-step pipeline.

---

## Step 1 — Fix the unit of comparison

A "predicate" must mean the same thing across all sources before any counting is
honest. The canonical unit is a **(lemma, POS, sense)** triple, not a string:

- **Lemma key.** Lowercase, underscore-joined particles (`find_out`, `figure_out`),
  following the existing `predicates.csv` convention.
- **POS.** Verb · adjective (DACE `be_*` rows) · noun (future). AHG mixes verbs and
  adjectives in one table; MegaAcceptability is verb-only; Uegaki's lists mix both.
  Without a POS field, overlap numbers are meaningless.
- **Sense.** Multi-sense predicates (*tell*, *admit*, *remember*) appear in
  different sources under different senses. Rather than splitting rows, record
  sense-restricted membership in the concordance cell (see Step 3) and keep the
  existing `*_alt_classes` pattern.
- **Alias table.** A small lookup mapping each source's surface form to the
  canonical key: `be glad` ↔ `be_glad` ↔ `glad (adj)`; `figure out` ↔ `figure_out`;
  BrE/AmE spelling (`realise`/`realize`); hyphenation variants. Every match in
  Step 3 goes through this table, and every *non*-match is manually reviewed once
  before being declared a genuine gap.

## Step 2 — Source registry

One machine-readable record per inventory (`sources.js`), with:

| field | why |
|---|---|
| `id`, citation, year | stable key for concordance columns (`ahg2017`, `mega_acc`, …) |
| **type** | curated theoretical list · experimental dataset · corpus-derived |
| **selection criterion** | what the author counted as "in" — e.g. AHG: that-clause attitude/speech predicates; MegaAcceptability: verbs acceptable in ≥1 of 50 clausal frames; Karttunen: implicatives. Coverage gaps are only *errors* relative to a source's own criterion. |
| **unit & size** | verbs/adjectives/both; n |
| **features annotated** | which columns it can be crosswalked to (Step 4) |
| **method** | author judgment · crowdsourced ratings · corpus counts — determines how much weight a disagreement carries |
| **data availability** | machine-readable (MegaAttitude CSVs) vs. transcribed-from-appendix (AHG) vs. examples-only (Hooper & Thompson) |

### Candidate sources, in priority order

| source | type | unit | what it adds |
|---|---|---|---|
| **AHG 2017** ✅ done | curated | V+Adj | 4-way class, R-of-I, factivity |
| **White & Rawlins, MegaAcceptability v1/v2** | experimental, ~1,000 verbs × 50 frames | V | the broadest verb list in existence; per-frame acceptability ratings → crosswalks to nearly every DACE syntactic column |
| **MegaVeridicality I/II** | experimental | V | gradient veridicality/factivity ratings → diff against DACE `factivity`/`veridicality` |
| **MegaNegRaising** | experimental | V | gradient neg-raising → diff against `neg_raising` |
| **MegaIntensionality / MegaOrientation** | experimental | V | intensionality; temporal orientation (no DACE column yet — candidate new features) |
| **Uegaki 2015 diss.; Uegaki 2019 survey** | curated | V+Adj | responsive / rogative / anti-rogative trichotomy → richer than DACE's binary `comp_interrog` |
| **Theiler, Roelofsen & Aloni 2019** | curated | V | neg-raisers vs. anti-rogativity linkage lists |
| **Spector & Egré 2015** | curated | V | veridically-responsive lists |
| **Karttunen 1971; 2012 (simple & phrasal implicatives)** | curated | V + phrasal | implicative signatures (+/+, +/–, …) — no DACE column yet; `phrasal` flag already exists |
| **Kiparsky & Kiparsky 1970** | curated | V+Adj | the original factive/non-factive lists — small but canonical |
| **Hooper & Thompson 1973 / Hooper 1975** | curated | V | 5-way assertive/semifactive classes → diff against `that_omission`, embedded-V2-style phenomena |
| **Grimshaw 1979** | curated (examples) | V+Adj | Q/P/E selection — the theoretical ancestor of `comp_interrog`/`comp_exclamative` |
| **Grimshaw 2015 (say verbs)** | curated | V | say-by-means / say-plus-force / non-say → the proposed `say_type` column (reconciliation Suggestion 1) |
| **Anand & Hacquard 2014** | curated | V | attitude taxonomy (representational/preferential) |
| **CommitmentBank; Ross & White** | experimental (item-level) | V | projection behavior in context — aggregate to per-predicate scores |

## Step 3 — Membership concordance

A single `concordance.csv`: one row per canonical predicate (union of all
sources), one column per source. Cells are **not** plain booleans:

- `v` — present as verb · `a` — present as adjectival predicate
- `s:<sense>` — present under a restricted sense (e.g. *tell* only as say-verb)
- `x:<reason>` — deliberately excluded by that source's criterion (gap **by design**)
- empty — genuine gap

This is what answers "which lists contain this predicate" — and it must stay
**separate from `predicates.csv`**: membership facts shouldn't bloat the feature
table, and the union list will contain predicates DACE hasn't adopted yet.

## Step 4 — Feature crosswalk

For each source feature, an explicit mapping rule onto DACE columns:

1. **Verbatim first.** Source values land in namespaced columns
   (`ahg_factive`, `mvI_veridicality_mean`) and are *never* overwritten —
   exactly the `ahg_*` precedent. DACE's own judgment stays in the unprefixed column.
2. **Transforms documented.** Binary↔binary is trivial; enums need a mapping
   table (Uegaki's *responsive* ⇒ `comp_interrog=1`); **gradient data needs a
   declared threshold** (e.g. MegaVeridicality mean ≥ θ ⇒ veridical), with θ
   recorded in the source registry so the cutoff is auditable and tweakable.
3. **No counterpart → candidate column.** Features several sources annotate but
   DACE lacks (implicative signature, temporal orientation, anti-rogativity,
   `say_type`) are the highest-value schema additions — they come with free data.

## Step 5 — Coverage metrics

Computed from the concordance, surfaced in a Coverage view in the Explorer:

- **Per-source:** |source|, |source ∩ DACE|, % of source covered by DACE, % of DACE covered by source.
- **Pairwise:** Jaccard overlap matrix across all sources — shows which lists are
  redescriptions of each other vs. genuinely complementary.
- **Intersection profile** (UpSet-style): which predicates are in *all* lists
  (the consensus core — these had better be fully annotated in DACE), and which
  are in exactly one (each source's unique contribution).
- **Gap list:** union − DACE, triaged by Step 6.
- **Orphan list:** DACE − union — predicates *no* published list contains.
  These are either DACE's original contribution (worth highlighting) or noise
  (worth re-checking). Both are interesting; the report shouldn't hide them.

## Step 6 — Adjudication workflow

Two queues, both with the AHG precedent as policy:

- **Gaps (in source, not in DACE).** Import with class-keyed estimated features,
  `notes = "added from <source>; features estimated"`, **·est** flag in the UI,
  and enqueue in DACE Judge for real annotation. *Or* record a documented
  exclusion (`x:<reason>` — e.g. "bouletic infinitival, outside DACE scope"),
  so the same predicate is never re-litigated.
- **Conflicts (both annotate a feature, values differ).** A diff view per
  source-pair (the `factivity` vs `ahg_factive` case). Classify each conflict:
  theoretical disagreement (keep both, note it) · sense ambiguity (annotate the
  sense) · frame-dependence (per-frame field, cf. reconciliation Suggestion 4) ·
  gradience artifact (re-check the threshold θ). Conflicts where a crowdsourced
  source disagrees with a curated one are prime Judge-queue items.

## Step 7 — Completeness beyond the union

The union of published lists is still not "the most complete list" — every list
inherits its predecessors' blind spots. Two independent sweeps:

- **Corpus sweep:** extract all verbs/adjectives attested governing finite or
  interrogative complements in a large parsed corpus; rank unseen lemmas by
  frequency; review the head of the list.
- **Dictionary sweep:** WordNet/VerbNet/FrameNet entries whose frames include
  sentential complements but which appear in no inventory.

Anything surfacing here enters the same Step 6 gap queue.

---

## Deliverables

1. `sources.js` — registry (Step 2)
2. `concordance.csv` — membership matrix (Step 3)
3. Per-source verbatim columns + crosswalk doc (Step 4)
4. **Coverage tab** in DACE Explorer: per-source stats, overlap matrix,
   intersection profile, gap/orphan/conflict lists, with click-through to
   predicate detail and "send to Judge" actions (Steps 5–6)
5. Integrity checks (e.g. AHG's *factive ⇒ no R-of-I* generalization) run
   across all sources, not just AHG
