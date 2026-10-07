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

- [x] Marginal judgements (5) have their own mark: a half-filled dot (*Judgement data* phase 5).
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
event_id, judge, verb, feature, kind, response, item, frame_v, sentence, gold, repeat, at
```

- `judge`: pseudonymous code (`J01`, `J02`, …) — never the email in any export.
- `kind`: `judge` · `flag` · `unflag` · `sentence` · `nominal` · `note`.
- `response` (kind `judge`): `acceptable` · `marginal` · `unacceptable` · `cant_judge` · `clear` (undo). For `sentence`/`nominal`/`note` it holds the text.
- `item`: frame id, `<feature>:<table>` (e.g. `weak_island:base`, `that_omission:psych`, `extraposition:copular`; a later second lexicalisation gets `…:b`). `frame_v`: that item's version from `data/frames.lock.json` (0 = before versioning). `sentence`: the plain text shown.
- `gold` / `repeat`: the event was a gold cell or a test–retest repeat (phase 3).
- `at`: the server's time when the event arrived (backfilled events keep their original judgement time).
- A judge's current answer for a cell is their latest `judge` event for it; `clear` withdraws it.

**Judge register (`judges.csv`):** `judge, variety, linguist, author, consent_publish, joined, anchor_accuracy, retest_agreement`.

**Adjudications (`data/adjudications.csv`, committed, hand-edited):** `verb, feature, value, rationale, date`. Every by-hand decision, including overriding the judges.

**Cell provenance (`data/cells.csv`, generated, committed):** `verb, feature, value, status, n, agreement, frame_v`.
`status` ∈ `coded` (Thomas's pre-Judge coding) · `estimated` (imported, best guess) · `provisional` (judged, fewer than the minimum judges, unanimous) · `consensus` · `contested` (split; keeps its old value until adjudicated) · `adjudicated` · `lexical` (`phrasal`, `be_copula`) · `na` (copular n/a cells).

### Phase 1 — Backend (in `Vrier/compose`, `server/`) — done 7 Oct 2026 (COMPOSE S79)

- [x] Migration `1751700009_dace_events.js`: `dace_events` (append-only: own list/view/create for judges, no update/delete rules; `at` stamped by the server), `users` += `judge_code` (unique when set, pinned by `users_guard.pb.js`), `variety`, `linguist`, `consent_publish`, `profile_done`; `dace_judgements` closed to API writes and moved to cache format v2 (`r` = current responses, `notes`).
- [x] Backfill: existing judgements → `judge` events (`<feature>:legacy`, `frame_v` 0, original times); flags, sentences, nominals → events; 0/1/5 → acceptable / unacceptable / marginal, with `weak_island`/`stative` un-flipped only after the polarity fix (bd0f658, 2026-10-06T15:16:32Z). Judges coded in sign-up order. Checked on a seeded pre-migration database.
- [x] `dace.pb.js` (+ `dace_lib.js`): event validation, server time, lazy code for accounts made judges in the dashboard; cache upkeep after each event (repeats skipped); `/api/dace/events.csv`, `/api/dace/judges.csv` (codes only, no emails); per-judge `judgements.csv` in the event format; `/api/dace/judges` with code, profile and event counts; agreement on responses, Can't judge left out.
- [x] COMPOSE suite 251 → 283 checks.

### Phase 2 — Items and frame versions (this repo) — done 7 Oct 2026

- [x] Versions are **per item** (`<feature>:<table>`, 132 items), not per feature, so editing the psych `that_omission` frame doesn't retire the judgements on the base one. Event field `frame_v` is that item's version.
- [x] `src/frames.js`: `daceFrameSource(fk, levinClass, display)` → `{ item, tmpl }` (the one lookup), `daceFrameTemplates()`, `daceTestSentence(…, opts)` with `judge` (unstarred, that-omission without "(that)") and `plain` (text; psych voice lines joined with " | ") modes, and `daceTestItem(fk, levinClass, display)` → `{ item, frame_v, text }`. The Judge renders with the same judge mode, so the logged sentence is what the judge saw. Explorer and Judge output unchanged (checked on all 52,976 Explorer and 24,596 Judge renderings).
- [x] `data/frames.lock.json` (all items at v1) + `npm run frames:lock` (`scripts/frames-lock.mjs`, `scripts/lib/frames.mjs`): new item → v1, changed template → next version, removed item → `retired` (kept, since logged judgements name it). Versions baked into `data.js` as `DACE_FRAME_VERSIONS`.
- [x] `npm test`: templates match the lock; every one of the 22,400 judgeable cells has an item, a version and a clean plain sentence.
- Not covered by the lock: conjugation (`DACE_IRREGULAR`, doubling) and nominal forms can still change a sentence's text. The logged `sentence` field records the actual text, so consolidation can detect those changes if needed.
- Judgements made before phase 3 ships have no item or version; the backfill gives them `frame_v` 0.

### Phase 3 — The Judge — done 7 Oct 2026

- [x] `src/judge-sync.js`: `record(event)` applies the change locally and queues the event (sent in order, retried with back-off; a 400 is counted as *refused* rather than retried for ever); loads the v2 cache; `saveProfile`, `myEvents`, admin downloads.
- [x] `src/judge-app.jsx`: raw responses; **Can't judge** (key 9; the flag button spans the phone grid); flag note; the card no longer shows the cell's current CSV value (anchoring); gold cells from `data/gold.csv` moved forward one every 25 items in random order (`gold` on their events); test–retest *check items* after ~1 % of judgements, cells judged ≥ 1 day earlier, earlier answer hidden (`repeat`); profile card on first sign-in and in the menu; *My judgements* exports the judge's own event log; *Merged predicates.csv* removed.
- [x] Judges panel: code, email, variety, linguist tag, cells, flags, events, last activity, per-judge `events.csv` / `annotations.json`, all-judge `events.csv` / `judges.csv` / agreement CSV, and an agreement summary with pairwise figures.
- [x] Tested end to end in headless Chromium against a local PocketBase with the new migration: register → profile → judge with every key → flag + note → reload (state restored from the cache) → events and CSVs checked → admin panel; retest checked with the thresholds lowered; phone layout checked.
- Gold accuracy and retest agreement are computed in phase 4 (they need `data/gold.csv` and the whole log), not in the panel.
- **Thomas:** pick the gold cells (`data/gold.csv`: `verb,feature,expected`). Avoid predicates used in the minimal pairs.

### Phase 4 — Consolidation (this repo) — done 7 Oct 2026

- [x] `judgements/` gitignored; `data/consolidation.json` (`min_judges` 3, `majority` 0.75, `current_frames_only`, `use_legacy` true, `min_gold_accuracy` 0.8 once `min_gold_seen` 10 gold cells are answered, `author` [], `exclude_author` false); `data/adjudications.csv` (empty).
- [x] `scripts/lib/consolidate.mjs` (pure; the rules) and `scripts/consolidate.mjs` (`npm run consolidate [-- --dry-run] [--events path]`): latest non-repeat response per judge and cell; Can't judge counts in `cant` only; superseded frame versions dropped, legacy items kept unless `use_legacy` is false; judges excluded as author (if set) or on gold accuracy; decides adjudicated › consensus › provisional › contested (keeps value) › estimated / coded; rewrites feature cells through `src/csv-export.js` (byte-identical otherwise; *features estimated* dropped once no cell of the row is estimated); writes `data/cells.csv` and `judgements/contested.md`; prints per-judge gold accuracy and retest agreement, ordinal α, pairwise and author-vs-others agreement, and every changed value.
- [x] `scripts/lib/agreement.mjs`: Krippendorff's α (nominal / ordinal / interval) and pairwise agreement; `npm test` checks α against Krippendorff (2011)'s worked example (0.743 / 0.815 / 0.849, as in the `krippendorff` Python package).
- [x] First run with no judgements: `data/cells.csv` = 16,752 coded, 5,648 estimated, 1,892 lexical, 304 n/a; `predicates.csv` unchanged.
- [x] `npm test`: the rules on a fixture log (consensus, contested, inverted provisional, clear, Can't judge only, superseded vs legacy frames, repeat ignored, adjudication, gold exclusion, author exclusion, estimated note dropped), plus with no judgements the output reproduces `predicates.csv` byte for byte. A deliberate rule change (majority 0.6) makes it fail.
- Checked on a real event log from the end-to-end test run.

### Phase 5 — Build and Explorer — done 7 Oct 2026

- [x] `scripts/lib/data.mjs` reads `data/cells.csv`: `p.st` (one letter per binary column: a k p x e c l n) and `p.jn` (`{ feature: [judges, agreement] }` for judged cells); counts and the thresholds become About-page placeholders. `/data/cells.csv` is published beside `predicates.csv`.
- [x] Explorer: a marginal value (5) is a half-filled dot (the open *Interface* item); provisional cells get a dotted ring, contested a red ring, adjudicated a thin ring; the dot's title (matrix) or the feature tooltip (reader) says where the value came from, with judges and agreement. Unjudged cells look as before, and the row-level *est.* marker stays.
- [x] `npm test`: `cells.csv` row-for-row against `predicates.csv`, lexical / n/a statuses, estimated only on *features estimated* rows; `adjudications.csv` names judged cells with 0/1/5 and a rationale.
- [x] `docs-src/about.md`: *How values are decided*, with the thresholds and counts filled from the data.

### Phase 6 — Docs — done 7 Oct 2026

- [x] `CLAUDE.md`: layout rows for `cells.csv`, `adjudications.csv`, `consolidation.json`, `gold.csv`, `judgements/`; the *Bring in judgements* task is now download → `npm run consolidate` → adjudicate → rebuild → commit; never edit a judged cell by hand.

### Order of work

All six phases are done (7 Oct 2026). What's left is Thomas's: pick the gold cells, set `author` in `data/consolidation.json` to his judge code, fix the frames below, and start judging.

### Frames to look at (found while building phase 3)

Some judged templates aren't plain sentences, so Acceptable / Unacceptable doesn't fit them, and two give the answer away. Changing them bumps their versions (`npm run frames:lock`), which is exactly what versioning is for:
- `stative:psych` ("She was [VN] that p (state) vs. eventive active use.") and `stative:impl` ("… (achievement — progressive OK)") — descriptions, the second with the expected answer in it.
- `neg_raising:base`, `:psych`, `:raise`, `:copular` — paraphrase-equivalence questions (≈ / ≠), not acceptability. Either a different question on the card ("Do these mean the same?" with Yes / No / Unsure) or a plain-sentence frame.

### Later

- Second lexicalisations (`…:b` items) for contested cells only.
- Context sentences before the test sentence for `factivity`- and `veridicality`-type diagnostics.
- A pseudonymised release of the event log, for judges who consented.
