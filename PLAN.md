# PLAN.md — DACE

## Status

Production build of the Claude Design handoff (30 Sept 2026): Explorer + Judge, 946 predicates, documentation and an About page with citations. Built and tested locally; **not yet deployed**.

## Launch

- [ ] Decide public or private repo (DEPLOY.md §1, §3).
- [ ] Actions secret `DEPLOY_SSH_KEY`, write deploy key for Cowork.
- [ ] Porkbun A record `dace`, clone on the VPS, Caddy block.
- [ ] Link the DACE card on www.tstephen.com.
- [ ] Server housekeeping: hide `.git` on www/slides; complete `compose/deploy/Caddyfile` (DEPLOY.md §6).
- [ ] Read through `docs-src/about.md` (drafted, including the suggested citation).

## Data

- 245 predicates still have estimated features (·est): 6,370 cells to judge in the Judge.
- `obsess` is listed as a Say verb (4.1) in `docs-src/verb_classes.md` and `src/levin_classes.js` — probably a slip.
- Author order: the Festschrift lists **Anand, Grimshaw & Hacquard**; the interface says "Anand, Hacquard & Grimshaw (2017)" (`src/engine.jsx`, `src/app.jsx`, `src/ahg.js`). Decide whether "AHG" stays as the label.
- Coverage tab (methodology Step 5): `data/sources.js` and `data/concordance.csv` are staged but not built.
- MegaAcceptability v2's full verb list and the MegaNegRaising data are still needed for the concordance (`notes/coverage_report.md`).
- Audit leftovers (`notes/audit_2026-08-17.md`): C2 — state which MegaV scale is authoritative (the build uses `veridicalitynorm`); C4 — registry/concordance mismatches.

## Interface

- Marginal judgements (5) are stored, but the Explorer shows them as absent; give them their own mark.
- If the repo goes public, link each predicate to its line of `data/predicates.csv` on GitHub.
- Optional: self-host the fonts.
- Several annotators judging at once would need a backend — the COMPOSE route (PocketBase behind `reverse_proxy`).

## Licence

Not chosen yet. MegaVeridicality is CC BY-SA 4.0 and DACE redistributes its scores, so CC BY-SA 4.0 for the data is the straightforward option.
