// npm run frames:lock — update data/frames.lock.json after changing src/frames.js:
// new templates start at v1, changed ones get the next version, removed ones are
// marked retired (kept, since logged judgements still name them). Then rebuild.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCK, frameTemplates, readLock, nextLock, renderLock } from './lib/frames.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { lock, changes } = nextLock(readLock(ROOT), frameTemplates(ROOT));
if (!changes.length) { console.log(`${LOCK} is up to date.`); process.exit(0); }
fs.writeFileSync(path.join(ROOT, LOCK), renderLock(lock));
console.log(`${LOCK} updated:\n` + changes.map((c) => '  ' + c).join('\n') +
  '\nNow run npm run build. Judgements made on the old versions stay in the log under their old version.');
