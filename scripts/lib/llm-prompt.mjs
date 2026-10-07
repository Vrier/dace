// llm-prompt.mjs — the LLM judge's view of a Judge card (CLAUDE.md, "The LLM judge").
// The cells and card text come from the built site (data.js + lexicon.js), so the
// prompt is what a person sees: the question and buttons from src/judge-card.js,
// the minimal pair, and the sentence from daceTestItem. Used by
// scripts/llm-page.mjs (which builds the claude.ai page that asks Claude) and npm test.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---- the site's own data and lexicon (exactly what the Judge loads) -------------
// files: built site files in memory (npm test), else site/ on disk
export function loadSite(files) {
  const w = {}; w.window = w;
  const ctx = vm.createContext(w);
  for (const f of ['assets/data.js', 'assets/lexicon.js']) {
    vm.runInContext(files ? files[f] : fs.readFileSync(path.join(ROOT, 'site', f), 'utf8'), ctx, { filename: f });
  }
  return w;
}

// the Judge's 22,400 cells, in predicates.csv order (judge-app.jsx QUEUE)
export function judgeQueue(W) {
  const q = [];
  for (const p of W.DACE_PREDICATES) for (const fk of W.DACE_BINARY_COLS) {
    if (W.DACE_UNJUDGED.includes(fk) || W.daceInapplicable(p.verb, fk)) continue;
    const ti = W.daceTestItem(fk, p.levin_class, p.display);
    if (!ti) continue;
    q.push({ verb: p.verb, display: p.display, feature: fk, item: ti.item, frame_v: ti.frame_v, sentence: ti.text });
  }
  return q;
}

const text = (html) => String(html || '')
  .replace(/<li>/g, '\n  - ').replace(/<\/li>|<\/?ul[^>]*>/g, '')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').trim();

export function cardPrompt(W, c) {
  const f = W.DACE_FEATURES[c.feature] || {};
  const pair = W.DACE_FEATURE_PAIRS[c.feature];
  const qtype = W.DACE_QUESTION_TYPE[c.feature];
  const buttons = W.daceCardButtons(c.feature);
  const lines = [`Predicate: ${c.display}`, `Feature: ${f.label || c.feature}${f.sec ? ` (§${f.sec})` : ''} — ${text(f.def)}`, '',
    `Question: ${text(W.daceCardQuestion(c.feature, c.display))}`];
  if (pair) lines.push('', 'Reference pair (a clearly good and a clearly bad example of the construction):', `  ✓ ${pair.good}`, `  ✗ ${pair.bad}`);
  lines.push('');
  if (qtype === 'meaning') {
    const [a, b] = c.sentence.split(' \u2248 ');
    lines.push(`Sentence: ${a}`, `Can it mean: ${b}`);
  } else if (qtype === 'nominal') {
    lines.push(`Frame (the blank is the nominal): ${c.sentence}`);
  } else {
    lines.push(`Test sentence: ${c.sentence}`);
  }
  lines.push('', 'Allowed responses:');
  for (const [r, b] of Object.entries(buttons)) lines.push(`  ${r} = ${b.label} (${b.sub.replace(/^\?\s+/, '')})`);
  return lines.join('\n');
}
