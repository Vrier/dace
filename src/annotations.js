// annotations.js — shared sidecar store for custom example sentences + derived
// nominals. Lives "alongside but not in" the CSV. Both the Judge and the Explorer
// load this; the Judge writes/exports the sidecar files, the Explorer imports them.
//
// Sidecar file format (one file per data type):
//   { "_dace": "sentences", "version": 1, "data": { "<verb>": "<sentence>" } }
//   { "_dace": "nominals",  "version": 1, "data": { "<verb>": "<nominal>"  } }

(function () {
  const KEYS = { sentences: "dace_custom_sentences_v1", nominals: "dace_custom_nominals_v1" };

  // Baked entries come from data/annotations/*.json (committed Judge exports, built
  // into data.js); entries saved in this browser take precedence. To remove a baked
  // entry for everyone, edit the JSON file and rebuild.
  function load(type) {
    const baked = (window.DACE_BAKED_ANNOTATIONS && window.DACE_BAKED_ANNOTATIONS[type]) || {};
    let local = {};
    try { local = JSON.parse(localStorage.getItem(KEYS[type]) || "{}") || {}; } catch (e) { local = {}; }
    return Object.assign({}, baked, local);
  }
  function persist(type, map) {
    try { localStorage.setItem(KEYS[type], JSON.stringify(map)); } catch (e) { /* storage unavailable or full */ }
  }

  window.DACE_CUSTOM_SENTENCES = load("sentences");
  window.DACE_CUSTOM_NOMINALS = load("nominals");

  function mapFor(type) {
    return type === "sentences" ? window.DACE_CUSTOM_SENTENCES : window.DACE_CUSTOM_NOMINALS;
  }

  // set one entry (empty/blank value deletes it), persist to localStorage
  window.daceSetAnno = function (type, verb, value) {
    const map = mapFor(type);
    if (value && value.trim()) map[verb] = value.trim();
    else delete map[verb];
    persist(type, map);
  };

  window.daceExportAnno = function (type) {
    const payload = { _dace: type, version: 1, exported: new Date().toISOString(), data: mapFor(type) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dace_" + type + ".json"; a.click();
    URL.revokeObjectURL(url);
  };

  // import a sidecar file's text; merges into the matching map. Returns {ok,type,count,msg}
  window.daceImportAnno = function (text) {
    let obj;
    try { obj = JSON.parse(text); } catch { return { ok: false, msg: "Not valid JSON." }; }
    const type = obj && obj._dace;
    if (type !== "sentences" && type !== "nominals") return { ok: false, msg: "Unrecognised file — expected a DACE sentences or nominals sidecar." };
    const data = (obj && obj.data) || {};
    const map = mapFor(type);
    Object.assign(map, data);
    persist(type, map);
    return { ok: true, type, count: Object.keys(data).length };
  };

  window.daceAnnoCount = function (type) { return Object.keys(mapFor(type)).length; };
})();
