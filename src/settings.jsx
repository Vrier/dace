// settings.jsx — reader-facing display settings for the Explorer.
//
// Replaces tweaks-panel.jsx from the Claude Design handoff. That panel was the
// design tool's editing harness: it only opened when the design host posted a
// message, so on the live site its controls were unreachable. Here the look is
// fixed to the "Reading Room" direction and readers get a small Settings menu:
// theme (follows the system by default), row density, and loading annotation
// files exported from the Judge. Choices are remembered in this browser.
//
// Exposes (on window): useTweaks(defaults) → [values, setTweak], SettingsMenu.

const DACE_DISPLAY_KEY = "dace_display_v1";

function readDisplayPrefs() {
  try { return JSON.parse(localStorage.getItem(DACE_DISPLAY_KEY) || "{}") || {}; }
  catch (e) { return {}; }
}
function writeDisplayPrefs(prefs) {
  try { localStorage.setItem(DACE_DISPLAY_KEY, JSON.stringify(prefs)); } catch (e) { /* storage unavailable: keep in memory */ }
}

// Same contract as the handoff's useTweaks: returns [values, setTweak(key, value)].
// values.dark is derived from the theme preference ("auto" follows the system).
function useTweaks(defaults) {
  const [prefs, setPrefs] = React.useState(() => {
    const saved = readDisplayPrefs();
    return {
      theme: ["auto", "light", "dark"].includes(saved.theme) ? saved.theme : "auto",
      density: ["cozy", "compact"].includes(saved.density) ? saved.density : defaults.density,
    };
  });
  const mq = React.useMemo(() => (window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null), []);
  const [systemDark, setSystemDark] = React.useState(() => !!(mq && mq.matches));
  React.useEffect(() => {
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", onChange); else mq.removeListener(onChange); };
  }, [mq]);
  const setTweak = React.useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      writeDisplayPrefs(next);
      return next;
    });
  }, []);
  const dark = prefs.theme === "dark" || (prefs.theme === "auto" && systemDark);
  return [{ ...defaults, theme: prefs.theme, density: prefs.density, dark }, setTweak];
}

function SettingsSeg({ label, value, options, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-label" id={"settings-" + label}>{label}</span>
      <div className="seg" role="radiogroup" aria-labelledby={"settings-" + label}>
        {options.map((o) => (
          <button key={o.k} type="button" role="radio" aria-checked={value === o.k}
            className={"seg-btn" + (value === o.k ? " on" : "")} onClick={() => onChange(o.k)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function SettingsMenu({ t, setTweak, onLoadAnnotations }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); if (btnRef.current) btnRef.current.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="settings" ref={wrapRef}>
      <button ref={btnRef} type="button" className={"filter-btn" + (open ? " on" : "")}
        aria-expanded={open} aria-controls="dace-settings" onClick={() => setOpen((o) => !o)}>Settings</button>
      {open && (
        <div className="settings-pop" id="dace-settings" role="group" aria-label="Settings">
          <SettingsSeg label="Theme" value={t.theme} onChange={(v) => setTweak("theme", v)}
            options={[{ k: "auto", label: "Auto" }, { k: "light", label: "Light" }, { k: "dark", label: "Dark" }]} />
          <SettingsSeg label="Rows" value={t.density} onChange={(v) => setTweak("density", v)}
            options={[{ k: "cozy", label: "Comfortable" }, { k: "compact", label: "Compact" }]} />
          <div className="settings-sep" />
          <div className="settings-anno">
            <button type="button" className="anno-import-btn" onClick={() => { setOpen(false); onLoadAnnotations(); }}>Load annotations…</button>
            <p className="settings-note">Adds example sentences or derived nominals exported from the Judge. They are kept in this browser only.</p>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { useTweaks, SettingsMenu });
