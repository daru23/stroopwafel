// === Dashboard view ===
import React from 'react';
import { avgScore, isDue, srsInterval, fmtDate, relTime, Empty } from './components.jsx';

export function Dashboard({ state, onNav, onOpenModule, onOpenQuiz }) {
  const { modules, generalQuizzes } = state;

  // stats
  const totalQuizzes = modules.reduce((s, m) => s + m.quizzes.length, 0) + generalQuizzes.length;
  const allScores = [
    ...modules.flatMap((m) => m.quizzes),
    ...generalQuizzes,
  ];
  const overallAvg = avgScore(allScores);
  const dueModules = modules.filter(isDue);

  // recent quizzes (per-module + general)
  const recent = [
    ...modules.flatMap((m) => m.quizzes.map((q) => ({ ...q, moduleName: m.name, moduleId: m.id, kind: 'module' }))),
    ...generalQuizzes.map((q) => ({ ...q, moduleName: 'General quiz', kind: 'general' })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Goedemorgen 👋</h1>
          <div className="welcome">
            {dueModules.length === 0
              ? <>Nothing's due right now — <b>nice work staying on top of it.</b></>
              : <>You have <b>{dueModules.length} module{dueModules.length === 1 ? '' : 's'} due for review</b> today.</>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => onOpenQuiz()}>
            ◇ Start a general quiz
          </button>
          <button className="btn btn-primary" onClick={() => onNav('modules')}>
            Go to modules →
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat accent">
          <div className="stat-label">Modules</div>
          <div className="stat-value">{modules.length}</div>
          <div className="stat-trail">{dueModules.length} due today</div>
        </div>
        <div className="stat">
          <div className="stat-label">Quizzes logged</div>
          <div className="stat-value">{totalQuizzes}</div>
          <div className="stat-trail">{generalQuizzes.length} general · {totalQuizzes - generalQuizzes.length} per-module</div>
        </div>
        <div className="stat">
          <div className="stat-label">Overall avg</div>
          <div className="stat-value">{overallAvg == null ? '—' : `${Math.round(overallAvg * 100)}%`}</div>
          <div className="stat-trail">across all attempts</div>
        </div>
        <div className="stat">
          <div className="stat-label">Streak</div>
          <div className="stat-value">{state.streak}<span style={{ fontSize: 14, color: 'var(--ink-faint)', fontWeight: 500 }}> days</span></div>
          <div className="stat-trail">goal: {state.weeklyGoalDays} days / week</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h3>Due for review</h3>
          <div className="card-sub">Suggested by spaced-repetition based on your scores.</div>
          {dueModules.length === 0
            ? <Empty title="All caught up." hint="Come back tomorrow — or open any module to drill ahead of time." />
            : dueModules.slice(0, 5).map((m) => {
                const avg = avgScore(m.quizzes);
                const interval = srsInterval(avg);
                return (
                  <div key={m.id} className="due-row" onClick={() => onOpenModule(m.id)}>
                    <span className="due-pill" />
                    <span className="due-name">{m.name}</span>
                    <span className="due-meta">
                      {avg == null ? 'never quizzed' : `${Math.round(avg * 100)}% avg`}
                      {' · '}
                      every {interval}d
                    </span>
                  </div>
                );
              })}
        </div>

        <div className="card">
          <h3>Recent quizzes</h3>
          <div className="card-sub">Latest attempts across all modules.</div>
          {recent.length === 0
            ? <Empty title="No quizzes logged yet" hint="Open a module and tap “Log a score”." />
            : (
              <div className="history-list" style={{ maxHeight: 'none' }}>
                {recent.map((q) => {
                  const pct = Math.round((q.score / q.total) * 100);
                  return (
                    <div
                      key={`${q.moduleId || 'gen'}-${q.id}`}
                      className="history-row"
                      style={{ cursor: q.moduleId ? 'pointer' : 'default' }}
                      onClick={() => q.moduleId && onOpenModule(q.moduleId)}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{q.moduleName}</div>
                        <div className="date">{fmtDate(q.date)} · {relTime(q.date)}</div>
                      </div>
                      <div className="score">{q.score}/{q.total}</div>
                      <div className="pct">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
