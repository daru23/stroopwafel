import React from 'react';
import { TAG_KINDS, uid, Empty } from './components.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Dashboard } from './Dashboard.jsx';
import { ModulesView, ModuleEditor } from './ModulesView.jsx';
import { ModuleDetail } from './ModuleDetail.jsx';
import { QuizView } from './QuizView.jsx';
import { Flashcards } from './Flashcards.jsx';
import { SettingsMenu } from './Settings.jsx';
import { applyTheme } from './themes.js';
import { SEED_STATE, emptyState } from './seed.js';
import { migrate } from './shared/migrate.js';
import { toExport } from './shared/merge.js';
import {
  getToken, setToken, clearToken,
  fetchState, saveStateRemote,
  AuthError, ConflictError,
} from './api.js';

const CACHE_KEY = 'dutch-tracker-v2';

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY) || localStorage.getItem('dutch-tracker-v1');
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return null;
}

function saveCache(s) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

// --- TokenGate ---
function TokenGate({ onSuccess, onOffline }) {
  const [val, setVal] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr('');
    setToken(trimmed);
    try {
      const { rev, doc } = await fetchState();
      onSuccess(rev, migrate(doc));
    } catch (ex) {
      clearToken();
      setErr(ex instanceof AuthError ? 'Invalid token.' : 'Could not reach the server. Check the token and try again.');
      setBusy(false);
    }
  }

  return (
    <div className="token-gate">
      <div className="token-gate-box">
        <h2>Sync token</h2>
        <p>Enter your API token to sync progress across browsers.</p>
        <form onSubmit={submit}>
          <input
            className="token-input"
            type="password"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Paste token here…"
            autoFocus
          />
          {err && <p className="token-error">{err}</p>}
          <div className="token-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || !val.trim()}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOffline}>
              Use offline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Toast ---
function Toast({ message, onDismiss }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="app-toast">
      <span>{message}</span>
      <button onClick={onDismiss}>×</button>
    </div>
  );
}

export default function App() {
  const [state, setState] = React.useState(null); // null = loading
  const [syncStatus, setSyncStatus] = React.useState('loading'); // 'loading'|'online'|'offline'
  const [showTokenGate, setShowTokenGate] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [view, setView] = React.useState('dashboard');
  const [search, setSearch] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorInitial, setEditorInitial] = React.useState(null);

  const revRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const pendingRef = React.useRef(null);
  // Prevents saving server-loaded state back to server immediately
  const fromServerRef = React.useRef(false);

  const showToast = React.useCallback((msg) => setToast(msg), []);

  // --- Initial load ---
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!getToken()) {
        setState(loadCache() || SEED_STATE);
        setSyncStatus('offline');
        setShowTokenGate(true);
        return;
      }
      try {
        const { rev, doc } = await fetchState();
        if (cancelled) return;
        const migrated = migrate(doc);
        revRef.current = rev;
        fromServerRef.current = true;
        setState(migrated);
        saveCache(migrated);
        setSyncStatus('online');
      } catch (ex) {
        if (cancelled) return;
        if (ex instanceof AuthError) {
          clearToken();
          setShowTokenGate(true);
        }
        setState(loadCache() || SEED_STATE);
        setSyncStatus('offline');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // --- Apply theme ---
  React.useEffect(() => {
    if (state) applyTheme(state.themeKey);
  }, [state?.themeKey]);

  // --- Cache + debounced remote sync ---
  React.useEffect(() => {
    if (!state) return;
    saveCache(state);

    // Skip saving server-sourced state back immediately
    if (fromServerRef.current) {
      fromServerRef.current = false;
      return;
    }

    if (syncStatus !== 'online' || revRef.current === null) return;

    pendingRef.current = state;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const s = pendingRef.current;
      const rev = revRef.current;
      if (!s || rev === null) return;
      try {
        const { rev: newRev } = await saveStateRemote(s, rev);
        revRef.current = newRev;
        pendingRef.current = null;
      } catch (ex) {
        if (ex instanceof ConflictError) {
          const serverDoc = migrate(ex.doc);
          revRef.current = ex.rev;
          fromServerRef.current = true;
          setState(serverDoc);
          saveCache(serverDoc);
          showToast('Conflict: synced to latest server state');
        } else if (ex instanceof AuthError) {
          clearToken();
          setShowTokenGate(true);
          setSyncStatus('offline');
        } else {
          setSyncStatus('offline');
          showToast('Offline — changes saved locally');
        }
      }
    }, 800);
  }, [state]); // intentionally excludes syncStatus to avoid double-save on reconnect

  // --- Keepalive flush on tab close ---
  React.useEffect(() => {
    function flush() {
      if (!pendingRef.current || revRef.current === null) return;
      const token = getToken();
      if (!token) return;
      fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'If-Match': String(revRef.current),
        },
        body: JSON.stringify({ doc: pendingRef.current }),
        keepalive: true,
      }).catch(() => {});
    }
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  // --- Token gate success ---
  function onTokenSuccess(rev, doc) {
    revRef.current = rev;
    fromServerRef.current = true;
    setState(doc);
    saveCache(doc);
    setSyncStatus('online');
    setShowTokenGate(false);
  }

  // --- counts for sidebar (must run before any early return — Rules of Hooks) ---
  const counts = React.useMemo(() => {
    if (!state) return { modules: 0, generalQuizzes: 0, tags: {} };
    return {
      modules: state.modules.length,
      generalQuizzes: state.generalQuizzes.length,
      tags: TAG_KINDS.reduce((acc, t) => {
        acc[t] = state.modules.filter((m) => m.tags.includes(t)).length;
        return acc;
      }, {}),
    };
  }, [state]);

  // Loading screen
  if (state === null) {
    return <div className="app-loading"><div className="app-loading-spinner" /></div>;
  }

  // --- mutations ---
  const setTheme = (themeKey) => setState((s) => ({ ...s, themeKey }));

  const updateModule = (id, patch) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === id ? { ...m, ...patch } : m),
    }));
  };

  const addQuizToModule = (moduleId, quiz) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === moduleId
        ? { ...m, quizzes: [...m.quizzes, { id: uid('q'), ...quiz }], lastReviewed: quiz.date }
        : m),
    }));
  };

  const deleteQuiz = (moduleId, quizId) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === moduleId
        ? { ...m, quizzes: m.quizzes.filter((q) => q.id !== quizId) }
        : m),
    }));
  };

  const createModule = (data) => {
    const newModule = {
      id: uid('m'),
      name: data.name,
      tags: data.tags,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      lastReviewed: null,
      vocab: [],
      quizzes: [],
    };
    setState((s) => ({ ...s, modules: [...s.modules, newModule] }));
    return newModule.id;
  };

  const deleteModule = (id) => {
    setState((s) => ({ ...s, modules: s.modules.filter((m) => m.id !== id) }));
    setView('modules');
  };

  const addGeneralQuiz = (quiz) => {
    setState((s) => ({
      ...s,
      generalQuizzes: [...s.generalQuizzes, { id: uid('gq'), ...quiz }],
    }));
  };

  const deleteGeneralQuiz = (id) => {
    setState((s) => ({ ...s, generalQuizzes: s.generalQuizzes.filter((q) => q.id !== id) }));
  };

  const addVocab = (moduleId, entry) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === moduleId
        ? { ...m, vocab: [...(m.vocab || []), { id: uid('v'), ...entry }] }
        : m),
    }));
  };

  const updateVocab = (moduleId, vocabId, patch) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === moduleId
        ? { ...m, vocab: (m.vocab || []).map((v) => v.id === vocabId ? { ...v, ...patch } : v) }
        : m),
    }));
  };

  const deleteVocab = (moduleId, vocabId) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => m.id === moduleId
        ? { ...m, vocab: (m.vocab || []).filter((v) => v.id !== vocabId) }
        : m),
    }));
  };

  const recordFlashcardResult = (cardId, got) => {
    setState((s) => {
      const prev = s.flashcardStats?.[cardId] || { seen: 0, got: 0, missed: 0, lastSeen: null };
      return {
        ...s,
        flashcardStats: {
          ...(s.flashcardStats || {}),
          [cardId]: {
            seen: prev.seen + 1,
            got: prev.got + (got ? 1 : 0),
            missed: prev.missed + (got ? 0 : 1),
            lastSeen: new Date().toISOString(),
          },
        },
      };
    });
  };

  const resetFlashcardStats = () => {
    if (confirm('Reset all flashcard stats? This clears your per-card history.')) {
      setState((s) => ({ ...s, flashcardStats: {} }));
    }
  };

  const resetToSeed = () => {
    if (confirm('Reset all data to the demo seed? This will erase your progress.')) {
      setState(SEED_STATE);
    }
  };

  const clearAll = () => {
    if (confirm('Delete ALL your data and start fresh? This cannot be undone.')) {
      setState((s) => emptyState(s.themeKey));
      setView('dashboard');
    }
  };

  const exportData = () => {
    const exp = toExport(state);
    const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dutch-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- routing helpers ---
  const openModule = (id) => setView(`module:${id}`);
  const isModuleView = view.startsWith('module:');
  const moduleId = isModuleView ? view.slice('module:'.length) : null;
  const currentModule = moduleId ? state.modules.find((m) => m.id === moduleId) : null;
  const isTagView = view.startsWith('tag:');
  const tagFilter = isTagView ? view.slice('tag:'.length) : null;

  return (
    <div className="app">
      {showTokenGate && (
        <TokenGate
          onSuccess={onTokenSuccess}
          onOffline={() => setShowTokenGate(false)}
        />
      )}

      {syncStatus === 'offline' && !showTokenGate && (
        <div className="offline-banner">
          Working offline — changes saved locally only
          <button className="offline-connect" onClick={() => setShowTokenGate(true)}>
            Connect
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <Sidebar
        view={view}
        onNav={(v) => { setView(v); setSearch(''); }}
        counts={counts}
        streak={state.streak}
        weekDots={state.weekDots}
      />

      <main className="main">
        {view === 'dashboard' && (
          <Dashboard
            state={state}
            onNav={setView}
            onOpenModule={openModule}
            onOpenQuiz={() => setView('quiz')}
          />
        )}

        {(view === 'modules' || isTagView) && (
          <ModulesView
            modules={state.modules}
            filterTag={tagFilter}
            search={search}
            onSearch={setSearch}
            onOpen={openModule}
            onAdd={() => { setEditorInitial(null); setEditorOpen(true); }}
          />
        )}

        {isModuleView && currentModule && (
          <ModuleDetail
            module={currentModule}
            onBack={() => setView('modules')}
            onUpdate={(patch) => updateModule(currentModule.id, patch)}
            onAddQuiz={(quiz) => addQuizToModule(currentModule.id, quiz)}
            onDeleteQuiz={(qid) => deleteQuiz(currentModule.id, qid)}
            onEdit={() => { setEditorInitial(currentModule); setEditorOpen(true); }}
            onDelete={() => deleteModule(currentModule.id)}
            onAddVocab={(entry) => addVocab(currentModule.id, entry)}
            onUpdateVocab={(vid, patch) => updateVocab(currentModule.id, vid, patch)}
            onDeleteVocab={(vid) => deleteVocab(currentModule.id, vid)}
          />
        )}

        {isModuleView && !currentModule && (
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('modules')}>← All modules</button>
            <Empty title="Module not found" hint="It may have been deleted." />
          </div>
        )}

        {view === 'quiz' && (
          <QuizView
            state={state}
            onLogQuiz={addGeneralQuiz}
            onDeleteQuiz={deleteGeneralQuiz}
            onOpenModule={openModule}
          />
        )}

        {view === 'flashcards' && (
          <Flashcards
            stats={state.flashcardStats || {}}
            onResult={recordFlashcardResult}
            onResetStats={resetFlashcardStats}
          />
        )}
      </main>

      {editorOpen && (
        <ModuleEditor
          initial={editorInitial}
          onClose={() => setEditorOpen(false)}
          onSave={(data) => {
            if (editorInitial) {
              updateModule(editorInitial.id, data);
            } else {
              const newId = createModule(data);
              setView(`module:${newId}`);
            }
            setEditorOpen(false);
          }}
        />
      )}

      <SettingsMenu
        themeKey={state.themeKey}
        onTheme={setTheme}
        onReset={resetToSeed}
        onClear={clearAll}
        onExport={exportData}
        currentState={state}
        onApplyImport={(merged) => setState(merged)}
      />
    </div>
  );
}
