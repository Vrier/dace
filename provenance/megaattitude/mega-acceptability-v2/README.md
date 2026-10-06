# The MegaAcceptability dataset

**Authors:** Aaron Steven White, Hannah YoungEun An, and Kyle Rawlins

**Contact:** aaron.white@rochester.edu, yan2@ur.rochester.edu, kgr@jhu.edu

**Version:** 2.0

**Release date:** 14 Aug 2019

## Overview

This MegaAcceptability dataset consists of ordinal acceptability judgments for 1,007 clause-embedding verbs of English in 50 surface-syntactic frames and three matrix tenses.  This dataset combines the MegaAcceptability version 1.0 and data collected for 25,000 additional verb-frame pairs on Amazon's Mechanical Turk using [Ibex on Mechanical Turk](https://github.com/aaronstevenwhite/ibex).

For a detailed description of the dataset, the item construction and collection methods, and discussion of how to use a dataset on this scale to address questions in linguistic theory, please see the following papers:

> White, A.S. & K. Rawlins. 2020. [Frequency, acceptability, and selection: A case study of clause-embedding](https://ling.auf.net/lingbuzz/004596/current.pdf). Accepted to _Glossa_.

> An, H.Y. & A.S. White. 2020. [The lexical and grammatical sources of neg-raising inferences](https://scholarworks.umass.edu/cgi/viewcontent.cgi?article=1138&context=scil). _Proceedings of the Society for Computation in Linguistics_ 3:23, 220-233.

> White, A. S. & K. Rawlins. 2016. [A computational model of S-selection](https://journals.linguisticsociety.org/proceedings/index.php/SALT/article/view/26.641/3662). In M. Moroney, C-R. Little, J. Collard & D. Burgdorf (eds.), *Semantics and Linguistic Theory* 26, 641-663. Ithaca, NY: CLC Publications.

If you make use of this dataset in a presentation or publication, we ask that you please cite these papers.

## Version history

1.0: first public release, 30 Oct 2016
1.1: formatting update, 14 Aug 2019
2.0: first public release, 14 Aug 2019

## Description

| **Column**        | **Description**                                                                           | **Values**                           |
|-------------------|-------------------------------------------------------------------------------------------|--------------------------------------|
| participant       | anonymous integer identifier for participant that provided the response                   | 0...1293                             |
| list              | integer identifier for list participant was responding to                                 | 0...1499                             |
| presentationorder | relative position of item in list                                                         | 1...50                               |
| verb              | clause-embedding verb found in the item                                                   | see paper                            |
| frame             | clausal complement found in the item                                                      | see paper                            |
| tense             | matrix tense found in the item                                                            | `present`, `past`, `past_progressive`|
| response          | ordinal scale acceptability response                                                      | 1...7                                |
| nativeenglish     | whether the participant reported speaking American English natively                       | `True`, `False`                      |
| sentence          | sentence that was judged                                                                  | see paper                            |
| version           | MegaAcceptability dataset version where the judgment first appeared                       | 1, 2                                 |

## Notes

* A javascript error produced 10 NA values for `response`, none of which affect the same verb-frame pair. All such values are inherited from version 1.x
