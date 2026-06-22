// === Interactive typed quiz: type the English for each Dutch word ===
import React from 'react';
import { THEMES, ALL_CARDS, getThemeById } from './flashcards/themes.js';
import { Empty, classnames } from './components.jsx';

const SUBSET_PRESETS = [10, 20, 50];

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- Forgiving answer checking ---
// Drops parentheticals, articles and the infinitive "to", then compares against
// each accepted variant (en strings often hold several senses split by / , ; or "or").
function normalizeAns(s) {
  return String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[.,!?;:"'’]/g, ' ')
    .replace(/\b(the|a|an|to)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function acceptedAnswers(en) {
  return en
    .split(/[/;,]| or /i)
    .map(normalizeAns)
    .filter(Boolean);
}
export function checkAnswer(typed, en) {
  const t = normalizeAns(typed);
  if (!t) return false;
  return acceptedAnswers(en).includes(t);
}

export function Quiz({ stats, onResult, onResetStats }) {
  const [phase, setPhase] = React.useState('setup'); // 'setup' | 'session' | 'summary'
  const [mode, setMode] = React.useState('chapter'); // 'chapter' | 'all'
  const [themeId, setThemeId] = React.useState(THEMES[0]?.id || null);
  const [subset, setSubset] = React.useState(10); // number | 'all' | 'custom'
  const [customSize, setCustomSize] = React.useState(20);
  const [deck, setDeck] = React.useState([]);
  const [results, setResults] = React.useState([]); // { card, correct, typed }

  const sourceCards = React.useMemo(() => {
    if (mode === 'all') return ALL_CARDS;
    const t = getThemeById(themeId);
    return t ? t.cards.map((c) => ({ ...c, themeId: t.id, themeName: t.name })) : [];
  }, [mode, themeId]);

  // Keep all hooks above the early returns (Rules of Hooks).
  const totalStats = React.useMemo(() => {
    let seen = 0, correct = 0;
    for (const s of Object.values(stats)) { seen += s.seen; correct += s.correct; }
    return { seen, correct, pct: seen ? Math.round((correct / seen) * 100) : null };
  }, [stats]);

  const totalCards = sourceCards.length;
  const requestedSize = (() => {
    if (subset === 'all') return totalCards;
    if (subset === 'custom') return Math.max(1, Math.min(totalCards, Number(customSize) || 1));
    return Math.min(subset, totalCards);
  })();

  function startSession() {
    setDeck(shuffle(sourceCards).slice(0, requestedSize));
    setResults([]);
    setPhase('session');
  }

  function recordResult(card, correct, typed) {
    onResult(card.id, correct);
    setResults((r) => [...r, { card, correct, typed }]);
  }

  function backToSetup() {
    setPhase('setup');
    setDeck([]);
    setResults([]);
  }

  if (phase === 'session') {
    return (
      <QuizSession
        deck={deck}
        onResult={recordResult}
        onFinish={() => setPhase('summary')}
        onAbort={backToSetup}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <QuizSummary
        results={results}
        onAgain={() => { setResults([]); setPhase('session'); }}
        onNew={backToSetup}
      />
    );
  }

  // --- Setup ---
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Quiz</h1>
          <div className="welcome">
            Type the English for each Dutch word. Pick a theme or mix everything.
          </div>
        </div>
        <div className="page-actions">
          {totalStats.seen > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onResetStats}>Reset stats</button>
          )}
        </div>
      </div>

      {totalStats.seen > 0 && (
        <div className="fc-stats-strip">
          <span><b>{totalStats.seen}</b> answered</span>
          <span>·</span>
          <span><b>{totalStats.correct}</b> correct</span>
          <span>·</span>
          <span><b>{totalStats.pct}%</b> overall</span>
        </div>
      )}

      <div className="fc-setup">
        <section className="card fc-setup-card">
          <h3>Mode</h3>
          <div className="card-sub">Quiz one theme, or mix all themes.</div>
          <div className="fc-mode-row">
            <button className={`fc-mode ${mode === 'chapter' ? 'on' : ''}`} onClick={() => setMode('chapter')}>
              <div className="fc-mode-title">By theme</div>
              <div className="fc-mode-sub">One chapter at a time</div>
            </button>
            <button className={`fc-mode ${mode === 'all' ? 'on' : ''}`} onClick={() => setMode('all')}>
              <div className="fc-mode-title">Mix all themes</div>
              <div className="fc-mode-sub">{ALL_CARDS.length} words total</div>
            </button>
          </div>

          {mode === 'chapter' && (
            <div className="fc-theme-list">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`fc-theme ${themeId === t.id ? 'on' : ''}`}
                  onClick={() => setThemeId(t.id)}
                >
                  <div className="fc-theme-name">{t.label}</div>
                  <div className="fc-theme-count">{t.cards.length} words</div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card fc-setup-card">
          <h3>How many questions?</h3>
          <div className="card-sub">{totalCards} available · shuffled.</div>
          <div className="fc-chips">
            {SUBSET_PRESETS.map((n) => (
              <button
                key={n}
                className={`fc-chip ${subset === n ? 'on' : ''}`}
                disabled={n > totalCards}
                onClick={() => setSubset(n)}
              >
                {n}
              </button>
            ))}
            <button className={`fc-chip ${subset === 'all' ? 'on' : ''}`} onClick={() => setSubset('all')}>
              All ({totalCards})
            </button>
            <button className={`fc-chip ${subset === 'custom' ? 'on' : ''}`} onClick={() => setSubset('custom')}>
              Custom
            </button>
            {subset === 'custom' && (
              <input
                type="number"
                className="fc-custom-input"
                min="1"
                max={totalCards}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
              />
            )}
          </div>
        </section>

        <div className="fc-start-row">
          <button
            className="btn btn-primary fc-start"
            onClick={startSession}
            disabled={totalCards === 0 || requestedSize === 0}
          >
            Start · {requestedSize} question{requestedSize === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Session ---
function QuizSession({ deck, onResult, onFinish, onAbort }) {
  const [index, setIndex] = React.useState(0);
  const [typed, setTyped] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [correct, setCorrect] = React.useState(false);
  const inputRef = React.useRef(null);
  const card = deck[index];

  React.useEffect(() => {
    setTyped(''); setSubmitted(false); setCorrect(false);
    inputRef.current?.focus();
  }, [index]);

  if (!card) {
    return <Empty title="Empty quiz" hint="No words in the selected subset." />;
  }

  function grade() {
    const ok = checkAnswer(typed, card.en);
    setCorrect(ok);
    setSubmitted(true);
  }

  function next() {
    onResult(card, correct, typed);
    if (index + 1 >= deck.length) onFinish();
    else setIndex(index + 1);
  }

  function override() {
    setCorrect(true);
  }

  function onPrimary(e) {
    e?.preventDefault();
    if (!submitted) grade();
    else next();
  }

  const pct = Math.round((index / deck.length) * 100);

  return (
    <div className="fc-session">
      <div className="fc-session-head">
        <button className="btn btn-ghost btn-sm" onClick={onAbort}>← End quiz</button>
        <div className="fc-progress">
          <span className="fc-progress-num">{index + 1} / {deck.length}</span>
          <div className="fc-progress-bar">
            <div className="fc-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className={classnames('quiz-card', submitted && (correct ? 'is-correct' : 'is-wrong'))}>
        <div className="fc-side-label">Dutch</div>
        <div className="fc-word">
          {card.article && <span className="fc-article">{card.article}</span>}
          <span>{card.nl}</span>
        </div>

        <form className="quiz-form" onSubmit={onPrimary}>
          <input
            ref={inputRef}
            className="quiz-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type the English…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={submitted}
          />

          {submitted && (
            <div className={classnames('quiz-feedback', correct ? 'ok' : 'bad')}>
              <div className="quiz-verdict">
                {correct ? '✓ Correct' : '✗ Not quite'}
              </div>
              <div className="quiz-answer">
                <span className="quiz-answer-label">Answer:</span> {card.en}
              </div>
              {card.example && <div className="quiz-example">{card.example}</div>}
              {!correct && (
                <button type="button" className="btn btn-ghost btn-sm quiz-override" onClick={override}>
                  I was right — count it
                </button>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary fc-action quiz-primary">
            {submitted ? (index + 1 >= deck.length ? 'See results' : 'Next →') : 'Check'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Summary ---
function QuizSummary({ results, onAgain, onNew }) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const missed = results.filter((r) => !r.correct);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Quiz complete</h1>
          <div className="welcome">{correct} of {total} correct · {pct}%</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={onNew}>New quiz</button>
          <button className="btn btn-primary" onClick={onAgain}>Quiz these again</button>
        </div>
      </div>

      <div className="fc-score-card">
        <div className="fc-score-pct">{pct}%</div>
        <div className="fc-score-fraction">{correct} / {total}</div>
      </div>

      {missed.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>To review ({missed.length})</h3>
          <div className="card-sub">Words you didn't get right this quiz.</div>
          <div className="quiz-review-list">
            {missed.map((r) => (
              <div key={r.card.id} className="quiz-review-row">
                <span className="quiz-review-nl">
                  {r.card.article && <span className="fc-article">{r.card.article}</span>}
                  {r.card.nl}
                </span>
                <span className="quiz-review-en">{r.card.en}</span>
                {r.typed && <span className="quiz-review-typed">you typed: “{r.typed}”</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
