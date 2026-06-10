// === Single module detail view: notes, quiz history, SRS hint ===
import React from 'react';
import { avgScore, isDue, srsInterval, daysSince, fmtDate, relTime, Tag, Modal, Empty } from './components.jsx';

export function ModuleDetail({ module, onBack, onUpdate, onAddQuiz, onDeleteQuiz, onEdit, onDelete }) {
  const avg = avgScore(module.quizzes);
  const due = isDue(module);
  const interval = srsInterval(avg);
  const days = daysSince(module.lastReviewed);
  const daysUntilDue = Math.max(0, interval - days);

  const [logOpen, setLogOpen] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [notes, setNotes] = React.useState(module.notes);

  // sync notes when module changes
  React.useEffect(() => { setNotes(module.notes); }, [module.id]);

  const saveNotes = () => {
    if (notes !== module.notes) onUpdate({ notes });
  };

  return (
    <div>
      <div className="page-head">
        <div style={{ flex: 1 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 8, marginLeft: -8 }}>
            ← All modules
          </button>
          <h1>{module.name}</h1>
          <div className="module-tags" style={{ marginTop: 8 }}>
            {module.tags.map((t) => <Tag key={t} kind={t} />)}
            {module.tags.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>no tags</span>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={onEdit}>Edit module</button>
          <button className="btn btn-primary" onClick={() => setLogOpen(true)}>+ Log a score</button>
        </div>
      </div>

      <div className="srs-banner">
        <span style={{ fontSize: 18 }}>{due ? '🌱' : '✓'}</span>
        <span>
          {due
            ? <>This module is <b>due for review</b>. Your {avg == null ? '—' : `${Math.round(avg * 100)}%`} average puts you on a <b>{interval}-day</b> cycle, and it's been {days === Infinity ? 'never reviewed' : `${days}d`}.</>
            : <>Next review in <b>{daysUntilDue} day{daysUntilDue === 1 ? '' : 's'}</b>. Cycle: every <b>{interval}d</b> at your current average ({avg == null ? '—' : `${Math.round(avg * 100)}%`}).</>
          }
        </span>
        <span className="srs-action">
          <button className="btn btn-sm btn-secondary" onClick={() => onUpdate({ lastReviewed: new Date().toISOString() })}>
            Mark reviewed
          </button>
        </span>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Quiz history</h3>
          <div className="card-sub">
            {module.quizzes.length === 0
              ? 'Nothing logged yet.'
              : `${module.quizzes.length} attempts · ${Math.round(avg * 100)}% average`}
          </div>

          {module.quizzes.length === 0
            ? <Empty title="No quizzes yet" hint="Tap “Log a score” after a self-test, textbook check, or class quiz." />
            : (
              <div className="history-list">
                {[...module.quizzes].reverse().map((q) => {
                  const pct = Math.round((q.score / q.total) * 100);
                  return (
                    <div key={q.id} className="history-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{q.note || <span style={{ color: 'var(--ink-faint)' }}>No note</span>}</div>
                        <div className="date">{fmtDate(q.date)} · {relTime(q.date)}</div>
                      </div>
                      <div className="score">{q.score}/{q.total}</div>
                      <div className="pct">{pct}%</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDeleteQuiz(q.id)} title="Delete">×</button>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="card">
          <h3>Notes & journal</h3>
          <div className="card-sub">Examples, tricky cases, things you tend to forget. Saves on blur.</div>
          <textarea
            className="notes-area"
            placeholder={'• Rule: …\n• Example: …\n• I keep forgetting: …'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
          />
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}>
              Delete this module
            </button>
          </div>
        </div>
      </div>

      {logOpen && (
        <LogScoreModal
          onClose={() => setLogOpen(false)}
          onLog={(payload) => { onAddQuiz(payload); setLogOpen(false); }}
        />
      )}

      {confirmDel && (
        <Modal title="Delete this module?" sub="This deletes the module and all its quiz history. Cannot be undone." onClose={() => setConfirmDel(false)}>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={onDelete}>
              Delete module
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Log score modal ---
export function LogScoreModal({ onClose, onLog, defaults }) {
  const [score, setScore] = React.useState(defaults?.score ?? 8);
  const [total, setTotal] = React.useState(defaults?.total ?? 10);
  const [note, setNote]   = React.useState('');

  const submit = (e) => {
    e?.preventDefault();
    const s = Number(score), t = Number(total);
    if (!t || t <= 0 || s < 0 || s > t) return;
    onLog({ score: s, total: t, note: note.trim(), date: new Date().toISOString() });
  };

  const valid = total > 0 && score >= 0 && score <= total;

  return (
    <Modal title="Log a quiz score" sub="Enter your raw score — e.g. 8 correct out of 10." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-row">
          <div>
            <label className="label">Score</label>
            <input className="field" type="number" min="0" value={score} onChange={(e) => setScore(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 0, paddingTop: 24, color: 'var(--ink-faint)' }}>/</div>
          <div>
            <label className="label">Total</label>
            <input className="field" type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="field" placeholder="What tripped you up? What clicked?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!valid}>
            Log score
          </button>
        </div>
      </form>
    </Modal>
  );
}
