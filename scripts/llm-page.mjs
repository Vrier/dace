// npm run llm-page — build the LLM judge's claude.ai page (CLAUDE.md, "The LLM judge").
// Embeds every judgeable cell (verb, feature, item, frame version, sentence) and the
// per-feature card text into tools/llm-judge/page.html and writes
// tools/llm-judge/out/dace-llm-judge.html (gitignored), which Claude publishes as the
// artifact. The page asks Claude through the viewer's own claude.ai plan and keeps
// its answers in the artifact's database, keyed by a snapshot id (a hash of the
// embedded data): after a frame change, rebuild and republish to the same artifact;
// answers on the old snapshot stay readable for consolidation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSite, judgeQueue, cardPrompt } from './lib/llm-prompt.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** files: built site files in memory (npm test), else site/ on disk */
export function buildPage(files) {
  const W = loadSite(files);
  const q = judgeQueue(W);
  const verbs = [], vIdx = new Map();
  for (const p of W.DACE_PREDICATES) { vIdx.set(p.verb, verbs.length); verbs.push([p.verb, p.display]); }
  const feats = [...new Set(q.map((c) => c.feature))];
  const F = feats.map((fk) => {
    const meaning = W.DACE_QUESTION_TYPE[fk] === 'meaning';
    return { k: fk, label: (W.DACE_FEATURES[fk] || {}).label || fk, allowed: Object.keys(W.daceCardButtons(fk)),
      t: cardPrompt(W, { feature: fk, display: '\u0001', sentence: meaning ? '\u0002 \u2248 \u0003' : '\u0002' }) };
  });
  const items = [], iIdx = new Map();
  const C = q.map((c) => {
    const ik = c.item + '@' + c.frame_v;
    if (!iIdx.has(ik)) { iIdx.set(ik, items.length); items.push([c.item, c.frame_v]); }
    return [vIdx.get(c.verb), feats.indexOf(c.feature), iIdx.get(ik), c.sentence];
  });
  // the page's card(): the same substitution, checked against cardPrompt for every cell
  const fill = (f, display, sentence) => {
    const t = f.t.split('\u0001').join(display);
    if (t.includes('\u0003')) { const [a, b] = sentence.split(' \u2248 '); return t.replace('\u0002', () => a).replace('\u0003', () => b); }
    return t.replace('\u0002', () => sentence);
  };
  let mismatches = 0;
  for (const c of q) if (fill(F[feats.indexOf(c.feature)], c.display, c.sentence) !== cardPrompt(W, c)) mismatches++;
  const data = JSON.stringify({ v: verbs, f: F, i: items, c: C, gold: Object.keys(W.DACE_GOLD || {}) });
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
  const snap = (h >>> 0).toString(16).padStart(8, '0');
  const html = fs.readFileSync(path.join(ROOT, 'tools/llm-judge/page.html'), 'utf8')
    .replace('/*DATA*/null', () => data).replace('/*SNAP*/', snap);
  return { html, snap, cells: C.length, mismatches };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { html, snap, cells, mismatches } = buildPage();
  if (mismatches) { console.error(`${mismatches} prompt mismatch(es) — fix before publishing`); process.exit(1); }
  const out = path.join(ROOT, 'tools/llm-judge/out/dace-llm-judge.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`wrote tools/llm-judge/out/dace-llm-judge.html — ${cells} cells, snapshot ${snap}, ${(html.length / 1e6).toFixed(2)} MB`);
}
