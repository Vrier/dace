# PLAN.md — DACE

## Status

Production build of the Claude Design handoff (30 Sept 2026): Explorer + Judge, 946 predicates, documentation and an About page with citations. Live at https://dace.tstephen.com since 5 Oct 2026 (public repo, `live`-branch cron deploy — DEPLOY.md). The Judge is behind a login since 6 Oct 2026 (*Judge accounts* below).

## Launch

- [x] Public repo, DNS, clone on the VPS, Caddy block, `live`-branch cron (deploy/setup-server.sh).
- [ ] Link the DACE card on www.tstephen.com.
- [ ] Server housekeeping: hide `.git` on www/slides; complete `compose/deploy/Caddyfile` (DEPLOY.md).
- [ ] Read through `docs-src/about.md` (drafted, including the suggested citation).

## Data

- 245 predicates still have estimated features (·est). Copular predicates' factive-passive and ditransitive cells are fixed at 0 and not judged (Oct 2026), and `phrasal` / `be_copula` are never judged, so the judgeable grid is 22,400 cells.
- `obsess` is listed as a Say verb (4.1) in `docs-src/verb_classes.md` and `src/levin_classes.js` — probably a slip.
- Coverage tab (methodology Step 5): `data/sources.js` and `data/concordance.csv` are staged but not built.
- MegaAcceptability v2's full verb list and the MegaNegRaising data are still needed for the concordance (`notes/coverage_report.md`); `provenance/` is now gitignored, so they stay local.
- Audit leftovers (`notes/audit_2026-08-17.md`): C4 — registry/concordance mismatches. (C2, the MegaV scale question, is moot since the scores were removed.)

## Interface

- Marginal judgements (5) are stored, but the Explorer shows them as absent; give them their own mark (now part of *Judgement data* phase 5).
- Link each predicate to its line of `data/predicates.csv` on GitHub (the repo is public).
- Optional: self-host the fonts.
- Several annotators judging at once: see *Judge accounts* and *Judgement data* below.

## Licence

Not chosen yet, and no longer urgent: DACE redistributes no third-party data since the MegaVeridicality scores were removed (6 Oct 2026; the join logic is in git history, commit before this one, if they ever come back under a licence decision). The `factivity`/`veridicality` columns are DACE's own coding.

## Judge accounts (October 2026)

Put `/judge/` behind a login and store each judge's progress on the server, so several people can judge independently and Thomas can pull a CSV per judge at any time.

**Decisions.** Same PocketBase instance and `users` table as COMPOSE; a `judge` boolean on `users`; DACE-specific invite codes (`invite_codes.judge = true`) entered on the Judge's own Register tab; a per-judge random queue order; one CSV per judge (consolidation later); everyone sees the same test sentences; existing localStorage judgements are abandoned (Thomas starts a fresh account); anonymous visitors see only the sign-in card.

### Backend — in `Vrier/compose`, `server/` (PocketBase loads hooks from one directory; deploys via COMPOSE's SSH workflow)

- Migration `1751700008_dace_judge.js`:
  - `users` += `judge` (bool), `dace_admin` (bool). Both set only in the admin dashboard or by the DACE register hook; `users_guard.pb.js` pins them like `role`.
  - `invite_codes` += `judge` (bool). A judge code works only on `/api/dace/register`; `/api/compose/register` rejects it.
  - New collection `dace_judgements`: `user` (relation → users, cascade), `verb` (text), `data` (json: `{ f: { <feature>: "0"|"1"|"5" }, flags: { <feature>: true }, t: { <feature>: <iso time> }, sentence, nominal }`), `updated` (autodate). Unique index `(user, verb)`. Rules: list/view/update/delete `user = @request.auth.id && @request.auth.judge = true`; create additionally `@request.body.user = @request.auth.id`. One record per (judge, predicate), so at most 946 records per judge and one small update per keypress.
  - Rate limits: add `POST /api/dace/register` 5/min (reassign the whole `rateLimits` object, keeping COMPOSE's rules).
- Hook `dace.pb.js`:
  - `POST /api/dace/register { email, password, inviteCode }` — like `signup.pb.js`, but requires a code with `judge = true`; creates the account `verified`, `role = student`, `judge = true`; increments `used_count`.
  - `GET /api/dace/judges` (requires `dace_admin`) — every account with `judge = true`: id, email, cells judged, flagged, last activity.
  - `GET /api/dace/judges/{id}/judgements.csv` (requires `dace_admin`) — long format: `verb,feature,judgement,flagged,judged_at`, rendered from the DB on request, so it is always current and partial files are visible as judging goes on.
  - `GET /api/dace/judges/{id}/annotations.json` (requires `dace_admin`) — that judge's sentences and nominals, in the existing sidecar format.
- `users_guard.pb.js`: also pin `judge` and `dace_admin`.

### Judge — in this repo

- `package.json` += `pocketbase` 0.27.0 (dev); the build copies `pocketbase.umd.js` to `site/assets/pocketbase.js`, loaded by `judge/index.html` only. API base `https://compose.tstephen.com` (overridable with `?pb=http://127.0.0.1:8090` for local testing against a dev PocketBase).
- `src/judge-sync.js` (plain, shared-scope rules apply): PocketBase client, sign-in/register/sign-out, load the user's `dace_judgements` into memory, write-through on each judgement/flag/sentence/nominal, a retry queue and an "unsaved" indicator when the server can't be reached. No localStorage for judgements any more — the server is the source of truth, so two devices or two accounts never mix.
- `src/judge-app.jsx`:
  - Sign-in card (port of COMPOSE `dash.jsx` AuthView into the Reading Room look): Log in / Register tabs, email, password, invite code, no-email note. Signed-in accounts without `judge` see a short "this account isn't a judge" card with a sign-out button.
  - Queue: the same 24,596 cells, shuffled with a seeded PRNG keyed on the user's id, so each judge's order is random but stable across devices and reloads.
  - Header shows judged / remaining, the signed-in email and Sign out. `‹ ›` and the coverage map navigate the judge's own order; `U` jumps to the next unjudged.
  - Export menu keeps only the judge's own CSV (handy for them); Import and Reset go (Reset would now mean deleting server records).
  - `dace_admin` accounts get a "Judges" panel: the list from `/api/dace/judges` with per-judge CSV / annotations downloads.
- Docs: `CLAUDE.md` (where the backend lives, how to make a judge code), `DEPLOY.md` (the Judge depends on COMPOSE's PocketBase).

### Status

- [x] COMPOSE backend (migration 1751700008, `dace.pb.js`, guard; suite 243) — deployed 6 Oct 2026; judge invite code created.
- [x] DACE: SDK in `site/assets/`, `src/judge-sync.js`, sign-in/register card, server-backed judgements, per-judge order, judged/remaining, Judges panel with per-judge downloads. Tested in headless Chrome against a throwaway PocketBase: register → judge → backtrack → reload (same order, same position) → outage (unsaved — retrying) → recovery → admin panel.
- [x] Phone layout for the Judge (6 Oct 2026).
- [ ] Thomas: register his judge account, tick `dace_admin` on it, judge a few cells on the live site.
- [ ] Consolidation: designed in *Judgement data* below (7 Oct 2026).
- [ ] Aktionsart as a feature? `stative` is binary now; a categorical column (state / activity / achievement / accomplishment) like `factivity` would replace it and explain which frames sound off in the present tense. Thomas raised it 6 Oct 2026; not decided.
- [ ] Inter-judge agreement in the Judges panel: moved to *Judgement data* phase 3.

## Judgement data (October 2026)

Separate what judges *said* from what the dictionary *says*. Three layers:

1. **Judgement log** — every act of judging, append-only, on the server. Raw sentence responses, never feature values.
2. **Consolidation** — `npm run consolidate` turns the log, the judge register and Thomas's adjudications into cell values by a fixed rule.
3. **Master** — `data/predicates.csv` stays the wide, hand-readable file the build reads; a generated `data/cells.csv` says where every cell's value came from.

Why: today each judge has one overwritten record per predicate (history is lost), the sentence judged isn't stored although the frames keep changing (commits dd7289a, bd0f658), `weak_island`/`stative` store the flipped value rather than the response, and provenance (*est.*) is per row, not per cell.

### Decisions (proposed — Thomas to confirm)

- **Scale.** Keep Acceptable / Marginal / Unacceptable and add **Can't judge** (needs context, can't get a reading). Not a 7-point scale: 22,400 cells per judge and a categorical dictionary don't justify it.
- **Thresholds.** A cell is *consensus* with ≥ 3 judges and ≥ 75 % of usable responses (Can't judge excluded) on one value. Set in `data/consolidation.json`, so they can change without code.
- **Frame versions.** By default only responses to the current version of a feature's frame count; older ones are kept and reported but not used.
- **Thomas as judge.** Counted like any other judge, but marked `author` in the register; consolidation reports author-vs-others agreement and can exclude the author (`exclude_author`, default false).
- **Publication.** The raw log stays on the server and in a gitignored local snapshot; the public repo gets `cells.csv` and aggregate statistics only. Publishing pseudonymised raw judgements later needs each judge's consent (asked in the profile card, phase 3).
- **Ethics.** If judges other than Thomas and named collaborators take part, check whether TCD needs ethics approval for collecting their judgements and profile data.
- **Gold cells, not the minimal pairs, as attention checks.** The minimal pairs are shown under every question, so they can't test anyone. Thomas picks ~100 uncontroversial cells as gold instead.

### Formats

**Event (server collection `dace_events`, export `events.csv`):**

```
event_id, judge, verb, feature, kind, response, item, frame_v, sentence, gold, repeat, created
```

- `judge`: pseudonymous code (`J01`, `J02`, …) — never the email in any export.
- `kind`: `judge` · `flag` · `unflag` · `sentence` · `nominal` · `note`.
- `response` (kind `judge`): `acceptable` · `marginal` · `unacceptable` · `cant_judge` · `clear` (undo). For `sentence`/`nominal`/`note` it holds the text.
- `item`: frame id, `<feature>:<frame type>` (e.g. `weak_island:cog`, `extraposition:copular`; a later second lexicalisation gets `…:b`). `frame_v`: that feature's frame version (0 = before versioning). `sentence`: the plain text shown.
- `gold` / `repeat`: the event was a gold cell or a test–retest repeat (phase 3).
- A judge's current answer for a cell is their latest `judge` event for it; `clear` withdraws it.

**Judge register (`judges.csv`):** `judge, variety, linguist, author, consent_publish, joined, anchor_accuracy, retest_agreement`.

**Adjudications (`data/adjudications.csv`, committed, hand-edited):** `verb, feature, value, rationale, date`. Every by-hand decision, including overriding the judges.

**Cell provenance (`data/cells.csv`, generated, committed):** `verb, feature, value, status, n, agreement, frame_v`.
`status` ∈ `coded` (Thomas's pre-Judge coding) · `estimated` (imported, best guess) · `provisional` (judged, fewer than the minimum judges, unanimous) · `consensus` · `contested` (split; keeps its old value until adjudicated) · `adjudicated` · `lexical` (`phrasal`, `be_copula`) · `na` (copular n/a cells).

### Phase 1 — Backend (in `Vrier/compose`, `server/`)

- [ ] Migration `1751700009_dace_events.js`:
  - New collection `dace_events` with the fields above (`user` relation → users instead of the judge code; `created` autodate). Rules: list/view own events (`user = @request.auth.id && @request.auth.judge = true`); create own only; **no update or delete rules** (append-only; superusers only). Index `(user, verb, feature, created)`.
  - `users` += `judge_code` (text, unique; assigned by the hook, pinned in `users_guard.pb.js`), `variety` (text), `linguist` (bool), `consent_publish` (bool), `profile_done` (bool) — the last four editable by the user.
  - Backfill: one `judge` event per existing `dace_judgements.f` entry (`frame_v` 0, `item` = `<feature>:legacy`, empty `sentence`; un-flip `weak_island`/`stative` back to the response), plus `flag` / `sentence` / `nominal` events. Assign `judge_code`s to existing judges in sign-up order.
- [ ] `dace.pb.js`:
  - `onRecordAfterCreateSuccess` on `dace_events`: upsert the judge's `dace_judgements` record (the Judge's fast-loading cache of current state). The client no longer writes `dace_judgements` directly; make its create/update rules superuser-only once the new Judge is live.
  - Register hook: assign the next `judge_code`.
  - `GET /api/dace/events.csv` and `GET /api/dace/judges.csv` (`dace_admin`): all judges, pseudonymised, rendered on request. Keep the per-judge routes; switch their CSV to the event format.
- [ ] Tests in COMPOSE's suite: append-only rules, a judge can't read another's events, the cache matches the latest events, backfill round-trip.

### Phase 2 — Items and frame versions (this repo)

- [ ] `src/frames.js`: `window.DACE_FRAME_VERSIONS = { <feature>: n }` and `window.daceTestItem(fk, verb, levinClass, display)` → `{ item, frame_v, text }` (plain text; `daceTestSentence` keeps rendering the HTML).
- [ ] `data/frames.lock.json`: per feature, its version and a hash of all its templates (every frame type, copular included). `npm test` fails if a template changes without its version being bumped — so no judgement is ever silently attached to a sentence nobody saw.

### Phase 3 — The Judge

- [ ] `src/judge-sync.js`: replace `update(verb, mutate)` with `record(event)` — optimistic local state, an ordered queue of event creates with the existing retry/back-off and *unsaved* indicator. Loading stays one read of the `dace_judgements` cache.
- [ ] `src/judge-app.jsx`:
  - Store the raw response; derive the displayed feature value with `DACE_INVERTED` only for the *Recorded* line. Remove `FLIP` from storage.
  - **Can't judge** button (key `9`), in the 2×2 phone grid as a fifth, smaller button.
  - Optional one-line note with a flag (`note` event).
  - **Gold cells:** `data/gold.csv` (`verb, feature, expected`), baked into the build. In random order, gold cells are moved forward so one appears every ~25 items until exhausted. A gold cell is an ordinary cell (it counts towards coverage), its event is marked `gold`.
  - **Test–retest:** about 1 in 100 items re-shows a cell the judge answered more than a day earlier, without showing the earlier answer; logged as `repeat`, doesn't replace the original.
  - **Profile card** on first sign-in (and in the Menu): variety of English, linguist yes/no, consent to publish pseudonymised judgements.
  - Exports: *My judgements* in the event format; drop *Merged predicates.csv* (superseded by consolidation — a single judge's file must not become the master by hand).
- [ ] Judges panel: judge code, cells, gold accuracy, retest agreement, and pairwise agreement once judges overlap; buttons for `events.csv` and `judges.csv`.

### Phase 4 — Consolidation (this repo)

- [ ] `judgements/` (gitignored): `events.csv` and `judges.csv` downloaded from the Judges panel.
- [ ] `data/consolidation.json`: `min_judges` 3, `majority` 0.75, `current_frames_only` true, `min_gold_accuracy` 0.8, `exclude_author` false.
- [ ] `scripts/consolidate.mjs` (`npm run consolidate`):
  1. Latest `judge` response per (judge, cell); drop `clear`, `repeat` and excluded judges (below gold accuracy, or the author if excluded); drop superseded frame versions if configured.
  2. Map responses to values: acceptable → 1, unacceptable → 0 (inverted for `DACE_INVERTED`), marginal → 5; `cant_judge` counts towards `n` but not the majority.
  3. Decide each cell: adjudication › consensus › provisional › contested (keep current value) › unjudged (keep `coded` / `estimated`). `lexical` and `na` cells are never touched.
  4. Rewrite only feature cells of `data/predicates.csv` (using `src/csv-export.js`, so quoting and notes stay byte-identical; drop *features estimated* once no cell in the row is `estimated`). Regenerate `data/cells.csv`.
  5. Write `judgements/contested.md` — each contested cell with its sentence(s), the response counts and any notes — for Thomas to adjudicate.
  6. Print a summary: cells changed by status, ordinal Krippendorff's α over all judged cells (0 < 5 < 1), author-vs-others agreement, per-judge gold accuracy.
- [ ] `scripts/lib/agreement.mjs`: Krippendorff's α (ordinal) and pairwise agreement, with unit tests on a textbook example.
- [ ] First run, before any judging: generate `data/cells.csv` with every cell `coded`, `estimated` (the 245 rows with *features estimated*), `lexical` or `na`.

### Phase 5 — Build and Explorer

- [ ] `scripts/lib/data.mjs`: read `data/cells.csv`; add a compact per-predicate status string to `data.js` (one letter per binary column, e.g. `c e p k x a l n`), so the file stays one line per predicate.
- [ ] Explorer: per-cell marks for marginal (the open *Interface* item), estimated, provisional and contested; the detail panel shows *n* judges and agreement per feature. `isEstimated` becomes "any cell estimated".
- [ ] `npm test`: `cells.csv` has exactly one row per (predicate, binary column); its values equal `predicates.csv`; `lexical`/`na` statuses match `DACE_UNJUDGED`/`DACE_COPULAR_NA`; every adjudication names an existing cell and a legal value; the frames lock (phase 2); replace the *Merged predicates.csv* test with a consolidate round-trip on a fixture log.
- [ ] `docs-src/about.md`: a methodology paragraph (how a value is decided, what the marks mean) with `{{judges}}`, `{{consensus}}`, `{{contested}}`, `{{alpha}}` placeholders.

### Phase 6 — Docs

- [ ] `CLAUDE.md`: layout table (`cells.csv`, `adjudications.csv`, `gold.csv`, `consolidation.json`, `judgements/`), golden rule "never edit feature cells of `predicates.csv` by hand once a cell has judgements — add an adjudication", and the *Bring in judgements* task rewritten as download → `npm run consolidate` → adjudicate → rebuild → commit.

### Order of work

Phase 2 first (small, and it stops more unversioned judgements piling up), then 1 and 3 together (deploy the backend, then the Judge), then 4, then 5 and 6. Thomas can keep judging throughout: the backfill carries existing judgements across at `frame_v` 0.

### Later

- Second lexicalisations (`…:b` items) for contested cells only.
- Context sentences before the test sentence for `factivity`- and `veridicality`-type diagnostics.
- A pseudonymised release of the event log, for judges who consented.
