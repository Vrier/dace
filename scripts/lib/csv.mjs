// csv.mjs — tiny RFC 4180 CSV reader/writer (no dependencies).
//
// predicates.csv is written with MINIMAL quoting: a field is quoted only when it
// contains a comma, a double quote or a newline; quotes inside are doubled.
// Lines end in LF and the file ends with a newline. stringifyCSV() reproduces
// that convention exactly, so a parse → stringify round trip is byte-identical.
// (The Judge's export uses the same rule: see src/csv-export.js.)

/** Parse CSV text into an array of rows (arrays of strings). */
export function parseCSVRows(text) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (inQuotes) throw new Error('CSV: unterminated quoted field');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Parse CSV text with a header row into { header, records } (records are objects). */
export function parseCSV(text) {
  const rows = parseCSVRows(text);
  const header = rows.shift() || [];
  const records = rows.map((r, i) => {
    if (r.length !== header.length) {
      throw new Error(`CSV: row ${i + 2} has ${r.length} fields, header has ${header.length}`);
    }
    const o = {};
    header.forEach((h, j) => { o[h] = r[j]; });
    return o;
  });
  return { header, records };
}

/** Quote a field only when needed (comma, quote, newline). */
export function csvField(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Serialise rows (arrays) to CSV with LF line endings and a trailing newline. */
export function stringifyCSVRows(rows) {
  return rows.map((r) => r.map(csvField).join(',')).join('\n') + '\n';
}

/** Serialise { header, records } back to CSV text. */
export function stringifyCSV(header, records) {
  return stringifyCSVRows([header, ...records.map((o) => header.map((h) => o[h]))]);
}

/** Parse a simple TSV (no quoting) with a header row into objects. */
export function parseTSV(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.length);
  const header = lines.shift().split('\t');
  return lines.map((l) => {
    const cells = l.split('\t');
    const o = {};
    header.forEach((h, j) => { o[h] = cells[j]; });
    return o;
  });
}
