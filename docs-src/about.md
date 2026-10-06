# About DACE

*Dictionary of Alternations in Clause Embedding*

DACE maps the alternation patterns of English clause-embedding predicates: which kinds of complement each predicate takes, which matrix-level alternations it allows, and what it implies about the truth of its complement. It is inspired by Beth Levin's *English Verb Classes and Alternations* (1993) and is developed by [Thomas Stephen](https://www.tstephen.com) at Trinity College Dublin.

This is a preview release (version {{version}}). The data and documentation are still changing.

## What the database contains

DACE currently lists {{predicates}} predicates. Each is coded for {{features}} binary features, documented in [Alternations](#alternations), together with factivity and veridicality. Each predicate is classified three ways: into DACE's own {{semanticClasses}} semantic classes and {{levinClasses}} Levin-style subclasses, documented in [Verb Classes](#verb-classes), and into the four-way classification of Anand, Grimshaw & Hacquard (2017), labelled AHG in the interface.

{{estimated}} predicates were imported from source inventories (the AHG appendix and the Verb Classes membership lists). Their classes follow the source, but their feature values are estimates that have not yet been annotated; the Explorer marks them *est.*

## Sources

**AHG classes.** Anand, Pranav, Jane Grimshaw & Valentine Hacquard. 2017. Sentence embedding predicates, factivity and subjects. In Cleo Condoravdi (ed.), *Lauri Karttunen Festschrift*. Stanford, CA: CSLI Publications. {{ahgTagged}} predicates carry an AHG class.

**Verb classes.** Levin, Beth. 1993. *English Verb Classes and Alternations: A Preliminary Investigation*. Chicago: University of Chicago Press.

**Veridicality ratings.** {{megav}} predicates show the normalized veridicality rating of their *that*-clause frame from MegaVeridicality v2.1 by Aaron Steven White and Kyle Rawlins ([megaattitude.io](http://megaattitude.io/)), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). If you use these values, please also cite White, Aaron Steven & Kyle Rawlins. 2018. The role of veridicality and factivity in clause selection. In *Proceedings of the 48th Meeting of the North East Linguistic Society*; and White, Aaron Steven, Rachel Rudinger, Kyle Rawlins & Benjamin Van Durme. 2018. Lexicosyntactic inference in neural models. In *Proceedings of the 2018 Conference on Empirical Methods in Natural Language Processing*.

**Definitions.** The senses shown for each predicate are loaded live from [Wiktionary](https://en.wiktionary.org/) (CC BY-SA).

## Citing DACE

Stephen, Thomas. 2026. *DACE: Dictionary of Alternations in Clause Embedding*, version {{version}}. https://dace.tstephen.com

## Data

The full table is available as [predicates.csv](/data/predicates.csv).
