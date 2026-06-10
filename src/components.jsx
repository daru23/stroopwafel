// === Shared UI primitives + helpers ===
import React from 'react';

export const TAG_KINDS = ['grammar', 'vocab', 'listening', 'speaking'];

export function classnames(...xs) {
  return xs.filter(Boolean).join(' ');
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function relTime(iso) {
  if (!iso) return 'never';
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function daysSince(iso) {
  if (!iso) return Infinity;
  return Math.floor((new Date() - new Date(iso)) / 86400000);
}

export function avgScore(quizzes) {
  if (!quizzes || !quizzes.length) return null;
  const totalScore = quizzes.reduce((s, q) => s + q.score, 0);
  const totalMax   = quizzes.reduce((s, q) => s + q.total, 0);
  return totalMax === 0 ? null : totalScore / totalMax;
}

// Spaced-repetition interval (very simple):
//   avg ≥ 0.9 → 14d, ≥ 0.75 → 7d, ≥ 0.6 → 3d, else 1d; no quizzes → 1d
export function srsInterval(avg) {
  if (avg == null) return 1;
  if (avg >= 0.9) return 14;
  if (avg >= 0.75) return 7;
  if (avg >= 0.6) return 3;
  return 1;
}

export function isDue(module) {
  const avg = avgScore(module.quizzes);
  const interval = srsInterval(avg);
  return daysSince(module.lastReviewed) >= interval;
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Tag ---
export function Tag({ kind, children }) {
  return <span className={classnames('tag', kind && `tag-${kind}`)}>{children || kind}</span>;
}

// --- Score bar ---
export function ScoreBar({ value }) {
  if (value == null) {
    return (
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: '0%' }} />
      </div>
    );
  }
  const pct = Math.round(value * 100);
  const cls = value >= 0.8 ? 'high' : value >= 0.6 ? 'mid' : 'low';
  return (
    <div className="score-bar" title={`${pct}%`}>
      <div className={classnames('score-bar-fill', cls)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// --- Modal ---
export function Modal({ title, sub, onClose, children, width }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
        {children}
      </div>
    </div>
  );
}

// --- Tag picker ---
export function TagPicker({ value, onChange }) {
  const toggle = (t) => {
    if (value.includes(t)) onChange(value.filter((x) => x !== t));
    else onChange([...value, t]);
  };
  return (
    <div className="tag-picker">
      {TAG_KINDS.map((t) => (
        <button
          key={t}
          type="button"
          className={classnames('tag-pick', value.includes(t) && 'on')}
          onClick={() => toggle(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// --- Empty state ---
export function Empty({ title, hint, action }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
