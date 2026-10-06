// data.mjs — builds the Explorer/Judge dataset (site/assets/data.js) from sources.
//
// Sources of truth
//   data/predicates.csv        one row per predicate: classes, 26 binary features,
//                              factivity, veridicality, notes. Edited by hand or
//                              replaced by the Judge's "Merged predicates.csv" export.
//   data/ahg_senses.csv        per-sense AHG memberships for multi-sense predicates
//                              (predicates.csv holds only the primary sense).
//   src/levin_classes.js       Levin-style class membership lists (verb_classes.md).
//   data/annotations/*.json    Judge sidecar files (example sentences, derived nominals).
//   provenance/megaattitude/mega-veridicality-v2.1/…-normalized.tsv
//                              MegaVeridicality v2.1 (White & Rawlins; CC BY-SA 4.0).
//
// Derived fields (never stored): display, lemma, levin_class, ahg[], megav, notesClean.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseCSV, parseTSV } from './csv.mjs';

export const META_COLS = ['verb', 'semantic_class', 'ahg_class', 'ahg_rofi', 'ahg_factive',
  'ahg_alt_classes', 'ahg_subclass', 'factivity', 'veridicality', 'notes'];
export const MEGAV_TSV = 'provenance/megaattitude/mega-veridicality-v2.1/mega-veridicality-v2.1-normalized.tsv';
const ACTIVE_FRAME = 'NP Ved that S';
const PASSIVE_FRAME = 'NP was Ved that S';

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

/** MegaVeridicality index: verb → { active, passive } normalized that-clause veridicality. */
export function loadMegaV(root) {
  const idx = new Map();
  for (const r of parseTSV(read(root, MEGAV_TSV))) {
    const e = idx.get(r.verb) || {};
    if (r.frame === ACTIVE_FRAME) e.active = Number(r.veridicalitynorm);
    if (r.frame === PASSIVE_FRAME) e.passive = Number(r.veridicalitynorm);
    idx.set(r.verb, e);
  }
  return idx;
}

/**
 * One rule for every predicate: the active that-clause frame ("NP Ved that S") if
 * MegaVeridicality has it, otherwise the passive one ("NP was Ved that S", the
 * natural frame for psych and tell-type verbs); "no_ver" if the verb is in the
 * dataset without a that-clause frame; null if it is not in the dataset.
 */
export function megavFor(verb, idx) {
  const e = idx.get(verb);
  if (!e) return null;
  const v = e.active !== undefined ? e.active : e.passive;
  if (v === undefined) return 'no_ver';
  return Number(v.toFixed(2));
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
  const megav = loadMegaV(root);
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
    p.megav = megavFor(r.verb, megav);
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
    megav: predicates.filter((p) => typeof p.megav === 'number').length,
    levinClasses: Object.keys(lex.DACE_LEVIN_CLASSES).length,
    levinAssigned: predicates.filter((p) => p.levin_class).length,
    ahgTagged: predicates.filter((p) => p.ahg_class).length,
    semanticClasses: Object.keys(lex.DACE_CLASSES).length,
  };
  return { header, records, binaryCols, predicates, baked, stats, lex };
}

/** data.js — one predicate per line so diffs of judged data stay reviewable. */
export function renderDataJs({ header, binaryCols, predicates, baked, stats }) {
  return [
    '// DACE data — GENERATED by `npm run build` from data/ and provenance/. Do not edit by hand.',
    '// MegaVeridicality values: White & Rawlins, MegaVeridicality v2.1, CC BY-SA 4.0 (megaattitude.io).',
    'window.DACE_BUILD = ' + JSON.stringify(stats) + ';',
    'window.DACE_BINARY_COLS = ' + JSON.stringify(binaryCols) + ';',
    'window.DACE_CSV_HEADER = ' + JSON.stringify(header) + ';',
    'window.DACE_PREDICATES = [',
    predicates.map((p) => JSON.stringify(p)).join(',\n'),
    '];',
    'window.DACE_BAKED_ANNOTATIONS = ' + JSON.stringify(baked) + ';',
    '',
  ].join('\n');
}
