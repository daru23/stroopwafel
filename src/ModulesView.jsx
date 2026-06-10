// === Modules list view + Add/Edit module modal ===
import React from 'react';
import { classnames, avgScore, isDue, relTime, Tag, ScoreBar, Modal, TagPicker, Empty } from './components.jsx';

export function ModulesView({ modules, filterTag, search, onSearch, onOpen, onAdd }) {
  const filtered = modules
    .filter((m) => !filterTag || m.tags.includes(filterTag))
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Modules</h1>
          <div className="welcome">
            {filterTag
              ? <>Filtered by <b style={{ textTransform: 'capitalize' }}>{filterTag}</b> · {filtered.length} module{filtered.length === 1 ? '' : 's'}</>
              : <>One module per grammar topic. <b>Add a new one</b> whenever you start a new chapter.</>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onAdd}>+ New module</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search modules…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0
        ? <Empty title="No modules yet" hint="Add your first grammar topic to start tracking." action={
            <button className="btn btn-primary" onClick={onAdd}>+ New module</button>
          } />
        : (
          <div className="module-grid">
            {filtered.map((m) => <ModuleCard key={m.id} module={m} onOpen={() => onOpen(m.id)} />)}
          </div>
        )}
    </div>
  );
}

function ModuleCard({ module, onOpen }) {
  const avg = avgScore(module.quizzes);
  const due = isDue(module);
  return (
    <button className={classnames('module-card', due && 'due')} onClick={onOpen}>
      <div>
        <div className="module-name">{module.name}</div>
        <div className="module-meta">
          <span>{module.quizzes.length} quiz{module.quizzes.length === 1 ? '' : 'zes'}</span>
          {(module.vocab || []).length > 0 && (
            <>
              <span>·</span>
              <span>{module.vocab.length} word{module.vocab.length === 1 ? '' : 's'}</span>
            </>
          )}
          <span>·</span>
          <span>Last: {relTime(module.lastReviewed)}</span>
        </div>
      </div>
      {module.tags.length > 0 && (
        <div className="module-tags">
          {module.tags.map((t) => <Tag key={t} kind={t} />)}
        </div>
      )}
      <ScoreBar value={avg} />
      <div className="module-foot">
        <span>{avg == null ? 'No score yet' : 'Average score'}</span>
        <span className="avg-score">{avg == null ? '—' : `${Math.round(avg * 100)}%`}</span>
      </div>
      {due && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent-ink)',
          background: 'var(--accent-soft)',
          padding: '2px 7px', borderRadius: 999,
          border: '1px solid var(--accent-border)',
        }}>Due</div>
      )}
    </button>
  );
}

// --- Add / Edit module modal ---
export function ModuleEditor({ initial, onSave, onClose }) {
  const [name, setName] = React.useState(initial?.name || '');
  const [tags, setTags] = React.useState(initial?.tags || ['grammar']);
  const [notes, setNotes] = React.useState(initial?.notes || '');

  const submit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), tags, notes });
  };

  return (
    <Modal
      title={initial ? 'Edit module' : 'New module'}
      sub={initial ? 'Update the name, tags, or notes.' : 'A module is a Dutch grammar topic — perfectum, modale werkwoorden, etc.'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Topic name</label>
          <input
            className="field"
            placeholder="e.g. Perfectum, Imperfectum, Er/Hier/Daar…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Tags</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="notes-area"
            placeholder="Rules, examples, things you tend to forget…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: 110 }}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {initial ? 'Save changes' : 'Create module'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
