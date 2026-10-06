# Judge sidecar files

Example sentences and derived nominals entered in the Judge are saved only in that browser. To publish them on the site:

1. Judge → Export → **Example sentences (.json)** → save here as `sentences.json`.
2. Judge → Export → **Derived nominals (.json)** → save here as `nominals.json`.
3. `npm run build && npm test`, then commit.

The build bakes these into `site/assets/data.js`, so every visitor sees them. Entries saved in a visitor's own browser still take precedence. To remove a published entry, delete it from the JSON file and rebuild.
