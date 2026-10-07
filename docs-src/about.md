# About DACE

*Dictionary of Alternations in Clause Embedding*

DACE maps the alternation patterns of English clause-embedding predicates: which kinds of complement each predicate takes, which matrix-level alternations it allows, and what it implies about the truth of its complement. It is inspired by Beth Levin's *English Verb Classes and Alternations* (1993) and is developed by [Thomas Stephen](https://www.tstephen.com) at Trinity College Dublin.

This is a preview release (version {{version}}). The data and documentation are still changing.

## What the database contains

DACE currently lists {{predicates}} predicates. Each is coded for {{features}} binary features, documented in [Alternations](#alternations), together with factivity and veridicality. Each predicate is classified three ways: into DACE's own {{semanticClasses}} semantic classes and {{levinClasses}} Levin-style subclasses, documented in [Verb Classes](#verb-classes), and into the four-way classification of Anand, Grimshaw & Hacquard (2017), labelled AHG in the interface.

{{estimated}} predicates were imported from source inventories (the AHG appendix and the Verb Classes membership lists). Their classes follow the source, but their feature values are estimates that have not yet been annotated; the Explorer marks them *est.*

## How values are decided

Feature values are being checked against judgements collected with DACE's annotation tool. Each judge rates a test sentence for a predicate and a feature as acceptable, marginal or unacceptable, or says they can't judge it, and every judgement is kept with the exact sentence shown. A value counts as *consensus* when at least {{minJudges}} judges have rated the cell and at least {{majorityPct}}% of them agree; as *provisional* when fewer judges have rated it so far and all agree; and as *contested* when they disagree, in which case the existing value stands until the editor decides it (*adjudicated*). Of the {{cellsJudgeable}} cells that can be judged, {{cellsConsensus}} are consensus, {{cellsProvisional}} provisional, {{cellsAdjudicated}} adjudicated and {{cellsContested}} contested; the rest carry the editor's original coding or, for imported predicates, estimates. In the Explorer a half-filled dot marks a marginal value, a dotted ring a provisional one and a red ring a contested one; hovering over a dot gives its source and, for judged cells, the number of judges and their agreement. The provenance of every cell is in [cells.csv](/data/cells.csv).

## Sources

**AHG classes.** Anand, Pranav, Jane Grimshaw & Valentine Hacquard. 2017. Sentence embedding predicates, factivity and subjects. In Cleo Condoravdi (ed.), *Lauri Karttunen Festschrift*. Stanford, CA: CSLI Publications. {{ahgTagged}} predicates carry an AHG class.

**Verb classes.** Levin, Beth. 1993. *English Verb Classes and Alternations: A Preliminary Investigation*. Chicago: University of Chicago Press.

**Definitions.** The senses shown for each predicate are loaded live from [Wiktionary](https://en.wiktionary.org/) (CC BY-SA).

## Citing DACE

Stephen, Thomas. 2026. *DACE: Dictionary of Alternations in Clause Embedding*, version {{version}}. https://dace.tstephen.com

## Data

The full table is available as [predicates.csv](/data/predicates.csv).
