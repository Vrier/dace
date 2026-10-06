# PLAN.md — DACE

## Status

Production build of the Claude Design handoff (30 Sept 2026): Explorer + Judge, 946 predicates, documentation and an About page with citations. Live at https://dace.tstephen.com since 5 Oct 2026 (public repo, `live`-branch cron deploy — DEPLOY.md). The Judge is behind a login since 6 Oct 2026 (*Judge accounts* below).

## Launch

- [x] Public repo, DNS, clone on the VPS, Caddy block, `live`-branch cron (deploy/setup-server.sh).
- [ ] Link the DACE card on www.tstephen.com.
- [ ] Server housekeeping: hide `.git` on www/slides; complete `compose/deploy/Caddyfile` (DEPLOY.md).
- [ ] Read through `docs-src/about.md` (drafted, including the suggested citation).

## Data

- 245 predicates still have estimated features (·est): 6,370 cells to judge in the Judge.
- `obsess` is listed as a Say verb (4.1) in `docs-src/verb_classes.md` and `src/levin_classes.js` — probably a slip.
- Author order: the Festschrift lists **Anand, Grimshaw & Hacquard**; the interface says "Anand, Hacquard & Grimshaw (2017)" (`src/engine.jsx`, `src/app.jsx`, `src/ahg.js`). Decide whether "AHG" stays as the label.
- Coverage tab (methodology Step 5): `data/sources.js` and `data/concordance.csv` are staged but not built.
- MegaAcceptability v2's full verb list and the MegaNegRaising data are still needed for the concordance (`notes/coverage_report.md`); `provenance/` is now gitignored, so they stay local.
- Audit leftovers (`notes/audit_2026-08-17.md`): C4 — registry/concordance mismatches. (C2, the MegaV scale question, is moot since the scores were removed.)

## Interface

- Marginal judgements (5) are stored, but the Explorer shows them as absent; give them their own mark.
- Link each predicate to its line of `data/predicates.csv` on GitHub (the repo is public).
- Optional: self-host the fonts.
- Several annotators judging at once: see *Judge accounts* below.

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
- [ ] Thomas: register his judge account, tick `dace_admin` on it, judge a few cells on the live site.
- [ ] Consolidation: how several judges' CSVs become `data/predicates.csv` (majority? Thomas adjudicates flags?). Not designed yet; the per-judge files have `judged_at`, so timing is available.
- [ ] Nice to have: show inter-judge agreement in the Judges panel once two or more judges overlap.
