# Sidecar files

Example sentences and derived nominals that the Explorer shows instead of the generated ones. To publish them on the site:

1. Get a judge's `annotations.json` from the Judge's **Judges** panel (needs `dace_admin`), or a judge's own Export → **My example sentences (.json)** / **My derived nominals (.json)**.
2. Save the `sentences` object here as `sentences.json` and the `nominals` object as `nominals.json` (each is `{ "_dace": …, "version": 1, "data": { "<verb>": "…" } }`).
3. `npm run build && npm test`, then commit.

The build bakes these into `site/assets/data.js`, so every visitor sees them; in the Judge they appear as the placeholder of the example-sentence box. To remove a published entry, delete it from the JSON file and rebuild.
