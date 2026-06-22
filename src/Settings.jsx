// === Settings popover: theme picker + data actions (export / import) ===
import React from 'react';
import { classnames, Modal } from './components.jsx';
import { THEMES } from './themes.js';
import { validateImport, planMerge } from './shared/merge.js';

export function SettingsMenu({ themeKey, onTheme, onReset, onClear, onExport, currentState, onApplyImport, open: openProp, onOpenChange }) {
  const [openInternal, setOpenInternal] = React.useState(false);
  // Controlled when `open`/`onOpenChange` are provided (e.g. the mobile Settings tab),
  // otherwise self-managed via the floating gear.
  const open = openProp !== undefined ? openProp : openInternal;
  const setOpen = onOpenChange || setOpenInternal;
  const [importPreview, setImportPreview] = React.useState(null); // { summary, merged }
  const [importError, setImportError] = React.useState('');
  const fileRef = React.useRef(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      // Ignore the external togglers (gear, mobile Settings tab) so their own
      // click handler does the toggle instead of close-then-reopen.
      if (e.target.closest && e.target.closest('[data-settings-toggle]')) return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let imp;
      try {
        imp = JSON.parse(ev.target.result);
      } catch {
        setImportError('Could not parse file — make sure it is valid JSON.');
        return;
      }
      const check = validateImport(imp);
      if (!check.ok) {
        setImportError(check.error);
        return;
      }
      const { state: merged, summary } = planMerge(currentState, imp);
      setImportPreview({ summary, merged });
      setOpen(false);
    };
    reader.readAsText(file);
  }

  function applyImport() {
    if (!importPreview) return;
    onApplyImport(importPreview.merged);
    setImportPreview(null);
  }

  return (
    <>
      {open && <div className="settings-backdrop" onClick={() => setOpen(false)} />}
      <div className="settings" ref={ref}>
        <button
          className={classnames('settings-trigger', open && 'open')}
          title="Settings"
          aria-label="Settings"
          data-settings-toggle
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
            <div className="settings-sect">Import / Export</div>
            <button className="settings-action" onClick={() => { setOpen(false); onExport(); }}>
              Export JSON
            </button>
            <button className="settings-action" onClick={() => { setImportError(''); fileRef.current?.click(); }}>
              Import JSON
            </button>
            {importError && <p className="settings-import-error">{importError}</p>}
            <div className="settings-sect">Data</div>
            <button className="settings-action" onClick={() => { setOpen(false); onReset(); }}>Reset to demo data</button>
            <button className="settings-action danger" onClick={() => { setOpen(false); onClear(); }}>Clear all data</button>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {importPreview && (
        <ImportPreviewModal
          summary={importPreview.summary}
          onApply={applyImport}
          onCancel={() => setImportPreview(null)}
        />
      )}
    </>
  );
}

function ImportPreviewModal({ summary, onApply, onCancel }) {
  const lines = [
    summary.newModules > 0 && `${summary.newModules} new module${summary.newModules === 1 ? '' : 's'}`,
    summary.mergedModules > 0 && `${summary.mergedModules} merged module${summary.mergedModules === 1 ? '' : 's'}`,
    summary.vocabAdded > 0 && `+${summary.vocabAdded} vocab word${summary.vocabAdded === 1 ? '' : 's'}`,
    summary.quizzesAdded > 0 && `+${summary.quizzesAdded} quiz result${summary.quizzesAdded === 1 ? '' : 's'}`,
    summary.generalQuizzesAdded > 0 && `+${summary.generalQuizzesAdded} general quiz${summary.generalQuizzesAdded === 1 ? '' : 'zes'}`,
  ].filter(Boolean);

  const isEmpty = lines.length === 0;

  return (
    <Modal
      title="Import preview"
      sub="Review what will be added before applying."
      onClose={onCancel}
    >
      <div className="import-preview">
        {isEmpty
          ? <p className="import-preview-empty">Nothing new to import — all modules and vocab already exist.</p>
          : (
            <ul className="import-preview-list">
              {lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
          )}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onApply} disabled={isEmpty}>
          Apply import
        </button>
      </div>
    </Modal>
  );
}
