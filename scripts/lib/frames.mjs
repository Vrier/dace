// frames.mjs — frame items, their template hashes and data/frames.lock.json.
//
// Every test-sentence template in src/frames.js is a frame ITEM, "<feature>:<table>"
// (e.g. "weak_island:base", "that_omission:psych", "extraposition:copular"). The
// lock file records each item's version and a hash of its template:
//   { "<item>": { "v": 2, "hash": "…" }, … }            (retired items: "retired": true)
// Judgements are logged with item + version, so changing a template must bump its
// version: `npm test` fails until `npm run frames:lock` has done so. Versions are
// baked into data.js as window.DACE_FRAME_VERSIONS.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

export const LOCK = 'data/frames.lock.json';
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n?/g, '\n');

/** The templates of src/frames.js, keyed by item. */
export function frameTemplates(root) {
  const sb = {};
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read(root, 'src/frames.js'), sb, { filename: 'src/frames.js' });
  return sb.daceFrameTemplates();
}

export const templateHash = (tmpl) => crypto.createHash('sha256').update(JSON.stringify(tmpl)).digest('hex').slice(0, 12);

export function readLock(root) {
  const p = path.join(root, LOCK);
  return fs.existsSync(p) ? JSON.parse(read(root, LOCK)) : {};
}

/** The lock as it should be: new items at v1, changed items bumped, vanished items retired. */
export function nextLock(lock, templates) {
  const out = {}, changes = [];
  for (const item of Object.keys({ ...lock, ...templates }).sort()) {
    const old = lock[item], tmpl = templates[item];
    if (tmpl === undefined) {
      out[item] = old.retired ? old : { ...old, retired: true };
      if (!old.retired) changes.push(`retired  ${item} (v${old.v})`);
      continue;
    }
    const hash = templateHash(tmpl);
    if (!old) { out[item] = { v: 1, hash }; changes.push(`new      ${item} (v1)`); }
    else if (old.hash !== hash || old.retired) {
      out[item] = { v: old.v + 1, hash };
      changes.push(`${old.retired ? 'restored' : 'changed '} ${item} (v${old.v} → v${old.v + 1})`);
    } else out[item] = old;
  }
  return { lock: out, changes };
}

export const renderLock = (lock) =>
  '{\n' + Object.entries(lock).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n}\n';

/** item -> version, for data.js (retired items included: old judgements still name them). */
export const frameVersions = (lock) => Object.fromEntries(Object.entries(lock).map(([k, v]) => [k, v.v]));

/** What consolidation needs from src/frames.js: the item a cell is judged on, its
 *  current version, and the unjudged / inverted / inapplicable rules. */
export function frameRules(root, versions) {
  const sb = {};
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read(root, 'src/frames.js'), sb, { filename: 'src/frames.js' });
  return {
    item: (fk, p) => { const s = sb.daceFrameSource(fk, p.levin_class, p.display); return s && s.tmpl !== null ? s.item : null; },
    version: (item) => (item && versions[item]) || 0,
    unjudged: [...sb.DACE_UNJUDGED],
    inverted: [...sb.DACE_INVERTED],
    inapplicable: (verb, fk) => sb.daceInapplicable(verb, fk),
  };
}

/** src/csv-export.js as a function: (predicates, { "verb|feature": value }) → CSV text. */
export function csvWriter(root, binaryCols, header) {
  const sb = {};
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read(root, 'src/csv-export.js'), sb, { filename: 'src/csv-export.js' });
  return (predicates, judgements) => sb.daceMergedCSV(predicates, judgements, binaryCols, header);
}
