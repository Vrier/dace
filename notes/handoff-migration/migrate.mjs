// migrate.mjs — ONE-TIME migration from the Claude Design handoff (dace-ui, 30 Sept 2026)
// to this repo's data layout. Kept for provenance; it is not part of the build.
//
//   node notes/handoff-migration/migrate.mjs <path-to-handoff>/dace-ui/project/data.js
//
// What it did (see ../handoff-migration.md for the full record):
//   1. Wrote data/ahg_senses.csv — the per-sense AHG memberships of the 34
//      multi-sense predicates, which existed only in the handoff's data.js
//      (predicates.csv records just the primary sense + alt class names).
//   2. Removed the legacy "megav_ver=…" / "megav=…" segments from the notes column
//      of data/predicates.csv. MegaVeridicality scores are now joined at build
//      time from provenance/megaattitude/…/mega-veridicality-v2.1-normalized.tsv.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parseCSV, stringifyCSV, stringifyCSVRows } from '../../scripts/lib/csv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const handoffDataJs = process.argv[2];
if (!handoffDataJs) { console.error('usage: node migrate.mjs <handoff data.js>'); process.exit(1); }

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(handoffDataJs, 'utf8'), sandbox);
const P = sandbox.window.DACE_PREDICATES;

// 1 — ahg_senses.csv
const senseRows = [['verb', 'sense', 'ahg_class', 'ahg_rofi', 'ahg_factive', 'ahg_subclass']];
for (const p of P) {
  if ((p.ahg || []).length < 2) continue;
  p.ahg.forEach((m, i) => senseRows.push([p.verb, String(i + 1), m.c, String(m.r), String(m.f), m.s || '']));
}
fs.writeFileSync(path.join(ROOT, 'data/ahg_senses.csv'), stringifyCSVRows(senseRows));
console.log(`ahg_senses.csv: ${senseRows.length - 1} sense rows for ${new Set(senseRows.slice(1).map((r) => r[0])).size} predicates`);

// 2 — strip legacy megav segments from notes
const csvPath = path.join(ROOT, 'data/predicates.csv');
const before = fs.readFileSync(csvPath, 'utf8');
const { header, records } = parseCSV(before);
if (stringifyCSV(header, records) !== before) throw new Error('predicates.csv does not round-trip; aborting');
let changed = 0;
for (const r of records) {
  const kept = r.notes.split(/;\s*/).map((s) => s.trim()).filter((s) => s && !/^megav(_ver)?=/.test(s)).join('; ');
  if (kept !== r.notes) { r.notes = kept; changed++; }
}
fs.writeFileSync(csvPath, stringifyCSV(header, records));
console.log(`predicates.csv: removed legacy MegaV note segments from ${changed} rows`);
