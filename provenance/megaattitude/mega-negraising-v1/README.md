# The MegaNegRaising dataset

**Authors:** Hannah YoungEun An and Aaron Steven White

**Contact:** yan2@ur.rochester.edu, aaron.white@rochester.edu

**Version:** 1.1

**Release date:** 29 Aug 2020

## Overview

This MegaNegRaising dataset consists of neg-raising judgments and acceptability judgments for 925 clause-embedding verbs of English in six surface-syntactic frames.  The data were collected on Amazon's Mechanical Turk using [Ibex on Mechanical Turk](https://github.com/aaronstevenwhite/ibex).

For a detailed description of the dataset, the item construction and collection methods, and discussion of how to use a dataset on this scale to address questions in linguistic theory, please see the following paper:

> An, H.Y. & A.S. White. 2019. [The lexical and grammatical sources of neg-raising inferences](https://scholarworks.umass.edu/cgi/viewcontent.cgi?article=1138&context=scil). _Proceedings of the Society for Computation in Linguistics_ 3:23, 220-233.

If you make use of this dataset in a presentation or publication, we ask that you please cite this paper.

## Version history

1.0 (14 Aug 2019): first public release
1.1 (29 Aug 2020): adds sentence with embedded negation

## Description

`mega-negraising-v1.tsv` contains the raw data.

| **Column**        | **Description**                                                                           | **Values**          |
|-------------------|-------------------------------------------------------------------------------------------|---------------------|
| participant       | anonymous integer identifier for participant that provided the response                   | 0...1107            |
| list              | integer identifier for list participant was responding to                                 | 0...247             |
| presentationorder | relative position of item in list                                                         | 1...32              |
| verb              | clause-embedding verb found in the item                                                   | see paper           |
| frame             | clausal complement found in the item                                                      | see paper           |
| tense             | matrix tense found in the item                                                            | `present`, `past`   |
| subject           | matrix subject person found in the item                                                   | `first`, `third`    |
| sentence1         | the sentence with matrix negation                                                         | see paper           |
| sentence2         | the sentence with embedded negation                                                       | see paper           |
| negraising        | neg-raising response                                                                      | 0...1               |
| acceptability     | acceptability response for sentence1                                                      | 0...1               |
| nativeenglish     | whether the participant reported speaking American English natively                       | `True`, `False`     |

`mega-negraising-v1-normalized.tsv` contains data normalized using the procedure described in An & White 2020.

| **Column**        | **Description**                                                                           | **Values**                           |
|-------------------|-------------------------------------------------------------------------------------------|--------------------------------------|
| verb              | lemma of clause-embedding verb found in the item                                          | see paper                            |
| subject           | matrix subject person found in the item                                                   | `first`, `third`                     |
| tense             | matrix tense found in the item                                                            | `present`, `past`                    |
| frame             | clausal complement found in the item                                                      | see paper                            |
| sentence1         | the sentence with matrix negation                                                         | see paper                            |
| sentence2         | the sentence with embedded negation                                                       | see paper                            |
| negraising        | normalized neg-raising response                                                           | 0...1                                |
| acceptability     | normalized acceptability response for sentence1                                           | 0...1                                |