# Provenance — third-party data read by the build

## MegaVeridicality v2.1 (`megaattitude/mega-veridicality-v2.1/`)

Aaron Steven White & Kyle Rawlins, released 29 July 2020 — http://megaattitude.io/ — licensed **CC BY-SA 4.0** (`LICENSE`, `README.md` from the release). Please cite:

- White, A. S. & K. Rawlins. 2018. The role of veridicality and factivity in clause selection. In *Proceedings of the 48th Meeting of the North East Linguistic Society*.
- White, A. S., R. Rudinger, K. Rawlins & B. Van Durme. 2018. Lexicosyntactic inference in neural models. In *Proceedings of EMNLP 2018*.

The build reads `mega-veridicality-v2.1-normalized.tsv` and gives each predicate the `veridicalitynorm` of its *that*-clause frame: "NP Ved that S" if present, otherwise "NP was Ved that S"; `no_ver` if the verb is in the dataset without either; nothing if it isn't in the dataset. Values are rounded to two decimals.

`megaattitude/mega-veridicality-by-verb.csv` is an older per-verb summary on a **different scale** (raw `veridicalitylike` means). It is kept for reference; the build does not use it.

## Other MegaAttitude datasets (READMEs only)

MegaAcceptability v2 and single-verb v1, and MegaNegRaising v1 (all CC BY-SA 4.0) informed `data/concordance.csv`. Their TSVs aren't vendored because the build doesn't use them; download them from http://megaattitude.io/ if needed. MegaIntensionality v1 (also used for the concordance) had no LICENSE file at its megaattitude.io path as of Oct 2026 — confirm its terms before committing it.
