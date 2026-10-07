// npm test — the checks CI runs before every deploy (see .github/workflows/deploy.yml).
// A failing check stops the deploy, so a broken push never reaches the server.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parseCSV } from './lib/csv.mjs';
import { headingIds } from './lib/docs.mjs';
import { buildSite, listFiles } from './lib/site.mjs';
import { frameTemplates, readLock, nextLock } from './lib/frames.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n?/g, '\n');
let failed = 0;
function check(name, fn) {
  let problems;
  try { problems = fn() || []; } catch (e) { problems = [String((e && e.stack) || e)]; }
  if (!problems.length) { console.log(`✓ ${name}`); return; }
  failed++;
  console.log(`✗ ${name}`);
  problems.slice(0, 15).forEach((p) => console.log('    ' + p));
  if (problems.length > 15) console.log(`    … and ${problems.length - 15} more`);
}

let built;
try { built = await buildSite(ROOT); }
catch (e) { console.log('✗ build failed\n' + ((e && e.stack) || e)); process.exit(1); }
const { files, data } = built;
const { header, records, binaryCols, predicates, lex } = data;

check('data/predicates.csv — columns and allowed values', () => {
  const P = [];
  const lead = ['verb', 'semantic_class', 'ahg_class', 'ahg_rofi', 'ahg_factive', 'ahg_alt_classes', 'ahg_subclass'];
  if (header.slice(0, lead.length).join() !== lead.join()) P.push(`header must start with ${lead.join(',')}`);
  if (header[header.length - 1] !== 'notes') P.push('the last column must be notes');
  // DACE_FEATURES also documents the two categorical columns; only binary ones are feature columns
  const feats = Object.keys(lex.DACE_FEATURES).filter((k) => !['factivity', 'veridicality'].includes(k));
  const missing = feats.filter((k) => !binaryCols.includes(k)), extra = binaryCols.filter((k) => !feats.includes(k));
  if (missing.length) P.push('features defined in src/glossary.js but missing from the CSV: ' + missing.join(', '));
  if (extra.length) P.push('CSV columns with no DACE_FEATURES entry in src/glossary.js: ' + extra.join(', '));
  const fac = Object.keys(lex.DACE_CATS.factivity.values), ver = Object.keys(lex.DACE_CATS.veridicality.values);
  const sem = Object.keys(lex.DACE_CLASSES), ahg = Object.keys(lex.DACE_AHG_CLASSES);
  const seen = new Set();
  records.forEach((r, i) => {
    const at = `line ${i + 2} (${r.verb})`;
    if (!/^[a-z][a-z0-9_'-]*$/.test(r.verb)) P.push(`${at}: verb keys are lower case with underscores`);
    if (seen.has(r.verb)) P.push(`${at}: duplicate verb`);
    seen.add(r.verb);
    if (!sem.includes(r.semantic_class)) P.push(`${at}: unknown semantic_class "${r.semantic_class}"`);
    if (!fac.includes(r.factivity)) P.push(`${at}: unknown factivity "${r.factivity}"`);
    if (!ver.includes(r.veridicality)) P.push(`${at}: unknown veridicality "${r.veridicality}"`);
    for (const k of binaryCols) if (!['0', '1', '5'].includes(r[k])) P.push(`${at}: ${k} must be 0, 1 or 5 (marginal), not "${r[k]}"`);
    if (r.ahg_class === '') {
      if (r.ahg_rofi || r.ahg_factive || r.ahg_alt_classes || r.ahg_subclass) P.push(`${at}: AHG columns filled but ahg_class is empty`);
    } else {
      if (!ahg.includes(r.ahg_class)) P.push(`${at}: unknown ahg_class "${r.ahg_class}"`);
      if (!['0', '1'].includes(r.ahg_rofi) || !['0', '1'].includes(r.ahg_factive)) P.push(`${at}: ahg_rofi and ahg_factive must be 0 or 1`);
      for (const a of r.ahg_alt_classes ? r.ahg_alt_classes.split(';') : []) if (!ahg.includes(a)) P.push(`${at}: unknown class "${a}" in ahg_alt_classes`);
    }
  });
  return P;
});

check('data/ahg_senses.csv — multi-sense AHG entries agree with predicates.csv', () => {
  const P = [];
  const byVerb = new Map(records.map((r) => [r.verb, r]));
  const groups = new Map();
  for (const s of parseCSV(read('data/ahg_senses.csv')).records) {
    if (!groups.has(s.verb)) groups.set(s.verb, []);
    groups.get(s.verb).push(s);
  }
  for (const [verb, ss] of groups) {
    const r = byVerb.get(verb);
    if (!r) { P.push(`${verb}: not in predicates.csv`); continue; }
    if (ss.length < 2) P.push(`${verb}: list every sense, primary included (at least two rows)`);
    const prim = ss.find((s) => s.ahg_class === r.ahg_class);
    if (!prim) P.push(`${verb}: its primary class (${r.ahg_class || 'none'}) is not among its senses`);
    else if (prim.ahg_rofi !== r.ahg_rofi || prim.ahg_factive !== r.ahg_factive || prim.ahg_subclass !== r.ahg_subclass) {
      P.push(`${verb}: primary-sense values differ from predicates.csv`);
    }
    const alts = ss.filter((s) => s !== prim).map((s) => s.ahg_class).sort().join(';');
    const want = (r.ahg_alt_classes ? r.ahg_alt_classes.split(';') : []).sort().join(';');
    if (alts !== want) P.push(`${verb}: other senses (${alts || 'none'}) ≠ ahg_alt_classes (${want || 'none'})`);
  }
  for (const r of records) if (r.ahg_alt_classes && !groups.has(r.verb)) P.push(`${r.verb}: has ahg_alt_classes but no rows in ahg_senses.csv`);
  return P;
});

check('src/levin_classes.js — every class member is in predicates.csv, once', () => {
  const P = [];
  const verbs = new Set(records.map((r) => r.verb));
  const where = new Map();
  for (const [code, c] of Object.entries(lex.DACE_LEVIN_CLASSES)) {
    for (const m of c.members) {
      if (!verbs.has(m)) P.push(`${code}: member "${m}" is not in predicates.csv`);
      if (where.has(m)) P.push(`"${m}" is listed in both ${where.get(m)} and ${code}`);
      where.set(m, code);
    }
  }
  return P;
});

check('documentation deep links resolve to headings', () => {
  const P = [];
  const ids = {};
  for (const pg of ['docs/alternations.html', 'docs/verb_classes.html']) ids[pg] = headingIds(files[pg]);
  let n = 0;
  for (const name of ['DACE_FEATURES', 'DACE_CLASSES', 'DACE_LEVIN_CLASSES', 'DACE_AHG_CLASSES']) {
    for (const [k, v] of Object.entries(lex[name] || {})) {
      if (!v || typeof v.url !== 'string') continue;
      n++;
      const [pg, anchor] = v.url.split('#');
      if (!ids[pg]) P.push(`${name}.${k}: links to ${pg}, which the build does not produce`);
      else if (anchor && !ids[pg].has(anchor)) P.push(`${name}.${k}: #${anchor} is not a heading in ${pg} (renamed?)`);
    }
  }
  if (n < 40) P.push(`only ${n} deep links found — did src/glossary.js load?`);
  return P;
});

check('Judge export (src/csv-export.js) reproduces data/predicates.csv exactly', () => {
  const P = [];
  const sb = {};
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read('src/csv-export.js'), sb);
  const csv = read('data/predicates.csv');
  const lines = csv.split('\n');
  const out = sb.daceMergedCSV(predicates, {}, binaryCols, header);
  if (out !== csv) {
    const a = out.split('\n');
    const i = a.findIndex((l, j) => l !== lines[j]);
    P.push(`first difference at line ${i + 1}:`, `  export: ${a[i]}`, `  csv:    ${lines[i]}`);
  }
  const est = predicates.find((p) => /features estimated/i.test(p.notes));
  if (est) {
    const all = Object.fromEntries(binaryCols.map((k) => [`${est.verb}|${k}`, String(est[k])]));
    const changed = sb.daceMergedCSV(predicates, all, binaryCols, header).split('\n').filter((l, j) => l !== lines[j]);
    if (changed.length !== 1 || /features estimated/i.test(changed[0])) {
      P.push(`judging every feature of "${est.verb}" should change only its notes (drop "features estimated")`);
    }
  }
  return P;
});

check('copular predicates — inapplicable features (factive passive, ditransitive) are 0', () => {
  // mirrors window.DACE_COPULAR_NA in src/frames.js
  const P = [];
  for (const r of records) if (r.verb.startsWith('be_')) for (const fk of ['factive_passive', 'ditransitive']) {
    if (r[fk] !== '0') P.push(`${r.verb}.${fk} = ${r[fk]} (must be 0: not applicable to a copular predicate)`);
  }
  return P;
});

check('data/annotations — sidecar entries name known predicates', () => {
  const verbs = new Set(records.map((r) => r.verb));
  const P = [];
  for (const [type, map] of Object.entries(data.baked)) for (const v of Object.keys(map)) if (!verbs.has(v)) P.push(`${type}.json: unknown verb "${v}"`);
  return P;
});

check('test-sentence frames match data/frames.lock.json (if not: npm run frames:lock, then npm run build)', () => {
  // a template changed without a version bump would attach new judgements to an old
  // version (or old judgements to a sentence nobody saw) — see scripts/lib/frames.mjs
  const { changes } = nextLock(readLock(ROOT), frameTemplates(ROOT));
  return changes;
});

check('every judgeable cell has a frame item, a version and a plain sentence (daceTestItem)', () => {
  const P = [];
  const sb = { console };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(files['assets/data.js'] + '\n;\n' + files['assets/lexicon.js'], sb);
  let n = 0;
  for (const p of sb.DACE_PREDICATES) for (const fk of sb.DACE_BINARY_COLS) {
    if (sb.DACE_UNJUDGED.includes(fk) || sb.daceInapplicable(p.verb, fk)) continue;
    n++;
    const it = sb.daceTestItem(fk, p.levin_class, p.display);
    if (!it) { P.push(`${p.verb}.${fk}: no frame item`); continue; }
    if (!(it.frame_v > 0)) P.push(`${p.verb}.${fk}: ${it.item} has no version in data/frames.lock.json`);
    if (!it.text || /[<>]|\(that\)/.test(it.text) || it.text.startsWith('*')) P.push(`${p.verb}.${fk}: bad plain sentence "${it.text}"`);
  }
  if (n !== 22400) P.push(`expected 22,400 judgeable cells, found ${n.toLocaleString()} (update this check if the grid changed on purpose)`);
  return P;
});

check('built scripts compile (syntax, clashing top-level names)', () => {
  const P = [];
  for (const [rel, src] of Object.entries(files)) {
    if (!rel.endsWith('.js')) continue;
    try { new vm.Script(src, { filename: rel }); } catch (e) { P.push(`${rel}: ${e.message}`); }
  }
  // each page runs data + lexicon + its app in one global scope
  for (const app of ['explorer.js', 'judge.js']) {
    try { new vm.Script(['data.js', 'lexicon.js', app].map((n) => files['assets/' + n]).join('\n;\n')); }
    catch (e) { P.push(`data.js + lexicon.js + ${app}: ${e.message}`); }
  }
  return P;
});

check('site/ matches the sources (if not: npm run build, then commit site/)', () => {
  const dir = path.join(ROOT, 'site');
  if (!fs.existsSync(dir)) return ['site/ is missing — run npm run build'];
  const P = [];
  const onDisk = new Set(listFiles(dir).map((f) => path.relative(dir, f).split(path.sep).join('/')));
  for (const [rel, content] of Object.entries(files)) {
    if (!onDisk.has(rel)) { P.push(`missing: site/${rel}`); continue; }
    onDisk.delete(rel);
    if (!fs.readFileSync(path.join(dir, rel)).equals(Buffer.from(content))) P.push(`out of date: site/${rel}`);
  }
  for (const rel of onDisk) P.push(`not produced by the build: site/${rel}`);
  return P;
});

const s = data.stats;
console.log(failed ? `\n${failed} check(s) failed.` :
  `\nAll checks passed — ${s.predicates} predicates, ${s.features} features, ${s.estimated} estimated.`);
process.exit(failed ? 1 : 0);
