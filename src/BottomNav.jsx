// === Mobile bottom tab bar (shown only at <=768px via CSS) ===
import React from 'react';
import { classnames } from './components.jsx';

export function BottomNav({ view, onNav, settingsOpen, onToggleSettings }) {
  const isModules = view === 'modules' || view.startsWith('tag:') || view.startsWith('module:');

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <button
        className={classnames('bn-item', view === 'dashboard' && !settingsOpen && 'active')}
        onClick={() => onNav('dashboard')}
      >
        <span className="bn-icon">◐</span>
        <span className="bn-label">Overview</span>
      </button>
      <button
        className={classnames('bn-item', isModules && !settingsOpen && 'active')}
        onClick={() => onNav('modules')}
      >
        <span className="bn-icon">≡</span>
        <span className="bn-label">Modules</span>
      </button>
      <button
        className={classnames('bn-item', view === 'quiz' && !settingsOpen && 'active')}
        onClick={() => onNav('quiz')}
      >
        <span className="bn-icon">◇</span>
        <span className="bn-label">Quizzes</span>
      </button>
      <button
        className={classnames('bn-item', view === 'flashcards' && !settingsOpen && 'active')}
        onClick={() => onNav('flashcards')}
      >
        <span className="bn-icon">♠</span>
        <span className="bn-label">Cards</span>
      </button>
      <button
        className={classnames('bn-item', settingsOpen && 'active')}
        data-settings-toggle
        onClick={() => onToggleSettings()}
      >
        <span className="bn-icon">⚙</span>
        <span className="bn-label">Settings</span>
      </button>
    </nav>
  );
}
