// === Sidebar nav + streak card ===
import React from 'react';
import { TAG_KINDS, classnames } from './components.jsx';

export function Sidebar({ view, onNav, counts, streak, weekDots }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">N</div>
        <div>
          <div className="brand-name">Nederlands</div>
          <div className="brand-sub">A2 · study tracker</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section-label">Study</div>
        <button className={classnames('nav-item', view === 'dashboard' && 'active')} onClick={() => onNav('dashboard')}>
          <span style={{ width: 16, display: 'inline-block' }}>◐</span> Overview
        </button>
        <button className={classnames('nav-item', view === 'modules' && 'active')} onClick={() => onNav('modules')}>
          <span style={{ width: 16, display: 'inline-block' }}>≡</span> Modules
          <span className="nav-count">{counts.modules}</span>
        </button>
        <button className={classnames('nav-item', view === 'quiz' && 'active')} onClick={() => onNav('quiz')}>
          <span style={{ width: 16, display: 'inline-block' }}>◇</span> Quiz
        </button>
        <button className={classnames('nav-item', view === 'flashcards' && 'active')} onClick={() => onNav('flashcards')}>
          <span style={{ width: 16, display: 'inline-block' }}>♠</span> Flashcards
        </button>

        <div className="nav-section-label">Filter by tag</div>
        {TAG_KINDS.map((t) => (
          <button
            key={t}
            className={classnames('nav-item', view === `tag:${t}` && 'active')}
            onClick={() => onNav(`tag:${t}`)}
          >
            <span style={{ width: 16, display: 'inline-block' }}>
              <span className="tag-dot" style={{ display: 'inline-block', width: 7, height: 7, background: `var(--tag-${t}-ink)` }} />
            </span>
            <span style={{ textTransform: 'capitalize' }}>{t}</span>
            <span className="nav-count">{counts.tags[t] || 0}</span>
          </button>
        ))}
      </nav>

      <div className="streak-card">
        <div className="streak-row">
          <span className="streak-flame">🔥</span>
          <span className="streak-num">{streak}</span>
          <span className="streak-unit">day streak</span>
        </div>
        <div className="streak-label">This week</div>
        <div className="streak-dots">
          {weekDots.map((on, i) => (
            <div key={i} className={classnames('streak-dot', on && 'on')} title={['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]} />
          ))}
        </div>
      </div>
    </aside>
  );
}
