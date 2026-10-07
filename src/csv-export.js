// csv-export.js — writes predicates.csv from a dataset plus new cell values. `npm
// test` checks that writing with no new values reproduces data/predicates.csv byte
// for byte; consolidation (PLAN.md "Judgement data", phase 4) will write with it.
// (The Judge's "Merged predicates.csv" export used it until Oct 2026.)
//
// Conventions match the file exactly: columns in the order of the CSV header the
// site was built from (window.DACE_CSV_HEADER), minimal quoting, LF line endings,
// trailing newline. Notes are written back unchanged — except that once every
// feature of an imported row has been judged, its "features estimated" marker is
// dropped (its provenance note, e.g. "added from AHG (2017) appendix", stays).
(function () {
  function field(v) {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // preds: window.DACE_PREDICATES · judgements: { "verb|feature": "0" | "1" | "5" }
  // features: window.DACE_BINARY_COLS · header: window.DACE_CSV_HEADER
  window.daceMergedCSV = function (preds, judgements, features, header) {
    const isFeature = new Set(features);
    const lines = [header.map(field).join(",")];
    for (const p of preds) {
      const judged = (fk) => judgements[p.verb + "|" + fk];
      let notes = p.notes || "";
      if (/features estimated/i.test(notes) && features.every((fk) => judged(fk) !== undefined)) {
        notes = notes.split(/;\s*/).filter((s) => s && !/^features estimated$/i.test(s.trim())).join("; ");
      }
      const value = (col) => {
        if (isFeature.has(col)) return judged(col) !== undefined ? judged(col) : p[col];
        switch (col) {
          case "ahg_rofi": case "ahg_factive": return p.ahg_class ? p[col] : "";
          case "ahg_alt_classes": return p.ahg_alt || "";
          case "notes": return notes;
          default: return p[col];
        }
      };
      lines.push(header.map((col) => field(value(col))).join(","));
    }
    return lines.join("\n") + "\n";
  };
})();
