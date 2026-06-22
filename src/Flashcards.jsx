// === Flashcards: Dutch → English practice with per-card stats ===
import React from 'react';
import { THEMES, ALL_CARDS, getThemeById, groupLabel } from './flashcards/themes.js';
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

function statFor(stats, id) {
  return stats[id] || { seen: 0, got: 0, missed: 0, lastSeen: null };
}

export function Flashcards({ stats, onResult, onResetStats }) {
  // 'setup' | 'session' | 'summary'
  const [phase, setPhase] = React.useState('setup');
  // 'chapter' | 'all'
  const [mode, setMode] = React.useState('chapter');
  const [themeId, setThemeId] = React.useState(THEMES[0]?.id || null);
  const [subset, setSubset] = React.useState('all'); // number | 'all' | 'custom'
  const [customSize, setCustomSize] = React.useState(20);
  const [deck, setDeck] = React.useState([]);
  const [sessionResults, setSessionResults] = React.useState([]); // {cardId, got}

  const sourceCards = React.useMemo(() => {
    if (mode === 'all') return ALL_CARDS;
    const t = getThemeById(themeId);
    return t ? t.cards.map((c) => ({ ...c, themeId: t.id, themeName: t.name })) : [];
  }, [mode, themeId]);

  // All hooks must run on every render — keep them above the early returns.
  const totalStats = React.useMemo(() => {
    let seen = 0, got = 0;
    for (const s of Object.values(stats)) { seen += s.seen; got += s.got; }
    return { seen, got, pct: seen ? Math.round((got / seen) * 100) : null };
  }, [stats]);

  const totalCards = sourceCards.length;

  const requestedSize = (() => {
    if (subset === 'all') return totalCards;
    if (subset === 'custom') return Math.max(1, Math.min(totalCards, Number(customSize) || 1));
    return Math.min(subset, totalCards);
  })();

  function startSession() {
    const picked = shuffle(sourceCards).slice(0, requestedSize);
    setDeck(picked);
    setSessionResults([]);
    setPhase('session');
  }

  function recordResult(cardId, got) {
    onResult(cardId, got);
    setSessionResults((r) => [...r, { cardId, got }]);
  }

  function endSession() {
    setPhase('summary');
  }

  function backToSetup() {
    setPhase('setup');
    setDeck([]);
    setSessionResults([]);
  }

  if (phase === 'session') {
    return (
      <SessionPlayer
        deck={deck}
        onResult={recordResult}
        onFinish={endSession}
        onAbort={backToSetup}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        results={sessionResults}
        deck={deck}
        onAgain={() => { setSessionResults([]); setPhase('session'); }}
        onNew={backToSetup}
      />
    );
  }

  // --- Setup ---
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Flashcards</h1>
          <div className="welcome">
            Practice Dutch → English. Pick a theme or shuffle everything together.
          </div>
        </div>
        <div className="page-actions">
          {totalStats.seen > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onResetStats}>
              Reset stats
            </button>
          )}
        </div>
      </div>

      {totalStats.seen > 0 && (
        <div className="fc-stats-strip">
          <span><b>{totalStats.seen}</b> reviews</span>
          <span>·</span>
          <span><b>{totalStats.got}</b> got it</span>
          <span>·</span>
          <span><b>{totalStats.pct}%</b> overall</span>
        </div>
      )}

      <div className="fc-setup">
        <section className="card fc-setup-card">
          <h3>Mode</h3>
          <div className="card-sub">Choose one theme, or mix all themes.</div>
          <div className="fc-mode-row">
            <button
              className={`fc-mode ${mode === 'chapter' ? 'on' : ''}`}
              onClick={() => setMode('chapter')}
            >
              <div className="fc-mode-title">By theme</div>
              <div className="fc-mode-sub">One chapter at a time</div>
            </button>
            <button
              className={`fc-mode ${mode === 'all' ? 'on' : ''}`}
              onClick={() => setMode('all')}
            >
              <div className="fc-mode-title">All themes</div>
              <div className="fc-mode-sub">{ALL_CARDS.length} cards total</div>
            </button>
          </div>

          {mode === 'chapter' && (
            <div className="fc-theme-list">
              {THEMES.map((t, i) => (
                <React.Fragment key={t.id}>
                  {(i === 0 || THEMES[i - 1].group !== t.group) && (
                    <div className="fc-theme-group-label">{groupLabel(t.group)}</div>
                  )}
                  <button
                    className={`fc-theme ${themeId === t.id ? 'on' : ''}`}
                    onClick={() => setThemeId(t.id)}
                  >
                    <div className="fc-theme-name">{t.label}</div>
                    <div className="fc-theme-count">{t.cards.length} cards</div>
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </section>

        <section className="card fc-setup-card">
          <h3>How many cards?</h3>
          <div className="card-sub">{totalCards} available · all shuffled.</div>
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
            <button
              className={`fc-chip ${subset === 'all' ? 'on' : ''}`}
              onClick={() => setSubset('all')}
            >
              All ({totalCards})
            </button>
            <button
              className={`fc-chip ${subset === 'custom' ? 'on' : ''}`}
              onClick={() => setSubset('custom')}
            >
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
            Start · {requestedSize} card{requestedSize === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Session player ---
const SWIPE_THRESHOLD = 90;

function SessionPlayer({ deck, onResult, onFinish, onAbort }) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const dragRef = React.useRef({ startX: 0, active: false, dx: 0 });
  const card = deck[index];

  React.useEffect(() => { setFlipped(false); setDragX(0); }, [index]);

  // --- Swipe to grade (only once flipped) ---
  function onPointerDown(e) {
    if (!flipped) return;
    dragRef.current = { startX: e.clientX, active: true, dx: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.dx = dx;
    setDragX(dx);
  }
  function onPointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const dx = dragRef.current.dx;
    dragRef.current.dx = 0;
    setDragX(0);
    if (Math.abs(dx) > SWIPE_THRESHOLD) next(dx > 0); // right = got it, left = didn't know
  }

  // Keyboard: Space to flip, 1 for got it, 2 for missed
  React.useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      } else if (flipped && (e.key === '1' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        next(true);
      } else if (flipped && (e.key === '2' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function next(got) {
    onResult(card.id, got);
    if (index + 1 >= deck.length) {
      onFinish();
    } else {
      setIndex(index + 1);
    }
  }

  if (!card) {
    return <Empty title="Empty deck" hint="No cards in the selected subset." />;
  }

  const pct = Math.round(((index) / deck.length) * 100);

  return (
    <div className="fc-session">
      <div className="fc-session-head">
        <button className="btn btn-ghost btn-sm" onClick={onAbort}>← End session</button>
        <div className="fc-progress">
          <span className="fc-progress-num">{index + 1} / {deck.length}</span>
          <div className="fc-progress-bar">
            <div className="fc-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div
        className={classnames(
          'fc-card',
          flipped && 'flipped',
          dragX > 40 && 'swipe-right',
          dragX < -40 && 'swipe-left',
        )}
        onClick={() => !flipped && setFlipped(true)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={dragX ? { transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`, transition: 'none' } : undefined}
        role="button"
        tabIndex={0}
      >
        {!flipped ? (
          <>
            <div className="fc-side-label">{card.kind === 'sentence' ? 'Maak de zin' : (card.prompt ? 'Infinitive' : 'Dutch')}</div>
            <div className={classnames('fc-word', card.kind === 'sentence' && 'fc-cue')}>
              {card.article && <span className="fc-article">{card.article}</span>}
              <span>{card.nl}</span>
            </div>
            {card.prompt && <div className="fc-prompt">{card.prompt}</div>}
            <div className="fc-hint">Tap or press Space to flip</div>
          </>
        ) : (
          <>
            <div className="fc-side-label">{card.prompt ? 'Answer' : 'English'}</div>
            <div className={classnames('fc-word', card.kind === 'sentence' && 'fc-cue')}>{card.en}</div>
            <div className="fc-hint fc-hint-swipe">{(card.gloss || card.themeName)} · swipe or tap below</div>
          </>
        )}
      </div>

      <div className="fc-action-row">
        {flipped ? (
          <>
            <button className="btn btn-danger fc-action" onClick={() => next(false)}>
              Didn't know <span className="fc-kbd">2</span>
            </button>
            <button className="btn btn-primary fc-action" onClick={() => next(true)}>
              Got it <span className="fc-kbd">1</span>
            </button>
          </>
        ) : (
          <button className="btn btn-secondary fc-action" onClick={() => setFlipped(true)}>
            Show answer <span className="fc-kbd">Space</span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Session summary ---
function SessionSummary({ results, deck, onAgain, onNew }) {
  const got = results.filter((r) => r.got).length;
  const total = results.length;
  const pct = total ? Math.round((got / total) * 100) : 0;
  const missed = results.filter((r) => !r.got).map((r) => deck.find((c) => c.id === r.cardId)).filter(Boolean);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Session complete</h1>
          <div className="welcome">{got} of {total} correct · {pct}%</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={onNew}>New session</button>
          <button className="btn btn-primary" onClick={onAgain}>Practice these again</button>
        </div>
      </div>

      <div className="fc-score-card">
        <div className="fc-score-pct">{pct}%</div>
        <div className="fc-score-fraction">{got} / {total}</div>
      </div>

      {missed.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>To review ({missed.length})</h3>
          <div className="card-sub">Cards you didn't get right this session.</div>
          <div className="fc-review-list">
            {missed.map((c) => (
              <div key={c.id} className="fc-review-row">
                <span className="fc-review-nl">
                  {c.article && <span className="fc-article">{c.article}</span>}
                  {c.nl}
                </span>
                <span className="fc-review-en">{c.en}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
