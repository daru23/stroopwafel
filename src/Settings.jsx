// === Settings popover: theme picker + data actions ===
// Production replacement for the prototype's design-tool "Tweaks" panel.
import React from 'react';
import { classnames } from './components.jsx';
import { THEMES } from './themes.js';

export function SettingsMenu({ themeKey, onTheme, onReset, onClear }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="settings" ref={ref}>
      <button
        className={classnames('settings-trigger', open && 'open')}
        title="Settings"
        aria-label="Settings"
        onClick={() => setOpen((o) => !o)}
      >
        ⚙
      </button>
      {open && (
        <div className="settings-pop">
          <div className="settings-sect">Color theme</div>
          <div className="settings-themes">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                className={classnames('theme-opt', key === themeKey && 'on')}
                onClick={() => onTheme(key)}
              >
                <span className="theme-swatches">
                  <i style={{ background: t.vars['--primary'] }} />
                  <i style={{ background: t.vars['--accent'] }} />
                  <i style={{ background: t.vars['--bg'] }} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 12.5 }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)' }}>{t.note}</span>
                </span>
                {key === themeKey && <span style={{ color: 'var(--primary-ink)' }}>✓</span>}
              </button>
            ))}
          </div>
          <div className="settings-sect">Data</div>
          <button className="settings-action" onClick={() => { setOpen(false); onReset(); }}>Reset to demo data</button>
          <button className="settings-action danger" onClick={() => { setOpen(false); onClear(); }}>Clear all data</button>
        </div>
      )}
    </div>
  );
}
