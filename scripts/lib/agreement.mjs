// agreement.mjs — inter-judge agreement for consolidation (PLAN.md "Judgement data").
//
// krippendorffAlpha(units, level): units is an array of units (cells), each an
// array of the values the judges gave it (missing values simply left out). Values
// are numbers; for "ordinal" they are ranks (DACE: 0 unacceptable < 1 marginal <
// 2 acceptable). Units with fewer than two values are not pairable and drop out.
// Checked against Krippendorff (2011), "Computing Krippendorff's alpha-reliability",
// and the `krippendorff` Python package (npm test).
export function krippendorffAlpha(units, level = 'nominal') {
  const pairable = units.filter((u) => u.length >= 2);
  const cats = [...new Set(pairable.flat())].sort((a, b) => a - b);
  if (cats.length === 0) return null;
  const ix = new Map(cats.map((c, i) => [c, i]));
  const K = cats.length;
  // coincidence matrix o[c][k]
  const o = Array.from({ length: K }, () => new Array(K).fill(0));
  for (const u of pairable) {
    const m = u.length;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) o[ix.get(u[i])][ix.get(u[j])] += 1 / (m - 1);
  }
  const nc = o.map((row) => row.reduce((s, x) => s + x, 0));
  const n = nc.reduce((s, x) => s + x, 0);
  if (n <= 1) return null;
  const d2 = (c, k) => {
    if (level === 'nominal') return c === k ? 0 : 1;
    if (level === 'interval') return (cats[c] - cats[k]) ** 2;
    if (level === 'ordinal') {
      const [a, b] = c <= k ? [c, k] : [k, c];
      let s = 0;
      for (let g = a; g <= b; g++) s += nc[g];
      return (s - (nc[a] + nc[b]) / 2) ** 2;
    }
    throw new Error('unknown level ' + level);
  };
  let Do = 0, De = 0;
  for (let c = 0; c < K; c++) for (let k = 0; k < K; k++) {
    const d = d2(c, k);
    Do += o[c][k] * d;
    De += nc[c] * nc[k] * d;
  }
  Do /= n;
  De /= n * (n - 1);
  if (De === 0) return 1; // every judge gave every unit the same single value
  return 1 - Do / De;
}

// share of units on which a pair of judges agrees: { "A||B": { a, b, overlap, agree } }
export function pairwiseAgreement(unitsByJudge) {
  const out = {};
  const judges = Object.keys(unitsByJudge).sort();
  for (let i = 0; i < judges.length; i++) for (let k = i + 1; k < judges.length; k++) {
    const A = unitsByJudge[judges[i]], B = unitsByJudge[judges[k]];
    let overlap = 0, agree = 0;
    for (const key of Object.keys(A)) if (key in B) { overlap++; if (A[key] === B[key]) agree++; }
    if (overlap) out[judges[i] + '||' + judges[k]] = { a: judges[i], b: judges[k], overlap, agree };
  }
  return out;
}
