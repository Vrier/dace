# From the Claude Design handoff to this repo

Source: `DACE_UI-handoff.zip` (Claude Design, exported 30 Sept 2026, folder `dace-ui/project`). The design (CSS, components, layout) is unchanged; what changed is how it's built and where the data comes from.

## Where things went

| Handoff | Repo |
|---|---|
| `DACE Explorer.html`, `DACE Judge.html` | `src/explorer.html` + `src/explorer.css`, `src/judge.html` + `src/judge.css` (CSS verbatim, small additions at the end) |
| `app.jsx`, `detail.jsx`, `engine.jsx`, `views.jsx`, `judge-app.jsx` | `src/` (edits below) |
| `glossary.js`, `ahg.js`, `levin_classes.js`, `annotations.js`, `nominals.js`, `frames.js` | `src/` |
| `tweaks-panel.jsx` | replaced by `src/settings.jsx` |
| `predicates.csv`, `concordance.csv`, `sources.js` | `data/` |
| `data.js` | generated: `site/assets/data.js` |
| `alternations.md`, `verb_classes.md` | `docs-src/` |
| `docs/*.html` | generated from `docs-src/` |
| `docs/*.md` (audit, coverage, methodology, AHG reconciliation) | `notes/` |
| `projects/mega-veridicality/…` | `provenance/megaattitude/` (TSV, README, LICENSE) |
| other `projects/` TSVs | not vendored (see `provenance/README.md`) |
| `uploads/KarttunenFS.md` | not committed: keep it in `uploads/` (gitignored) |
| `DACE Judge (offline).html`, `screenshots/`, `.thumbnail` | dropped |

## Data

`migrate.mjs` (in this folder) ran once:

- wrote `data/ahg_senses.csv` — the 68 per-sense rows of the 34 multi-sense predicates, which existed only in `data.js`;
- removed the legacy `megav_ver=…` / `megav=…` segments from 440 rows of `notes` (scores now come from the TSV).

Regenerated from sources, the dataset matches the handoff's `data.js` exactly — all 24,596 feature cells, classes, factivity, veridicality, AHG memberships, and all 500 existing MegaV scores — except for these deliberate changes:

- **MegaV, one rule for every verb** (78 rows). 12 verbs gain scores they had in MegaVeridicality but not in DACE: *tell, deplore, obsess, pester, rouse*, and *alert, disillusion, encourage, frighten, instruct, nonplus, scare* (previously "no ver." despite a passive *that*-clause rating). 66 verbs that are in MegaVeridicality without a *that*-clause frame now show "no ver." instead of "—".
- **Levin classes from the membership lists**: *grimace* → 4.3 and *obsess* → 4.1, as `levin_classes.js` and `verb_classes.md` list them (they had none).
- **Notes**: 25 rows lost CSV-quoting artifacts (doubled quotes) in the displayed note.

## Interface and build

- Production React 18.3.1 served from `site/assets`; JSX compiled ahead of time by esbuild (as in COMPOSE). No unpkg, no in-browser Babel.
- Tweaks panel → **Settings** menu (theme auto/light/dark, row density, Load annotations). The look is fixed to the "Reading Room" direction.
- **About** panel with sources and a suggested citation; documents are linkable (`/#about`, `/#alternations`, `/#verb-classes`) and cross-link inside the panel.
- Documentation now rendered from Markdown: identical text and anchors, without the stray backslashes and `>` markers the panel showed, and with real paragraphs in Verb Classes.
- Judge export fixed (`src/csv-export.js`): it used to drop the "added from…; features estimated" notes — one export-and-replace would have cleared every *est.* marker — and quoted every notes field, rewriting the whole file. It now round-trips `predicates.csv` byte for byte.
- Committed Judge sidecars in `data/annotations/` are baked into the site.
- The predicate footer links to the site's own `predicates.csv` (it pointed at a GitHub URL that 404s when logged out).
- Favicon, page descriptions, `robots.txt` and `noindex` keep the Judge out of search engines.
