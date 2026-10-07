// consolidate.mjs — turn the judgement log into DACE's cell values (PLAN.md,
// "Judgement data", phase 4). Pure: no file access, so npm test can run it on a
// fixture. scripts/consolidate.mjs does the reading and writing.
//
// For every (predicate, binary feature) cell, in priority order:
//   adjudicated  an entry in data/adjudications.csv (Thomas's decision) wins;
//   consensus    ≥ min_judges usable responses and ≥ majority of them on one value;
//   provisional  fewer judges than that, all agreeing;
//   contested    judged but split — keeps its current value until adjudicated;
//   estimated / coded   nobody has judged it: the current value stands (estimated
//                if the row is still marked "features estimated", else Thomas's
//                pre-Judge coding);
//   lexical / na  phrasal, be_copula, and the copular n/a cells — never judged.
// A usable response is each judge's latest `judge` event for the cell that is not
// a repeat, not `clear`, not Can't judge (which counts in `cant` only), on the
// current version of its frame (or a pre-versioning `legacy` item, if allowed),
// from a judge who isn't excluded (author, an LLM — register variety "LLM: …" —
// or listed in `exclude`, or failing the gold cells). Excluded judges' gold
// accuracy, retest agreement and agreement with the others' majority are still
// reported.
import { krippendorffAlpha, pairwiseAgreement } from './agreement.mjs';

export const STATUSES = ['adjudicated', 'consensus', 'provisional', 'contested', 'estimated', 'coded', 'lexical', 'na'];
export const RESPONSES = ['acceptable', 'marginal', 'unacceptable', 'cant_judge'];
export const RANK = { unacceptable: 0, marginal: 1, acceptable: 2 };
export const DEFAULT_CONFIG = {
  min_judges: 3, majority: 0.75, current_frames_only: true, use_legacy: true,
  min_gold_accuracy: 0.8, min_gold_seen: 10, author: [], exclude_author: false,
  exclude: [], include_llm: false,
};

/** The feature value a sentence response stands for ("1" / "0" / "5"), or null. */
export function responseValue(fk, resp, inverted) {
  if (resp === 'marginal') return '5';
  if (resp !== 'acceptable' && resp !== 'unacceptable') return null;
  const has = resp === 'acceptable';
  return (inverted.includes(fk) ? !has : has) ? '1' : '0';
}

const round2 = (x) => Math.round(x * 100) / 100;

/**
 * data:      buildData() result (predicates, binaryCols, header, gold)
 * frames:    { item(fk, p) → item id or null, version(item) → number,
 *              unjudged: [...], inverted: [...], inapplicable(verb, fk) → bool }
 * events:    rows of events.csv (strings), oldest first
 * adjudications: rows of data/adjudications.csv
 * config:    data/consolidation.json, over DEFAULT_CONFIG
 * register:  rows of judges.csv (judge, variety, …), optional
 * writeCsv:  (predicates, judgementsMap) → predicates.csv text (src/csv-export.js)
 */
export function consolidate({ data, frames, events, adjudications, config, writeCsv, register }) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  const { predicates, binaryCols } = data;
  const key = (v, f) => v + '|' + f;
  const authors = new Set(cfg.author || []);
  const listed = new Set(cfg.exclude || []);
  const llms = new Set((register || []).filter((j) => /^LLM\b/i.test(j.variety || '')).map((j) => j.judge));

  // ---- latest non-repeat judge event per (judge, cell); repeats kept aside ----
  const latest = new Map(); // judge -> Map(cell -> event)
  const repeats = [];
  const notes = new Map(); // cell -> [{judge, text}]
  const flags = new Map(); // cell -> Set(judge)
  events.forEach((e, i) => {
    e._i = i;
    const cell = key(e.verb, e.feature);
    if (e.kind === 'judge') {
      if (e.repeat === '1') { repeats.push(e); return; }
      if (!latest.has(e.judge)) latest.set(e.judge, new Map());
      latest.get(e.judge).set(cell, e); // events arrive oldest first: later overwrites
    } else if (e.kind === 'note') {
      const list = (notes.get(cell) || []).filter((n) => n.judge !== e.judge);
      if (e.response) list.push({ judge: e.judge, text: e.response });
      notes.set(cell, list);
    } else if (e.kind === 'flag' || e.kind === 'unflag') {
      if (!flags.has(cell)) flags.set(cell, new Set());
      flags.get(cell)[e.kind === 'flag' ? 'add' : 'delete'](e.judge);
    }
  });

  // ---- judges: gold accuracy, retest agreement, exclusion ----
  const judgeInfo = {};
  for (const [j, cells] of latest) {
    let goldSeen = 0, goldRight = 0;
    for (const [cell, e] of cells) {
      const exp = data.gold[cell];
      if (exp === undefined || !RANK.hasOwnProperty(e.response)) continue;
      goldSeen++;
      if (e.response === exp) goldRight++;
    }
    judgeInfo[j] = { judge: j, goldSeen, goldAccuracy: goldSeen ? goldRight / goldSeen : null, retest: 0, retestAgree: 0, excluded: null, used: 0 };
    if (listed.has(j)) judgeInfo[j].excluded = 'listed';
    else if (llms.has(j) && !cfg.include_llm) judgeInfo[j].excluded = 'LLM';
    else if (authors.has(j) && cfg.exclude_author) judgeInfo[j].excluded = 'author';
    else if (goldSeen >= cfg.min_gold_seen && goldRight / goldSeen < cfg.min_gold_accuracy) judgeInfo[j].excluded = 'gold';
  }
  for (const r of repeats) {
    // compare with the judge's latest non-repeat answer given before the repeat
    const before = events.filter((e) => e._i < r._i && e.kind === 'judge' && e.repeat !== '1' && e.judge === r.judge && e.verb === r.verb && e.feature === r.feature);
    const orig = before[before.length - 1];
    if (!orig || orig.response === 'clear' || !judgeInfo[r.judge]) continue;
    judgeInfo[r.judge].retest++;
    if (orig.response === r.response) judgeInfo[r.judge].retestAgree++;
  }

  // ---- usable responses per cell ----
  const usable = new Map(); // cell -> [{judge, response, frame_v, sentence}]
  let droppedFrames = 0, legacyUsed = 0;
  // null if the event counts, else why not ('frame')
  const current = (fk, p, e) => {
    const legacy = Number(e.frame_v) === 0;
    if (legacy) return cfg.use_legacy ? null : 'frame';
    if (!cfg.current_frames_only) return null;
    const item = frames.item(fk, p);
    return e.item !== item || Number(e.frame_v) !== frames.version(item) ? 'frame' : null;
  };
  for (const [j, cells] of latest) {
    if (judgeInfo[j].excluded) continue;
    for (const [cell, e] of cells) {
      if (e.response === 'clear') continue;
      const [verb, fk] = cell.split('|');
      const p = data.byVerb.get(verb);
      if (!p) continue;
      const legacy = Number(e.frame_v) === 0;
      if (current(fk, p, e)) { droppedFrames++; continue; }
      if (!usable.has(cell)) usable.set(cell, []);
      usable.get(cell).push({ judge: j, response: e.response, sentence: e.sentence });
      judgeInfo[j].used++;
    }
  }

  const majority = new Map(); // cell -> the included judges' most common value
  const adj = new Map(adjudications.map((a) => [key(a.verb, a.feature), a]));
  const rows = [], contested = [], decided = {}, changed = [];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const alphaUnits = [];
  const byJudge = {}; // judge -> { cell: value } for pairwise agreement
  const authorVsOthers = { overlap: 0, agree: 0 };

  for (const p of predicates) {
    const estimatedRow = /features estimated/i.test(p.notes || '');
    for (const fk of binaryCols) {
      const cell = key(p.verb, fk);
      const current = String(p[fk]);
      const item = frames.unjudged.includes(fk) || frames.inapplicable(p.verb, fk) ? null : frames.item(fk, p);
      const frameV = item ? frames.version(item) : '';
      let status, value = current, n = 0, agreement = '';
      if (frames.unjudged.includes(fk)) status = 'lexical';
      else if (frames.inapplicable(p.verb, fk)) status = 'na';
      else {
        const rs = usable.get(cell) || [];
        const votes = rs.map((r) => ({ ...r, value: responseValue(fk, r.response, frames.inverted) })).filter((r) => r.value !== null);
        const cant = rs.length - votes.length;
        n = votes.length;
        const tally = {};
        for (const v of votes) tally[v.value] = (tally[v.value] || 0) + 1;
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
        const share = n ? top[1] / n : 0;
        if (n) { agreement = round2(share); majority.set(cell, top[0]); }
        if (n >= 2) alphaUnits.push(votes.map((v) => RANK[v.response]));
        for (const v of votes) (byJudge[v.judge] = byJudge[v.judge] || {})[cell] = v.response;
        const authorVote = votes.find((v) => authors.has(v.judge));
        const others = votes.filter((v) => !authors.has(v.judge));
        if (authorVote && others.length) {
          const t = {};
          for (const v of others) t[v.value] = (t[v.value] || 0) + 1;
          const best = Object.entries(t).sort((a, b) => b[1] - a[1])[0][0];
          authorVsOthers.overlap++;
          if (authorVote.value === best) authorVsOthers.agree++;
        }

        if (adj.has(cell)) { status = 'adjudicated'; value = String(adj.get(cell).value); }
        else if (n === 0) status = estimatedRow ? 'estimated' : 'coded';
        else if (n >= cfg.min_judges && share >= cfg.majority) { status = 'consensus'; value = top[0]; }
        else if (n < cfg.min_judges && share === 1) { status = 'provisional'; value = top[0]; }
        else {
          status = 'contested';
          contested.push({ verb: p.verb, feature: fk, current, tally, cant, n,
            sentences: [...new Set(rs.map((r) => r.sentence).filter(Boolean))],
            responses: rs.map((r) => `${r.judge}: ${r.response}`),
            notes: notes.get(cell) || [], flagged: [...(flags.get(cell) || [])] });
        }
      }
      counts[status]++;
      if (['adjudicated', 'consensus', 'provisional'].includes(status)) decided[cell] = value;
      if (value !== current) changed.push({ verb: p.verb, feature: fk, from: current, to: value, status });
      rows.push({ verb: p.verb, feature: fk, value, status, n, agreement, frame_v: frameV });
    }
  }

  // excluded judges against the included judges' majority (cells both answered)
  for (const [j, cells] of latest) {
    const info = judgeInfo[j];
    if (!info.excluded) continue;
    info.vsMajority = { overlap: 0, agree: 0 };
    for (const [cell, e] of cells) {
      if (!majority.has(cell) || e.response === 'clear') continue;
      const [verb, fk] = cell.split('|');
      const p = data.byVerb.get(verb);
      if (!p || current(fk, p, e)) continue;
      const v = responseValue(fk, e.response, frames.inverted);
      if (v === null) continue;
      info.vsMajority.overlap++;
      if (v === majority.get(cell)) info.vsMajority.agree++;
    }
  }

  // rows with no estimated cell left lose their "features estimated" note: hand
  // csv-export every cell of such a row, which is its rule for dropping it
  const stillEstimated = new Set(rows.filter((r) => r.status === 'estimated').map((r) => r.verb));
  const judgements = { ...decided };
  for (const p of predicates) {
    if (!/features estimated/i.test(p.notes || '') || stillEstimated.has(p.verb)) continue;
    for (const fk of binaryCols) if (judgements[key(p.verb, fk)] === undefined) judgements[key(p.verb, fk)] = String(p[fk]);
  }
  const csv = writeCsv(predicates, judgements);

  const cellsCsv = ['verb,feature,value,status,n,agreement,frame_v',
    ...rows.map((r) => [r.verb, r.feature, r.value, r.status, r.n, r.agreement, r.frame_v].join(','))].join('\n') + '\n';

  return {
    csv, cellsCsv, rows, contested, changed, counts,
    summary: {
      events: events.length, judges: Object.values(judgeInfo), droppedFrames, legacyUsed,
      alpha: krippendorffAlpha(alphaUnits, 'ordinal'), alphaUnits: alphaUnits.length,
      pairs: Object.values(pairwiseAgreement(byJudge)), authorVsOthers,
    },
  };
}

/** judgements/contested.md — one section per contested cell, for adjudication. */
export function renderContested(contested) {
  if (!contested.length) return '# Contested cells\n\nNone.\n';
  const out = ['# Contested cells', '',
    `${contested.length} cell(s) where the judges split. Decide each in data/adjudications.csv`,
    '(verb,feature,value,rationale,date) and run npm run consolidate again.', ''];
  for (const c of contested) {
    out.push(`## ${c.verb} · ${c.feature}`, '');
    for (const s of c.sentences) out.push(`> ${s}`, '');
    out.push(`- Values: ${Object.entries(c.tally).map(([v, k]) => `${v} × ${k}`).join(', ')}` +
      (c.cant ? `; can't judge × ${c.cant}` : '') + ` (current value ${c.current})`);
    out.push(`- Responses: ${c.responses.join('; ')}`);
    if (c.flagged.length) out.push(`- Flagged by ${c.flagged.join(', ')}`);
    for (const n of c.notes) out.push(`- Note (${n.judge}): ${n.text}`);
    out.push('');
  }
  return out.join('\n');
}
