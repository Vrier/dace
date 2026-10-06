// npm run build — regenerate site/ from src/, data/ and docs-src/.
// Commit site/ along with the sources: the server serves it straight from git.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, writeSite } from './lib/site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { files, data } = await buildSite(ROOT);
writeSite(path.join(ROOT, 'site'), files);
const s = data.stats;
console.log(`site/ rebuilt: ${Object.keys(files).length} files — ${s.predicates} predicates, ` +
  `${s.estimated} with estimated features.`);
