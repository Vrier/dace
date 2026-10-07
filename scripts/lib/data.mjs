// data.mjs — builds the Explorer/Judge dataset (site/assets/data.js) from sources.
//
// Sources of truth
//   data/predicates.csv        one row per predicate: classes, 26 binary features,
//                              factivity, veridicality, notes. Edited by hand; judged
//                              values will come from consolidation (PLAN.md).
//   data/ahg_senses.csv        per-sense AHG memberships for multi-sense predicates
//                              (predicates.csv holds only the primary sense).
//   src/levin_classes.js       Levin-style class membership lists (verb_classes.md).
//   data/annotations/*.json    Judge sidecar files (example sentences, derived nominals).
//   data/frames.lock.json      version of every test-sentence template (scripts/lib/frames.mjs).
//   data/gold.csv              gold cells for the Judge: verb, feature, expected response
//                              (uncontroversial cells, spread through each judge's queue).
//   data/cells.csv             where every cell's value came from (npm run consolidate):
//                              baked in as a status letter per binary column (CELL_CODE)
//                              plus judge count and agreement for judged cells.
//   data/consolidation.json    the consolidation thresholds (for the About page).
//
// Derived fields (never stored): display, lemma, levin_class, ahg[], notesClean.
// (MegaVeridicality scores were joined in here until Oct 2026; removed so DACE
// redistributes no third-party data — see PLAN.md, "Licence".)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseCSV } from './csv.mjs';
import { readLock, frameVersions } from './frames.mjs';

// cells.csv status → one letter in a predicate's `st` string (src/engine.jsx reads it)
export const CELL_CODE = { adjudicated: 'a', consensus: 'k', provisional: 'p', contested: 'x', estimated: 'e', coded: 'c', lexical: 'l', na: 'n' };

export const META_COLS = ['verb', 'semantic_class', 'ahg_class', 'ahg_rofi', 'ahg_factive',
  'ahg_alt_classes', 'ahg_subclass', 'factivity', 'veridicality', 'notes'];

const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n?/g, '\n');

/** Evaluate the browser data modules (glossary, AHG, Levin) in a sandbox. */
export function loadLexicon(root) {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['src/glossary.js', 'src/ahg.js', 'src/levin_classes.js']) {
    vm.runInContext(read(root, f), sandbox, { filename: f });
  }
  return sandbox;
}

const NOTE_HIDDEN = [/^megav(_ver)?=/, /^features estimated$/i, /^added from /i];
/** The notes shown in the Explorer: provenance/bookkeeping segments removed. */
export function cleanNotes(notes) {
  return (notes || '').split(/;\s*/).map((s) => s.trim())
    .filter((s) => s && !NOTE_HIDDEN.some((re) => re.test(s))).join('; ');
}

function readBaked(root, type) {
  const rel = `data/annotations/${type}.json`;
  if (!fs.existsSync(path.join(root, rel))) return {};
  const obj = JSON.parse(read(root, rel));
  if (!obj || obj._dace !== type || typeof obj.data !== 'object') {
    throw new Error(`${rel}: expected a DACE "${type}" sidecar file exported from the Judge`);
  }
  // stable key order so rebuilding is deterministic
  return Object.fromEntries(Object.keys(obj.data).sort().map((k) => [k, obj.data[k]]));
}

export function buildData(root) {
  const lex = loadLexicon(root);
  const { header, records } = parseCSV(read(root, 'data/predicates.csv'));
  const binaryCols = header.filter((h) => !META_COLS.includes(h));
  const senses = new Map();
  for (const s of parseCSV(read(root, 'data/ahg_senses.csv')).records) {
    if (!senses.has(s.verb)) senses.set(s.verb, []);
    senses.get(s.verb).push({ c: s.ahg_class, r: Number(s.ahg_rofi), f: Number(s.ahg_factive), s: s.ahg_subclass });
  }
  const levinOf = lex.DACE_VERB_TO_LEVIN;

  const predicates = records.map((r) => {
    const display = r.verb.replace(/_/g, ' ');
    const hasAhg = r.ahg_class !== '';
    const primary = hasAhg ? { c: r.ahg_class, r: Number(r.ahg_rofi), f: Number(r.ahg_factive), s: r.ahg_subclass } : null;
    const p = {
      verb: r.verb,
      display,
      lemma: r.verb.startsWith('be_') ? display.slice(3) : display, // adjectival rows query Wiktionary by the adjective
      semantic_class: r.semantic_class,
      ahg_class: r.ahg_class,
      ahg_rofi: hasAhg ? primary.r : 0,
      ahg_factive: hasAhg ? primary.f : 0,
      ahg_alt: r.ahg_alt_classes,
      ahg_subclass: r.ahg_subclass,
      ahg: senses.get(r.verb) || (hasAhg ? [primary] : []),
      levin_class: levinOf[r.verb] || '',
    };
    for (const k of binaryCols) p[k] = Number(r[k]);
    p.factivity = r.factivity;
    p.veridicality = r.veridicality;
    p.notes = r.notes;
    p.notesClean = cleanNotes(r.notes);
    return p;
  });

  const baked = { sentences: readBaked(root, 'sentences'), nominals: readBaked(root, 'nominals') };
  const pkg = JSON.parse(read(root, 'package.json'));
  const stats = {
    version: pkg.version,
    predicates: predicates.length,
    features: binaryCols.length,
    estimated: predicates.filter((p) => /features estimated/i.test(p.notes)).length,
    levinClasses: Object.keys(lex.DACE_LEVIN_CLASSES).length,
    levinAssigned: predicates.filter((p) => p.levin_class).length,
    ahgTagged: predicates.filter((p) => p.ahg_class).length,
    semanticClasses: Object.keys(lex.DACE_CLASSES).length,
  };
  // per-cell provenance (data/cells.csv, from npm run consolidate)
  const cellRows = fs.existsSync(path.join(root, 'data/cells.csv')) ? parseCSV(read(root, 'data/cells.csv')).records : [];
  const cellOf = new Map(cellRows.map((c) => [c.verb + '|' + c.feature, c]));
  const cellCount = {};
  for (const c of cellRows) cellCount[c.status] = (cellCount[c.status] || 0) + 1;
  for (const p of predicates) {
    p.st = binaryCols.map((k) => { const c = cellOf.get(p.verb + '|' + k); return c ? (CELL_CODE[c.status] || '?') : '?'; }).join('');
    const judged = {};
    for (const k of binaryCols) { const c = cellOf.get(p.verb + '|' + k); if (c && Number(c.n) > 0) judged[k] = [Number(c.n), Number(c.agreement)]; }
    if (Object.keys(judged).length) p.jn = judged;
  }
  const cons = fs.existsSync(path.join(root, 'data/consolidation.json')) ? JSON.parse(read(root, 'data/consolidation.json')) : {};
  Object.assign(stats, {
    cellsJudgeable: cellRows.filter((c) => !['lexical', 'na'].includes(c.status)).length,
    cellsConsensus: cellCount.consensus || 0, cellsProvisional: cellCount.provisional || 0,
    cellsAdjudicated: cellCount.adjudicated || 0, cellsContested: cellCount.contested || 0,
    minJudges: cons.min_judges ?? 3, majorityPct: Math.round((cons.majority ?? 0.75) * 100),
  });
  const frameV = frameVersions(readLock(root));
  const goldRows = fs.existsSync(path.join(root, 'data/gold.csv')) ? parseCSV(read(root, 'data/gold.csv')).records : [];
  const gold = Object.fromEntries(goldRows.map((g) => [g.verb + '|' + g.feature, g.expected]));
  return { header, records, binaryCols, predicates, baked, stats, lex, frameV, goldRows, gold };
}

/** data.js — one predicate per line so diffs of judged data stay reviewable. */
export function renderDataJs({ header, binaryCols, predicates, baked, stats, frameV, gold }) {
  return [
    '// DACE data — GENERATED by `npm run build` from data/. Do not edit by hand.',
    'window.DACE_BUILD = ' + JSON.stringify(stats) + ';',
    'window.DACE_BINARY_COLS = ' + JSON.stringify(binaryCols) + ';',
    'window.DACE_CSV_HEADER = ' + JSON.stringify(header) + ';',
    'window.DACE_PREDICATES = [',
    predicates.map((p) => JSON.stringify(p)).join(',\n'),
    '];',
    'window.DACE_BAKED_ANNOTATIONS = ' + JSON.stringify(baked) + ';',
    'window.DACE_FRAME_VERSIONS = ' + JSON.stringify(frameV) + ';',
    'window.DACE_GOLD = ' + JSON.stringify(gold) + ';',
    '',
  ].join('\n');
}
