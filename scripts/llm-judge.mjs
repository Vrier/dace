// npm run llm-judge — let an LLM judge cells through the Message Batches API.
// Run by .github/workflows/llm-judge.yml (Actions tab → "LLM judge" → Run).
// Each run does two things, in this order:
//
//   1. COLLECT  every finished batch from the last 28 days: each result is posted to
//      the Judge's event log (COMPOSE's PocketBase) as events from the LLM judge's
//      account — the first sample of a cell as an ordinary judge event (plus flag,
//      note and nominal events when the model gives them), the other samples as
//      `repeat` events, so consolidation's retest agreement measures how stable the
//      model's answers are. Already-posted results are skipped, so collecting twice
//      is harmless.
//   2. SUBMIT   --cells unanswered cells (no judge event yet on the cell's current
//      item and version), --samples requests each, as one new batch. Refused while
//      a batch is still in progress, so the same cells are never paid for twice.
//
// Every request is independent (no shared conversation): the card text comes from
// src/judge-card.js and the sentence from daceTestItem, as on a judge's screen.
// The LLM judge is excluded from consolidation (data/consolidation.json `exclude`)
// and its judgements stay on the server, never in this public repo.
//
// Environment: ANTHROPIC_API_KEY, DACE_LLM_EMAIL, DACE_LLM_PASSWORD (the LLM judge
// account), DACE_LLM_MODEL; optional DACE_PB (default https://compose.tstephen.com),
// ANTHROPIC_BASE_URL (testing), GITHUB_STEP_SUMMARY (written if set).
// Flags: --cells N (default 0 = collect only), --samples K (default 3), --dry-run
// (build the batch and print one prompt; nothing is sent or posted).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROMPT_VERSION = 1;
const RESULTS_DAYS = 28; // results stay downloadable for 29 days

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

export const SYSTEM = `You are one of several judges building DACE, a dictionary of the alternations of English clause-embedding predicates. Each request shows you one card from the judging tool, exactly as a human judge sees it, and asks for one judgement.

How to judge:
- Judge the test sentence as written, as a careful native speaker of English would, in ordinary usage with a natural intonation. Do not reason from what the predicate "should" allow in theory, and do not let the reference pair decide for you: it only illustrates the construction.
- Acceptable: the sentence is fine. Marginal: degraded but not out (some speakers would accept it, or it needs a strained reading). Unacceptable: the sentence is out. Can't judge: you cannot get a reading to judge at all.
- The meaning question (neg-raising) asks whether the first sentence can mean the second; the derived-nominal question asks whether a noun exists. Answer those as asked.
- If the sentence fails for a reason that has nothing to do with the construction being tested (for example, the verb needs an argument the frame doesn't give it, or the frame forces the wrong sense of the verb), still give your judgement of the sentence, but set "flag" to true and say why in "note". If that problem stops you judging the construction at all, answer cant_judge and flag it.
- The frames deliberately leave out prepositions ("She informed him the news", not "of the news"): judge the bare construction as shown, and don't flag a missing preposition.
- Only the response values listed on the card are allowed.

Reply with one JSON object and nothing else, keys in this order:
{"reason": "<at most 25 words>", "response": "<one of the allowed values>", "flag": false, "note": "", "nominals": []}
"nominals" lists the noun or nouns when you answer acceptable (Yes) on the derived-nominal question; otherwise leave it empty. "note" stays empty unless "flag" is true.`;

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

// custom_id: dace-<verb>-<feature>-<frame_v>-<sample>; verbs and features use [a-z_] only
const cid = (c, k) => `dace-${c.verb}-${c.feature}-${c.frame_v}-${k}`;
const parseCid = (s) => { const m = /^dace-([a-z_]+)-([a-z_]+)-(\d+)-(\d+)$/.exec(s); return m && { verb: m[1], feature: m[2], frame_v: +m[3], k: +m[4] }; };

export function parseAnswer(raw, allowed) {
  const m = /\{[\s\S]*\}/.exec(raw || '');
  if (!m) return null;
  let o; try { o = JSON.parse(m[0]); } catch { return null; }
  if (!o || !allowed.includes(o.response)) return null;
  const nominals = Array.isArray(o.nominals) ? o.nominals.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : [];
  return { response: o.response, flag: o.flag === true, note: o.flag === true ? String(o.note || o.reason || '').slice(0, 1000) : '', nominals };
}

// seeded shuffle (mulberry32), so each run's cells are a random spread, reproducibly
function shuffled(arr, seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---- HTTP -------------------------------------------------------------------------
async function http(url, opts = {}, tries = 4) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, opts).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
    if (res.ok) return res;
    const body = await res.text();
    if (i + 1 >= tries || (res.status && res.status < 500 && res.status !== 429)) throw new Error(`${opts.method || 'GET'} ${url.replace(/\?.*/, '')} → ${res.status}: ${body.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
}

function anthropic(key, base) {
  const h = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
  return {
    async batches() {
      const out = []; let after = null;
      for (let page = 0; page < 20; page++) {
        const res = await http(`${base}/v1/messages/batches?limit=100${after ? `&after_id=${after}` : ''}`, { headers: h });
        const j = await res.json();
        out.push(...j.data);
        if (!j.has_more) break;
        after = j.last_id;
      }
      return out;
    },
    async results(url) { return (await (await http(url, { headers: h })).text()).split('\n').filter(Boolean).map((l) => JSON.parse(l)); },
    async create(requests) { return (await http(`${base}/v1/messages/batches`, { method: 'POST', headers: h, body: JSON.stringify({ requests }) })).json(); },
  };
}

async function pocketbase(base, email, password) {
  const res = await http(`${base}/api/collections/users/auth-with-password`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identity: email, password }) }, 1);
  const { token, record } = await res.json();
  if (!record.judge) throw new Error(`${email} is not a judge account`);
  const h = { Authorization: token, 'content-type': 'application/json' };
  return {
    user: record,
    async events() {
      const out = [];
      for (let page = 1; ; page++) {
        const q = new URLSearchParams({ page, perPage: 1000, skipTotal: '1', sort: 'created', fields: 'verb,feature,kind,response,item,frame_v,repeat' });
        const j = await (await http(`${base}/api/collections/dace_events/records?${q}`, { headers: h })).json();
        out.push(...j.items);
        if (j.items.length < 1000) return out;
      }
    },
    // the register entry consolidation uses to leave this judge out (variety "LLM: …")
    async profile(variety) {
      if (record.variety === variety && record.profile_done) return;
      await http(`${base}/api/collections/users/records/${record.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ variety, linguist: false, consent_publish: false, profile_done: true }) });
    },
    async post(ev) { await http(`${base}/api/collections/dace_events/records`, { method: 'POST', headers: h, body: JSON.stringify({ user: record.id, ...ev }) }); },
  };
}

// ---- the run ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i === -1 ? d : args[i + 1]; };
  const nCells = parseInt(opt('--cells', '0'), 10) || 0;
  const samples = Math.max(1, Math.min(10, parseInt(opt('--samples', '3'), 10) || 3));
  const dry = args.includes('--dry-run');
  const env = (k, d) => { const v = process.env[k] || d; if (v === undefined && !dry) throw new Error(`${k} is not set`); return v; };
  const model = env('DACE_LLM_MODEL', 'claude-opus-5-5');
  const log = []; const say = (s) => { console.log(s); log.push(s); };

  const W = loadSite();
  const queue = judgeQueue(W);
  const byCell = new Map(queue.map((c) => [c.verb + '|' + c.feature, c]));
  const gold = W.DACE_GOLD || {};

  if (dry) {
    const c = queue.find((x) => x.verb === 'fool' && x.feature === 'weak_island') || queue[0];
    console.log(`${queue.length} judgeable cells. Prompt v${PROMPT_VERSION}, model ${model}.\n\n--- system ---\n${SYSTEM}\n\n--- user (${cid(c, 1)}) ---\n${cardPrompt(W, c)}`);
    return;
  }

  const pb = await pocketbase(env('DACE_PB', 'https://compose.tstephen.com'), env('DACE_LLM_EMAIL'), env('DACE_LLM_PASSWORD'));
  const api = anthropic(env('ANTHROPIC_API_KEY'), env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'));
  await pb.profile(`LLM: ${model}, prompt v${PROMPT_VERSION}`);
  say(`LLM judge ${pb.user.judge_code || '(code assigned with its first event)'} · model ${model} · prompt v${PROMPT_VERSION}`);

  // what this judge has already said, on each cell's current item and version
  const state = new Map(); // cell -> { main: bool, repeats: n }
  for (const e of await pb.events()) {
    if (e.kind !== 'judge') continue;
    const c = byCell.get(e.verb + '|' + e.feature);
    if (!c || e.item !== c.item || Number(e.frame_v) !== c.frame_v) continue;
    const s = state.get(c.verb + '|' + c.feature) || { main: false, repeats: 0 };
    if (e.repeat) s.repeats++; else if (e.response !== 'clear') s.main = true;
    state.set(c.verb + '|' + c.feature, s);
  }

  // ---- 1. collect ----
  const since = Date.now() - RESULTS_DAYS * 864e5;
  const batches = (await api.batches()).filter((b) => Date.parse(b.created_at) >= since);
  const pending = batches.filter((b) => b.processing_status !== 'ended');
  const got = new Map(); // cell -> [{k, answer}]
  let results = 0, stale = 0, unparsed = 0, failed = 0;
  const usage = { input: 0, cache_read: 0, cache_write: 0, output: 0 };
  for (const b of batches.filter((x) => x.processing_status === 'ended' && x.results_url)) {
    for (const r of await api.results(b.results_url)) {
      const id = parseCid(r.custom_id);
      if (!id) continue; // another project's batch
      results++;
      const c = byCell.get(id.verb + '|' + id.feature);
      if (!c || c.frame_v !== id.frame_v) { stale++; continue; }
      if (r.result.type !== 'succeeded') { failed++; continue; }
      const m = r.result.message;
      const u = m.usage || {};
      usage.input += u.input_tokens || 0; usage.cache_read += u.cache_read_input_tokens || 0;
      usage.cache_write += u.cache_creation_input_tokens || 0; usage.output += u.output_tokens || 0;
      const a = parseAnswer((m.content || []).filter((x) => x.type === 'text').map((x) => x.text).join(''), Object.keys(W.daceCardButtons(c.feature)));
      if (!a) { unparsed++; continue; }
      const key = c.verb + '|' + c.feature;
      if (!got.has(key)) got.set(key, []);
      got.get(key).push({ k: id.k, ...a });
    }
  }
  // post: per cell, the earliest sample becomes the judgement, the rest are repeats
  let posted = 0, cellsDone = 0;
  const stable = { cells: 0, same: 0, pairs: 0, pairsSame: 0 };
  const cells = [...got.entries()];
  async function postCell([key, list]) {
    const c = byCell.get(key);
    list.sort((x, y) => x.k - y.k);
    const s = state.get(key) || { main: false, repeats: 0 };
    const base = { verb: c.verb, feature: c.feature, item: c.item, frame_v: c.frame_v, sentence: c.sentence.slice(0, 1000), gold: gold[key] !== undefined };
    const [first, ...rest] = list;
    if (!s.main) {
      await pb.post({ ...base, kind: 'judge', response: first.response }); posted++;
      if (first.flag) {
        await pb.post({ ...base, kind: 'flag', response: '', sentence: '' }); posted++;
        if (first.note) { await pb.post({ ...base, kind: 'note', response: first.note, sentence: '' }); posted++; }
      }
      if (c.feature === 'derived_nominal' && first.response === 'acceptable' && first.nominals.length) {
        await pb.post({ verb: c.verb, kind: 'nominal', response: first.nominals.join(', ') }); posted++;
      }
      s.main = true;
    }
    for (const r of rest.slice(s.repeats)) { await pb.post({ ...base, kind: 'judge', response: r.response, repeat: true }); posted++; s.repeats++; }
    state.set(key, s);
    cellsDone++;
    if (list.length > 1) {
      stable.cells++;
      if (list.every((x) => x.response === first.response)) stable.same++;
      for (const x of rest) { stable.pairs++; if (x.response === first.response) stable.pairsSame++; }
    }
  }
  for (let i = 0; i < cells.length; i += 4) await Promise.all(cells.slice(i, i + 4).map(postCell)); // 4 at a time; each cell in order
  say(`Collected ${results} result(s) from ${batches.length - pending.length} finished batch(es): ${posted} new event(s) posted` +
    (stale ? `, ${stale} on frames changed since` : '') + (failed ? `, ${failed} errored/expired` : '') + (unparsed ? `, ${unparsed} unreadable` : '') + '.');
  if (stable.cells) say(`Stability: every sample agreed in ${stable.same}/${stable.cells} cells (${Math.round(100 * stable.same / stable.cells)} %); repeat = first sample in ${stable.pairsSame}/${stable.pairs} (${Math.round(100 * stable.pairsSame / stable.pairs)} %).`);
  if (results) say(`Tokens: ${usage.input} input, ${usage.cache_read} cache reads, ${usage.cache_write} cache writes, ${usage.output} output.`);

  // ---- 2. submit ----
  const unanswered = queue.filter((c) => !(state.get(c.verb + '|' + c.feature) || {}).main);
  say(`${queue.length - unanswered.length} of ${queue.length} cells answered; ${unanswered.length} to go.`);
  if (nCells > 0) {
    if (pending.length) {
      say(`Not submitting: ${pending.length} batch(es) still in progress (${pending.map((b) => b.id).join(', ')}). Run again once they have finished.`);
    } else if (!unanswered.length) {
      say('Nothing left to submit.');
    } else {
      const pick = shuffled(unanswered, 20261008).slice(0, nCells);
      const system = [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral', ttl: '1h' } }];
      const requests = [];
      for (const c of pick) for (let k = 1; k <= samples; k++) {
        requests.push({ custom_id: cid(c, k), params: { model, max_tokens: 400, system, messages: [{ role: 'user', content: cardPrompt(W, c) }] } });
      }
      const b = await api.create(requests);
      say(`Submitted batch ${b.id}: ${pick.length} cell(s) × ${samples} sample(s) = ${requests.length} request(s). Run again (cells 0) once it has finished, usually within the hour.`);
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## LLM judge\n\n' + log.map((l) => '- ' + l).join('\n') + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message || e); process.exit(1); });
}
