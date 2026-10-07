// npm test — the checks CI runs before every deploy (see .github/workflows/deploy.yml).
// A failing check stops the deploy, so a broken push never reaches the server.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parseCSV } from './lib/csv.mjs';
import { headingIds } from './lib/docs.mjs';
import { buildSite, listFiles } from './lib/site.mjs';
import { frameTemplates, readLock, nextLock, frameRules, csvWriter } from './lib/frames.mjs';
import { krippendorffAlpha } from './lib/agreement.mjs';
import { consolidate, STATUSES } from './lib/consolidate.mjs';
import { loadSite, judgeQueue, cardPrompt, parseAnswer } from './llm-judge.mjs';

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

check('CSV writer (src/csv-export.js) reproduces data/predicates.csv exactly', () => {
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

check('LLM judge (scripts/llm-judge.mjs) — a prompt for every judgeable cell, same sentence and buttons as the Judge', () => {
  const P = [];
  const W = loadSite(files);
  const q = judgeQueue(W);
  if (q.length !== 22400) P.push(`${q.length} cells in the LLM judge's queue, expected 22,400`);
  for (const c of q) {
    const pr = cardPrompt(W, c);
    const allowed = Object.keys(W.daceCardButtons(c.feature));
    const shown = [...pr.matchAll(/^  ([a-z_]+) = /gm)].map((m) => m[1]);
    if (shown.join() !== allowed.join()) { P.push(`${c.verb}.${c.feature}: prompt offers ${shown}, the Judge ${allowed}`); continue; }
    for (const part of c.sentence.split(' \u2248 ')) if (!pr.includes(part)) P.push(`${c.verb}.${c.feature}: prompt lacks the sentence "${part}"`);
    if (/<[a-z\/][^>]*>/.test(pr)) P.push(`${c.verb}.${c.feature}: HTML left in the prompt`);
    if (`dace-${c.verb}-${c.feature}-${c.frame_v}-1`.length > 64) P.push(`${c.verb}.${c.feature}: custom_id too long`);
  }
  const a = parseAnswer('{"reason":"x","response":"marginal","flag":true,"note":"needs an object","nominals":[]}', ['acceptable', 'marginal']);
  if (!a || a.response !== 'marginal' || !a.flag || a.note !== 'needs an object') P.push('parseAnswer misread a valid answer');
  if (parseAnswer('{"response":"yes"}', ['acceptable'])) P.push('parseAnswer accepted a response the card does not offer');
  return P;
});

check('data/gold.csv — gold cells are judgeable cells with a valid expected response', () => {
  const P = [];
  const byVerb = new Map(predicates.map((p) => [p.verb, p]));
  const seen = new Set();
  data.goldRows.forEach((g, i) => {
    const at = `line ${i + 2} (${g.verb}.${g.feature})`;
    if (!byVerb.has(g.verb)) P.push(`${at}: unknown verb`);
    if (!binaryCols.includes(g.feature)) P.push(`${at}: unknown feature`);
    if (['phrasal', 'be_copula'].includes(g.feature) || (g.verb.startsWith('be_') && ['factive_passive', 'ditransitive'].includes(g.feature))) P.push(`${at}: not a judged cell`);
    if (!['acceptable', 'marginal', 'unacceptable'].includes(g.expected)) P.push(`${at}: expected must be acceptable, marginal or unacceptable`);
    const k = g.verb + '|' + g.feature;
    if (seen.has(k)) P.push(`${at}: listed twice`);
    seen.add(k);
  });
  return P;
});

check("agreement — Krippendorff's alpha matches the published example", () => {
  // Krippendorff (2011), 4 coders × 12 units with missing values; reference values
  // from the paper and the `krippendorff` Python package
  const N = null;
  const d = [[1, 2, 3, 3, 2, 1, 4, 1, 2, N, N, N], [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, N, 3],
    [N, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, N], [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, N]];
  const units = d[0].map((_, u) => d.map((r) => r[u]).filter((x) => x !== N));
  const P = [];
  for (const [level, want] of [['nominal', 0.743421], ['ordinal', 0.815388], ['interval', 0.849107]]) {
    const got = krippendorffAlpha(units, level);
    if (Math.abs(got - want) > 1e-6) P.push(`${level}: ${got} ≠ ${want}`);
  }
  return P;
});

const cellsRows = fs.existsSync(path.join(ROOT, 'data/cells.csv')) ? parseCSV(read('data/cells.csv')).records : null;
check('data/cells.csv — one row per cell, agreeing with predicates.csv (if not: npm run consolidate)', () => {
  if (!cellsRows) return ['data/cells.csv is missing — run npm run consolidate'];
  const P = [];
  const rules = frameRules(ROOT, data.frameV);
  let i = 0;
  for (const p of predicates) for (const fk of binaryCols) {
    const r = cellsRows[i++];
    const at = `${p.verb}.${fk}`;
    if (!r || r.verb !== p.verb || r.feature !== fk) { P.push(`row ${i + 1}: expected ${at}, found ${r ? r.verb + '.' + r.feature : 'nothing'}`); return P; }
    if (r.value !== String(p[fk])) P.push(`${at}: cells.csv says ${r.value}, predicates.csv ${p[fk]}`);
    if (!STATUSES.includes(r.status)) P.push(`${at}: unknown status ${r.status}`);
    const lexical = rules.unjudged.includes(fk), na = rules.inapplicable(p.verb, fk);
    if (lexical !== (r.status === 'lexical')) P.push(`${at}: status ${r.status}, but the cell is ${lexical ? '' : 'not '}lexical`);
    if (na !== (r.status === 'na')) P.push(`${at}: status ${r.status}, but the cell is ${na ? '' : 'not '}n/a`);
    if (r.status === 'estimated' && !/features estimated/i.test(p.notes)) P.push(`${at}: estimated, but the row isn't marked "features estimated"`);
  }
  if (cellsRows.length !== i) P.push(`${cellsRows.length - i} extra row(s) at the end`);
  return P;
});

check('data/adjudications.csv — names judged cells with legal values', () => {
  const P = [];
  const rows = parseCSV(read('data/adjudications.csv')).records;
  const rules = frameRules(ROOT, data.frameV);
  const verbs = new Set(predicates.map((p) => p.verb));
  const seen = new Set();
  rows.forEach((a, i) => {
    const at = `line ${i + 2} (${a.verb}.${a.feature})`;
    if (!verbs.has(a.verb) || !binaryCols.includes(a.feature)) P.push(`${at}: no such cell`);
    else if (rules.unjudged.includes(a.feature) || rules.inapplicable(a.verb, a.feature)) P.push(`${at}: not a judged cell`);
    if (!['0', '1', '5'].includes(a.value)) P.push(`${at}: value must be 0, 1 or 5`);
    if (!a.rationale) P.push(`${at}: give a rationale`);
    if (seen.has(a.verb + '|' + a.feature)) P.push(`${at}: listed twice`);
    seen.add(a.verb + '|' + a.feature);
  });
  return P;
});

check('consolidation rules (scripts/lib/consolidate.mjs) on a fixture log', () => {
  const P = [];
  const rules = frameRules(ROOT, data.frameV);
  const writeCsv = csvWriter(ROOT, binaryCols, header);
  const byVerb = new Map(predicates.map((p) => [p.verb, p]));
  const base = { ...data, byVerb, gold: {} };
  const know = byVerb.get('know');
  const est = predicates.find((p) => /features estimated/i.test(p.notes));
  const J = (judge, verb, fk, response, extra = {}) => {
    const item = rules.item(fk, byVerb.get(verb));
    return { judge, verb, feature: fk, kind: 'judge', response, item, frame_v: String(rules.version(item)), sentence: 's', gold: '0', repeat: '0', ...extra };
  };
  const events = [
    J('J01', 'know', 'comp_inf', 'acceptable'), J('J02', 'know', 'comp_inf', 'acceptable'), J('J03', 'know', 'comp_inf', 'acceptable'),
    J('J01', 'know', 'ecm', 'acceptable'), J('J02', 'know', 'ecm', 'unacceptable'), J('J03', 'know', 'ecm', 'unacceptable'),
    J('J01', 'know', 'weak_island', 'acceptable'),
    J('J01', 'know', 'stative', 'acceptable'), J('J01', 'know', 'stative', 'clear'),
    J('J01', 'know', 'raising', 'cant_judge'),
    J('J01', 'know', 'comp_gerund', 'acceptable', { frame_v: '99' }),
    J('J02', 'know', 'comp_gerund', 'marginal', { item: 'comp_gerund:legacy', frame_v: '0' }),
    J('J01', 'know', 'np_comp_alt', 'acceptable'), J('J01', 'know', 'np_comp_alt', 'unacceptable', { repeat: '1' }),
    J('J01', 'know', 'extraposition', 'unacceptable'),
    J('J04', 'know', 'that_omission', 'unacceptable'), J('J04', 'know', 'ecm', 'acceptable'),
    ...binaryCols.filter((fk) => !rules.unjudged.includes(fk) && !rules.inapplicable(est.verb, fk)).map((fk) => J('J01', est.verb, fk, 'marginal')),
  ];
  const adjudications = [{ verb: 'know', feature: 'extraposition', value: '1', rationale: 'fixture', date: '2026-10-07' }];
  const run = (config, gold = {}) => consolidate({ data: { ...base, gold }, frames: rules, events, adjudications, config: { min_gold_seen: 1, ...config }, writeCsv });
  const cell = (res, verb, fk) => res.rows.find((r) => r.verb === verb && r.feature === fk) || {};
  const want = (res, verb, fk, status, value, label) => {
    const r = cell(res, verb, fk);
    if (r.status !== status || (value !== undefined && r.value !== value)) P.push(`${label}: ${verb}.${fk} is ${r.status} ${r.value}, expected ${status} ${value ?? ''}`);
  };
  const a = run({}, { 'know|that_omission': 'acceptable' });
  want(a, 'know', 'comp_inf', 'consensus', '1', '3 of 3 agree');
  want(a, 'know', 'ecm', 'contested', String(know.ecm), '2 of 3, below 75 %; J04 excluded on gold');
  want(a, 'know', 'weak_island', 'provisional', '0', 'inverted feature, one judge');
  want(a, 'know', 'stative', 'coded', String(know.stative), 'cleared judgement');
  want(a, 'know', 'raising', 'coded', String(know.raising), "can't judge only");
  want(a, 'know', 'comp_gerund', 'provisional', '5', 'superseded frame dropped, legacy kept');
  want(a, 'know', 'np_comp_alt', 'provisional', '1', 'repeat ignored');
  want(a, 'know', 'extraposition', 'adjudicated', '1', 'adjudication wins');
  want(a, 'know', 'phrasal', 'lexical', String(know.phrasal), 'lexical');
  if (!a.summary.judges.find((j) => j.judge === 'J04' && j.excluded === 'gold')) P.push('J04 should be excluded for failing the gold cell');
  const j1 = a.summary.judges.find((j) => j.judge === 'J01');
  if (!j1 || j1.retest !== 1 || j1.retestAgree !== 0) P.push('J01 retest should be 1 repeat, 0 agreeing');
  if (a.contested.length !== 1 || a.contested[0].feature !== 'ecm') P.push('exactly know.ecm should be contested');
  const estLine = a.csv.split('\n').find((l) => l.startsWith(est.verb + ','));
  if (/features estimated/i.test(estLine)) P.push(`${est.verb}: fully judged, but "features estimated" was kept`);
  if (cell(a, est.verb, binaryCols.find((fk) => !rules.unjudged.includes(fk))).value !== '5') P.push(`${est.verb}: marginal responses should give 5`);
  const b = run({ author: ['J03'], exclude_author: true, use_legacy: false });
  want(b, 'know', 'comp_inf', 'provisional', '1', 'author excluded leaves 2 judges');
  want(b, 'know', 'comp_gerund', 'coded', String(know.comp_gerund), 'legacy not used');
  // an LLM judge (register variety "LLM: …") or a listed judge is left out, but still measured
  const llm = consolidate({ data: { ...base, gold: {} }, frames: rules, events, adjudications, config: { min_gold_seen: 1 }, writeCsv,
    register: [{ judge: 'J02', variety: 'LLM: claude-opus-5-5' }] });
  want(llm, 'know', 'comp_inf', 'provisional', '1', 'LLM judge excluded leaves 2 judges');
  want(llm, 'know', 'ecm', 'contested', String(know.ecm), 'J01 + J03 split once the LLM is out');
  const j2 = llm.summary.judges.find((j) => j.judge === 'J02');
  if (!j2 || j2.excluded !== 'LLM') P.push('J02 should be excluded as an LLM judge');
  else if (!j2.vsMajority || j2.vsMajority.overlap < 1) P.push("an excluded judge's agreement with the others should be reported");
  const listed = run({ exclude: ['J02'] });
  want(listed, 'know', 'comp_inf', 'provisional', '1', 'listed judge excluded');
  const incl = consolidate({ data: { ...base, gold: {} }, frames: rules, events, adjudications, config: { include_llm: true }, writeCsv,
    register: [{ judge: 'J02', variety: 'LLM: x' }] });
  want(incl, 'know', 'comp_inf', 'consensus', '1', 'include_llm counts the LLM again');
  const none = consolidate({ data: base, frames: rules, events: [], adjudications: [], config: {}, writeCsv });
  if (none.csv !== read('data/predicates.csv')) P.push('with no judgements, consolidation must reproduce data/predicates.csv exactly');
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
