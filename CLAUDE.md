# DACE — working notes for Claude Code / Cowork

DACE (*Dictionary of Alternations in Clause Embedding*) is Thomas Stephen's online resource mapping the alternation patterns of English clause-embedding predicates. This repo builds a **static site**: the Explorer at https://dace.tstephen.com and the unlisted Judge (annotation tool) at `/judge/`. It began as a Claude Design handoff (30 Sept 2026); `notes/handoff-migration.md` records what changed in the move to production.

Pushing to `main` deploys: GitHub Actions runs `npm test`, then fast-forwards the clone on the VPS that Caddy serves (`/srv/dace/site`). See `DEPLOY.md`.

## Layout

| Path | What it is |
|---|---|
| `data/predicates.csv` | **Source of truth.** One row per predicate: classes, 26 binary features (0/1, 5 = marginal), factivity, veridicality, notes. |
| `data/ahg_senses.csv` | Every AHG sense of the multi-sense predicates (the CSV holds only the primary sense + alt class names). |
| `data/annotations/` | Committed Judge sidecar exports (example sentences, derived nominals), baked into the build. |
| `data/concordance.csv`, `data/sources.js` | Literature-inventory concordance and source registry for the planned Coverage tab (not loaded by the site yet). |
| `src/` | The two apps. `*.jsx` = React components; plain `*.js` = data/lexicon modules shared by both apps; `explorer.*`/`judge.*` = page templates + CSS. |
| `docs-src/` | Markdown for the Alternations, Verb Classes and About documents (`_page.html` = standalone page template). |
| `provenance/` | Third-party data the build reads (MegaVeridicality v2.1, CC BY-SA 4.0). |
| `scripts/` | `build.mjs`, `check.mjs` (= `npm test`), `serve.mjs`, and `lib/`. |
| `site/` | **Generated** by `npm run build` and committed. Never edit by hand. |
| `notes/` | Audit, methodology, coverage report, AHG reconciliation, handoff migration record. |
| `uploads/` | Copyrighted reference material (e.g. the AHG paper text). Gitignored — never commit. |

## Golden rules

1. Never edit `site/`. Change `src/`, `data/` or `docs-src/`, run `npm run build`, run `npm test`, commit sources **and** `site/` together. CI fails the deploy if `site/` is stale.
2. Don't add derived fields to the CSV. The build computes `display`, `lemma` (adjectival `be_*` rows query Wiktionary by the adjective), `levin_class` (from `src/levin_classes.js`), the per-sense `ahg` list, `megav` and `notesClean`.
3. MegaV is joined from the TSV by one rule: active *that*-clause frame ("NP Ved that S"), else passive ("NP was Ved that S"), else `no_ver` if the verb is in MegaVeridicality, else nothing. Don't hand-enter scores.
4. Heading text in `docs-src/alternations.md` and `verb_classes.md` *is* the anchor (`## 27. Copular *be* …` → `#27-copular-be-adjectivenoun-constructions`). `src/glossary.js`, `levin_classes.js` and `ahg.js` deep-link to them; `npm test` fails if a heading rename breaks a link — update the URL there too.
5. The `src/*.jsx` files are compiled to classic scripts that share **one global scope** (as in the prototype): exports go through `Object.assign(window, …)`, and a top-level name may be declared in only one file (`engine.jsx` owns `useState` etc.; others alias, e.g. `uS`, `useStateD`). `npm test` catches clashes.
6. Never commit `uploads/` or `.deploy-key*`.

## Common tasks

- **Bring in judgements from the Judge.** Judge → Export → *Merged predicates.csv* → replace `data/predicates.csv` with it → `npm run build && npm test` → commit. The export reproduces the file exactly apart from what was judged; when every feature of an imported row has been judged, its `features estimated` note is dropped, which clears its *est.* marker.
- **Publish custom example sentences / nominals.** Judge → Export → *Example sentences (.json)* / *Derived nominals (.json)* → save as `data/annotations/sentences.json` / `nominals.json` → rebuild.
- **Add a predicate.** Add a row to `data/predicates.csv` (lower-case key, underscores for spaces, `be_` prefix for adjectival predicates). If it belongs to a Levin-style class, add it to that class's `members` in `src/levin_classes.js` and the list in `docs-src/verb_classes.md`. If it has several AHG senses, list all of them in `data/ahg_senses.csv`.
- **Edit documentation.** Edit `docs-src/*.md`; the build makes both the standalone pages (`site/docs/*.html`) and the Explorer's side-panel fragments. `about.md` takes `{{placeholders}}` filled from the data (`predicates`, `estimated`, `megav`, `version`, …).
- **Change the interface.** Edit `src/*.jsx` / `src/explorer.css`, rebuild, check with `npm run serve`. The look is the handoff's "Reading Room" direction; readers can switch theme and row density in Settings.
- **Release.** Bump `version` in `package.json` (shown on the About page and in the citation), rebuild, commit, push.
