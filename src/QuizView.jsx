// === General quizzes view: pick modules / random, log a score ===
import React from 'react';
import { classnames, fmtDate, relTime, Tag, Empty } from './components.jsx';
import { LogScoreModal } from './ModuleDetail.jsx';

export function QuizView({ state, onLogQuiz, onDeleteQuiz, onOpenModule }) {
  const { modules, generalQuizzes } = state;
  const [picked, setPicked] = React.useState(() => new Set());
  const [mode, setMode] = React.useState('pick'); // 'pick' | 'random'
  const [randomCount, setRandomCount] = React.useState(3);
  const [logOpen, setLogOpen] = React.useState(false);

  const togglePick = (id) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  };

  const pickRandom = () => {
    const shuffled = [...modules].sort(() => Math.random() - 0.5);
    const next = new Set(shuffled.slice(0, Math.min(randomCount, modules.length)).map((m) => m.id));
    setPicked(next);
    setMode('pick'); // show what got picked
  };

  const pickedModules = modules.filter((m) => picked.has(m.id));
  const allTags = [...new Set(pickedModules.flatMap((m) => m.tags))];

  const start = () => {
    if (picked.size === 0) return;
    setLogOpen(true);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>General quizzes</h1>
          <div className="welcome">
            Mix multiple modules into one drill, or let me pick at random for you.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3>Build a quiz</h3>
        <div className="card-sub">Pick modules to include, then log the result after you've drilled.</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className={classnames('btn btn-sm', mode === 'pick' ? 'btn-primary' : 'btn-secondary')} onClick={() => setMode('pick')}>
            Pick modules
          </button>
          <button className={classnames('btn btn-sm', mode === 'random' ? 'btn-primary' : 'btn-secondary')} onClick={() => setMode('random')}>
            Pick at random
          </button>
        </div>

        {mode === 'pick' ? (
          <div className="quiz-builder">
            <div>
              <div className="label">Modules ({picked.size} selected)</div>
              <div className="module-pick-list">
                {modules.length === 0
                  ? <Empty title="No modules yet" hint="Add some on the Modules page." />
                  : modules.map((m) => (
                      <div key={m.id} className={classnames('module-pick', picked.has(m.id) && 'on')} onClick={() => togglePick(m.id)}>
                        <span className="check">{picked.has(m.id) ? '✓' : ''}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                            {m.quizzes.length} prior · {m.tags.join(', ') || 'no tags'}
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
              {modules.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPicked(new Set(modules.map((m) => m.id)))}>Select all</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPicked(new Set())}>Clear</button>
                </div>
              )}
            </div>

            <div>
              <div className="label">Quiz summary</div>
              <div style={{
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {picked.size === 0
                  ? <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>Select modules on the left to build a quiz.</div>
                  : (
                    <>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>Topics</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {pickedModules.map((m) => (
                            <li key={m.id} style={{ fontSize: 13.5, fontWeight: 500 }}>· {m.name}</li>
                          ))}
                        </ul>
                      </div>
                      {allTags.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>Tags covered</div>
                          <div className="module-tags">
                            {allTags.map((t) => <Tag key={t} kind={t} />)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                <div style={{ marginTop: 'auto' }}>
                  <button className="btn btn-primary" disabled={picked.size === 0} onClick={start} style={{ width: '100%', justifyContent: 'center' }}>
                    Log result for these {picked.size} module{picked.size === 1 ? '' : 's'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label className="label">How many modules?</label>
              <input
                className="field"
                type="number"
                min="1"
                max={Math.max(modules.length, 1)}
                value={randomCount}
                onChange={(e) => setRandomCount(Math.max(1, Math.min(modules.length, Number(e.target.value) || 1)))}
                style={{ width: 100 }}
              />
            </div>
            <button className="btn btn-primary" onClick={pickRandom} disabled={modules.length === 0}>
              🎲 Pick {Math.min(randomCount, modules.length)} at random
            </button>
            {modules.length === 0 && (
              <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Add modules first.</span>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>History</h3>
        <div className="card-sub">All general quizzes you've logged, newest first.</div>
        {generalQuizzes.length === 0
          ? <Empty title="No general quizzes yet" hint="Build one above and log your score." />
          : (
            <div className="history-list" style={{ maxHeight: 'none' }}>
              {[...generalQuizzes].reverse().map((q) => {
                const pct = Math.round((q.score / q.total) * 100);
                const modulesUsed = q.moduleIds.map((id) => modules.find((m) => m.id === id)).filter(Boolean);
                return (
                  <div key={q.id} className="history-row" style={{ gridTemplateColumns: '1fr auto auto auto', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                        {modulesUsed.map((m) => (
                          <button key={m.id} className="tag" onClick={() => onOpenModule(m.id)} style={{ cursor: 'pointer' }}>
                            {m.name}
                          </button>
                        ))}
                      </div>
                      <div className="date">{fmtDate(q.date)} · {relTime(q.date)}{q.note ? ` · "${q.note}"` : ''}</div>
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

      {logOpen && (
        <LogScoreModal
          onClose={() => setLogOpen(false)}
          onLog={(payload) => {
            onLogQuiz({ ...payload, moduleIds: [...picked] });
            setLogOpen(false);
            setPicked(new Set());
          }}
        />
      )}
    </div>
  );
}
