// npm run consolidate — turn the Judge's event log into DACE's values (PLAN.md,
// "Judgement data", phase 4; the rules are in scripts/lib/consolidate.mjs).
//
//   1. Judges panel → download events.csv (and judges.csv) into judgements/ (gitignored).
//   2. npm run consolidate            (or: -- --dry-run to see what would change)
//   3. Adjudicate judgements/contested.md in data/adjudications.csv; run it again.
//   4. npm run build, npm test, commit data/predicates.csv, data/cells.csv and site/.
//
// Reads data/predicates.csv, data/adjudications.csv, data/consolidation.json,
// data/gold.csv and judgements/events.csv (if absent, no judgements: cells.csv is
// regenerated from the current values). Rewrites only the feature cells of
// predicates.csv, and data/cells.csv; writes judgements/contested.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV } from './lib/csv.mjs';
import { buildData } from './lib/data.mjs';
import { frameRules, csvWriter } from './lib/frames.mjs';
import { consolidate, renderContested } from './lib/consolidate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const rel = (p) => path.resolve(ROOT, p);
const read = (p) => fs.readFileSync(rel(p), 'utf8').replace(/\r\n?/g, '\n');
const readCsvIf = (p) => fs.existsSync(rel(p)) ? parseCSV(read(p)).records : null;

const data = buildData(ROOT);
data.byVerb = new Map(data.predicates.map((p) => [p.verb, p]));
const eventsPath = opt('--events', 'judgements/events.csv');
const events = readCsvIf(eventsPath);
if (!events) console.log(`(no ${eventsPath} — consolidating with no judgements)`);
const judgesCsv = readCsvIf(opt('--judges', 'judgements/judges.csv')) || [];
const config = fs.existsSync(rel('data/consolidation.json')) ? JSON.parse(read('data/consolidation.json')) : {};
const res = consolidate({
  data, frames: frameRules(ROOT, data.frameV), events: events || [],
  adjudications: readCsvIf('data/adjudications.csv') || [], config, register: judgesCsv,
  writeCsv: csvWriter(ROOT, data.binaryCols, data.header),
});

// ---- report ----
const s = res.summary, pct = (a, b) => b ? Math.round((a / b) * 100) + '%' : '—';
const variety = Object.fromEntries(judgesCsv.map((j) => [j.judge, j.variety]));
console.log(`\n${s.events.toLocaleString()} events from ${s.judges.length} judge(s).`);
for (const j of s.judges) {
  console.log(`  ${j.judge}${variety[j.judge] ? ' (' + variety[j.judge] + ')' : ''}: ${j.used} responses used` +
    ` · gold ${j.goldSeen ? pct(j.goldAccuracy * j.goldSeen, j.goldSeen) + ' of ' + j.goldSeen : 'none seen'}` +
    ` · retest ${j.retest ? pct(j.retestAgree, j.retest) + ' of ' + j.retest : 'none'}` +
    (j.excluded ? `  — EXCLUDED (${j.excluded})` : '') +
    (j.vsMajority && j.vsMajority.overlap ? ` · vs the others' majority ${pct(j.vsMajority.agree, j.vsMajority.overlap)} of ${j.vsMajority.overlap}` : ''));
}
if (s.droppedFrames) console.log(`  ${s.droppedFrames} response(s) on superseded frame versions left out.`);
if (s.legacyUsed) console.log(`  ${s.legacyUsed} pre-versioning (legacy) response(s) used.`);
console.log(`Agreement: ordinal Krippendorff's α = ${s.alpha === null ? 'n/a' : s.alpha.toFixed(3)} over ${s.alphaUnits} cell(s) with 2+ judges.`);
for (const p of s.pairs) console.log(`  ${p.a} × ${p.b}: ${p.agree}/${p.overlap} (${pct(p.agree, p.overlap)})`);
if (s.authorVsOthers.overlap) console.log(`  Author vs others' majority: ${s.authorVsOthers.agree}/${s.authorVsOthers.overlap} (${pct(s.authorVsOthers.agree, s.authorVsOthers.overlap)})`);
console.log('\nCells: ' + Object.entries(res.counts).filter(([, n]) => n).map(([k, n]) => `${k} ${n.toLocaleString()}`).join(' · '));
console.log(`${res.changed.length} value(s) change in data/predicates.csv` + (res.changed.length ? ':' : '.'));
for (const c of res.changed.slice(0, 30)) console.log(`  ${c.verb}.${c.feature}: ${c.from} → ${c.to} (${c.status})`);
if (res.changed.length > 30) console.log(`  … and ${res.changed.length - 30} more`);
if (res.contested.length) console.log(`${res.contested.length} contested cell(s): see judgements/contested.md.`);

if (dry) { console.log('\n--dry-run: nothing written.'); process.exit(0); }
const write = (p, text) => { if (!fs.existsSync(rel(p)) || read(p) !== text) { fs.mkdirSync(path.dirname(rel(p)), { recursive: true }); fs.writeFileSync(rel(p), text); console.log('wrote ' + p); } };
write('data/predicates.csv', res.csv);
write('data/cells.csv', res.cellsCsv);
write('judgements/contested.md', renderContested(res.contested));
console.log('\nNext: npm run build && npm test, then commit data/ and site/.');
