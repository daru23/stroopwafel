// === Main App: state, routing, persistence ===
import React from 'react';
import { TAG_KINDS, uid, Empty } from './components.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Dashboard } from './Dashboard.jsx';
import { ModulesView, ModuleEditor } from './ModulesView.jsx';
import { ModuleDetail } from './ModuleDetail.jsx';
import { QuizView } from './QuizView.jsx';
import { SettingsMenu } from './Settings.jsx';
import { applyTheme } from './themes.js';
import { SEED_STATE, emptyState } from './seed.js';

const STORAGE_KEY = 'dutch-tracker-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) return parsed;
  } catch (e) {
    console.warn('Failed to load saved state', e);
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

export default function App() {
  const [state, setState] = React.useState(() => loadState() || SEED_STATE);
  const [view, setView] = React.useState('dashboard'); // 'dashboard' | 'modules' | 'quiz' | 'tag:<tag>' | 'module:<id>'
  const [search, setSearch] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorInitial, setEditorInitial] = React.useState(null);

  // Apply theme whenever it changes
  React.useEffect(() => {
    applyTheme(state.themeKey);
  }, [state.themeKey]);

  // Persist whenever state changes
  React.useEffect(() => { saveState(state); }, [state]);

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

  // --- counts for sidebar ---
  const counts = React.useMemo(() => ({
    modules: state.modules.length,
    generalQuizzes: state.generalQuizzes.length,
    tags: TAG_KINDS.reduce((acc, t) => {
      acc[t] = state.modules.filter((m) => m.tags.includes(t)).length;
      return acc;
    }, {}),
  }), [state]);

  // --- routing helpers ---
  const openModule = (id) => setView(`module:${id}`);
  const isModuleView = view.startsWith('module:');
  const moduleId = isModuleView ? view.slice('module:'.length) : null;
  const currentModule = moduleId ? state.modules.find((m) => m.id === moduleId) : null;
  const isTagView = view.startsWith('tag:');
  const tagFilter = isTagView ? view.slice('tag:'.length) : null;

  return (
    <div className="app">
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
      />
    </div>
  );
}
