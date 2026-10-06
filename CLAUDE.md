# DACE — working notes for Claude Code / Cowork

DACE (*Dictionary of Alternations in Clause Embedding*) is Thomas Stephen's online resource mapping the alternation patterns of English clause-embedding predicates. This repo builds a **static site**: the Explorer at https://dace.tstephen.com and the unlisted Judge (annotation tool) at `/judge/`. It began as a Claude Design handoff (30 Sept 2026); `notes/handoff-migration.md` records what changed in the move to production.

Pushing to `main` deploys: GitHub Actions runs `npm test` and, if green, moves branch `live` to that commit; a cron job on the VPS pulls `live` every two minutes into the clone Caddy serves (`/srv/dace/site`). Never push to `live` yourself. See `DEPLOY.md`.

## Layout

| Path | What it is |
|---|---|
| `data/predicates.csv` | **Source of truth.** One row per predicate: classes, 26 binary features (0/1, 5 = marginal), factivity, veridicality, notes. |
| `data/ahg_senses.csv` | Every AHG sense of the multi-sense predicates (the CSV holds only the primary sense + alt class names). |
| `data/annotations/` | Committed sidecar files (example sentences, derived nominals), baked into the build. The Judge's per-judge files come from the server (see *The Judge* below). |
| `data/concordance.csv`, `data/sources.js` | Literature-inventory concordance and source registry for the planned Coverage tab (not loaded by the site yet). |
| `src/` | The two apps. `*.jsx` = React components; plain `*.js` = data/lexicon modules shared by both apps; `explorer.*`/`judge.*` = page templates + CSS; `judge-sync.js` = the Judge's account/server layer. |
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
5. The `src/*.jsx` files are compiled to classic scripts that share **one global scope** (as in the prototype): exports go through `Object.assign(window, …)`, and a top-level name may be declared in only one file (`engine.jsx` owns `useState` etc.; others alias, e.g. `uS`, `useStateD`; `judge-sync.js` declares nothing but `window.DACE_SYNC`). `npm test` catches clashes.
6. Never commit `uploads/` or `.deploy-key*`.

## Common tasks

- **Bring in judgements from the Judge.** Each judge's file is downloaded from the Judge's *Judges* panel (`dace_admin` accounts only) or by a signed-in judge from Export → *My judgements (.csv)*: long format `verb,feature,judgement,flagged,judged_at`. Consolidating several judges into `data/predicates.csv` is still to be designed (PLAN.md). A single judge's *Merged predicates.csv* export reproduces the file exactly apart from what they judged; when every feature of a row has been judged, its `features estimated` note is dropped, which clears its *est.* marker.
- **Publish custom example sentences / nominals.** Download a judge's `annotations.json` (Judges panel) or their own exports → save the `sentences` / `nominals` objects as `data/annotations/sentences.json` / `nominals.json` → rebuild.
- **Add a predicate.** Add a row to `data/predicates.csv` (lower-case key, underscores for spaces, `be_` prefix for adjectival predicates). If it belongs to a Levin-style class, add it to that class's `members` in `src/levin_classes.js` and the list in `docs-src/verb_classes.md`. If it has several AHG senses, list all of them in `data/ahg_senses.csv`.
- **Edit documentation.** Edit `docs-src/*.md`; the build makes both the standalone pages (`site/docs/*.html`) and the Explorer's side-panel fragments. `about.md` takes `{{placeholders}}` filled from the data (`predicates`, `estimated`, `megav`, `version`, …).
- **Change the interface.** Edit `src/*.jsx` / `src/explorer.css`, rebuild, check with `npm run serve`. The look is the handoff's "Reading Room" direction; readers can switch theme and row density in Settings.
- **Make someone a judge.** Judges register on the Judge's own Register tab with a *judge code*. Codes live in COMPOSE's PocketBase: admin dashboard (compose.tstephen.com/_/) → `invite_codes` → new record with `judge` ticked (`max_uses` 0 = unlimited). To let an account see every judge's progress and download their files, tick `dace_admin` on its `users` record. An existing COMPOSE account becomes a judge by ticking `judge` on it.
- **Release.** Bump `version` in `package.json` (shown on the About page and in the citation), rebuild, commit, push.

## The Judge

`/judge/` is behind a login. Judges sign in against **COMPOSE's PocketBase** (`https://compose.tstephen.com`; code in `Vrier/compose`, `server/pb_hooks/dace.pb.js` + migration `1751700008`), using the SDK copied into `site/assets/pocketbase.js` by the build. Anonymous visitors see only the sign-in card; accounts without `judge` see a "not a judge" card. The page stays unlisted (robots.txt, `noindex`).

- **Storage.** One `dace_judgements` record per (judge, predicate): `{ f: {feature: "0"|"1"|"5"}, flags: {feature: true}, t: {feature: ISO time}, sentence, nominal }`. `src/judge-sync.js` loads the judge's records on sign-in, writes every change through at once (queued, retried with backoff; the header shows *saved* / *saving…* / *n unsaved — retrying*) and keeps nothing in localStorage but the SDK's token.
- **Order.** Each judge works through the 24,596 cells in a random order seeded by their account id (`judgeOrder` in `judge-app.jsx`), so it is stable across devices. `‹ ›` move through that order, `U` skips to the next unjudged cell, the coverage map jumps anywhere.
- **Local testing.** Run a throwaway PocketBase from the COMPOSE repo (`cd server && ./pocketbase serve --http 127.0.0.1:8123 --dir /tmp/pbdata --hooksDir ./pb_hooks --migrationsDir ./pb_migrations --publicDir ./pb_public`), create a superuser and a judge invite code, then open `http://localhost:8000/judge/?pb=http://127.0.0.1:8123`.
