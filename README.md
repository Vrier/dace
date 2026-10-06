# DACE — Dictionary of Alternations in Clause Embedding

DACE maps the alternation patterns of English clause-embedding predicates: the complements each predicate takes, the matrix alternations it allows, and what it implies about the truth of its complement. It is inspired by Levin's *English Verb Classes and Alternations* (1993).

- **Explorer:** https://dace.tstephen.com — browse the predicates by class and feature
- **Judge:** https://dace.tstephen.com/judge/ — the (unlisted) annotation tool; judges sign in with an account from COMPOSE's PocketBase
- **Data:** [`data/predicates.csv`](data/predicates.csv)

## Working on it

Needs Node 20 or later.

```sh
npm ci          # install the pinned build tools (esbuild, marked, React 18.3.1)
npm run build   # rebuild site/ from src/, data/, docs-src/ and provenance/
npm test        # the checks CI runs before every deploy
npm run serve   # preview at http://localhost:8000
```

`site/` is generated but committed: the server serves it straight from git. Change the sources, rebuild, and commit both. Pushing to `main` deploys (see [DEPLOY.md](DEPLOY.md)). [CLAUDE.md](CLAUDE.md) explains the layout and day-to-day workflows; [PLAN.md](PLAN.md) lists what's next.

## Credits

AHG classes follow Anand, Grimshaw & Hacquard (2017), *Sentence embedding predicates, factivity and subjects* (Lauri Karttunen Festschrift, CSLI). Veridicality scores come from MegaVeridicality v2.1 by Aaron Steven White and Kyle Rawlins, CC BY-SA 4.0 — see [provenance/README.md](provenance/README.md). Definitions in the Explorer are loaded live from Wiktionary.
