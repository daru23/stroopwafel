// Import-file validation and merge logic. Pure functions, shared by the
// frontend (Settings import UI) and the API server (POST /api/import).

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Returns { ok: true } or { ok: false, error }
export function validateImport(json) {
  if (!json || typeof json !== 'object') return { ok: false, error: 'Not a JSON object.' };
  if (json.format !== 'dutch-tracker-import') return { ok: false, error: 'Missing or wrong "format" — expected "dutch-tracker-import".' };
  if (json.version !== 2) return { ok: false, error: `Unsupported version ${json.version} — expected 2.` };
  if (json.modules != null && !Array.isArray(json.modules)) return { ok: false, error: '"modules" must be an array.' };
  if (json.generalQuizzes != null && !Array.isArray(json.generalQuizzes)) return { ok: false, error: '"generalQuizzes" must be an array.' };
  for (const [i, m] of (json.modules || []).entries()) {
    if (!m || typeof m.name !== 'string' || !m.name.trim()) return { ok: false, error: `modules[${i}]: "name" is required.` };
    for (const [j, v] of (m.vocab || []).entries()) {
      if (!v || typeof v.nl !== 'string' || !v.nl.trim()) return { ok: false, error: `modules[${i}].vocab[${j}]: "nl" is required.` };
    }
    for (const [j, q] of (m.quizzes || []).entries()) {
      if (!q || typeof q.score !== 'number' || typeof q.total !== 'number' || q.total <= 0) {
        return { ok: false, error: `modules[${i}].quizzes[${j}]: numeric "score" and positive "total" are required.` };
      }
    }
  }
  for (const [i, q] of (json.generalQuizzes || []).entries()) {
    if (!q || typeof q.score !== 'number' || typeof q.total !== 'number' || q.total <= 0) {
      return { ok: false, error: `generalQuizzes[${i}]: numeric "score" and positive "total" are required.` };
    }
  }
  return { ok: true };
}

// Merge an import file into a state doc. Returns { state, summary }.
// - Modules match by id, else by case-insensitive name.
// - Matched: shallow-merge name/tags/notes; append vocab (dedup by nl) and
//   quizzes (dedup by id).
// - Unmatched: created fresh.
// - generalQuizzes: append, dedup by id.
export function planMerge(state, imp) {
  const summary = { newModules: 0, mergedModules: 0, vocabAdded: 0, quizzesAdded: 0, generalQuizzesAdded: 0 };
  const modules = [...state.modules];

  const findTarget = (im) => {
    if (im.id) {
      const byId = modules.findIndex((m) => m.id === im.id);
      if (byId !== -1) return byId;
    }
    return modules.findIndex((m) => m.name.toLowerCase() === im.name.trim().toLowerCase());
  };

  for (const im of imp.modules || []) {
    const idx = findTarget(im);
    const importedVocab = (im.vocab || []).map((v) => ({
      id: v.id || uid('v'), nl: v.nl.trim(), en: v.en || '', example: v.example || '',
    }));
    const importedQuizzes = (im.quizzes || []).map((q) => ({
      id: q.id || uid('q'), score: q.score, total: q.total,
      date: q.date || new Date().toISOString(), note: q.note || '',
    }));

    if (idx === -1) {
      const id = im.id && !modules.some((m) => m.id === im.id) ? im.id : uid('m');
      modules.push({
        id,
        name: im.name.trim(),
        tags: im.tags || [],
        notes: im.notes || '',
        createdAt: new Date().toISOString(),
        lastReviewed: im.lastReviewed || null,
        quizzes: importedQuizzes,
        vocab: importedVocab,
      });
      summary.newModules++;
      summary.vocabAdded += importedVocab.length;
      summary.quizzesAdded += importedQuizzes.length;
    } else {
      const target = modules[idx];
      const existingNl = new Set((target.vocab || []).map((v) => v.nl.toLowerCase()));
      const newVocab = importedVocab.filter((v) => !existingNl.has(v.nl.toLowerCase()));
      const existingQid = new Set(target.quizzes.map((q) => q.id));
      const newQuizzes = importedQuizzes.filter((q) => !existingQid.has(q.id));
      modules[idx] = {
        ...target,
        name: im.name.trim() || target.name,
        tags: im.tags || target.tags,
        notes: im.notes != null ? im.notes : target.notes,
        vocab: [...(target.vocab || []), ...newVocab],
        quizzes: [...target.quizzes, ...newQuizzes],
      };
      summary.mergedModules++;
      summary.vocabAdded += newVocab.length;
      summary.quizzesAdded += newQuizzes.length;
    }
  }

  const existingGq = new Set(state.generalQuizzes.map((q) => q.id));
  const newGq = (imp.generalQuizzes || [])
    .map((q) => ({
      id: q.id || uid('gq'), moduleIds: q.moduleIds || [],
      score: q.score, total: q.total,
      date: q.date || new Date().toISOString(), note: q.note || '',
    }))
    .filter((q) => !existingGq.has(q.id));
  summary.generalQuizzesAdded = newGq.length;

  return {
    state: { ...state, modules, generalQuizzes: [...state.generalQuizzes, ...newGq] },
    summary,
  };
}

// Full state → round-trippable import-format JSON (themeKey and goals excluded).
export function toExport(state) {
  return {
    format: 'dutch-tracker-import',
    version: 2,
    modules: state.modules.map((m) => ({
      id: m.id, name: m.name, tags: m.tags, notes: m.notes,
      lastReviewed: m.lastReviewed,
      vocab: (m.vocab || []).map(({ id, nl, en, example }) => ({ id, nl, en, example })),
      quizzes: m.quizzes.map(({ id, score, total, date, note }) => ({ id, score, total, date, note })),
    })),
    generalQuizzes: state.generalQuizzes.map(({ id, moduleIds, score, total, date, note }) => ({ id, moduleIds, score, total, date, note })),
  };
}
