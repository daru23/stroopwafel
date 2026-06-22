// State document migrations. Shared by the frontend and the API server.
export const CURRENT_VERSION = 4;

export function migrate(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (doc.version === 1) {
    doc = {
      ...doc,
      version: 2,
      modules: (doc.modules || []).map((m) => ({ ...m, vocab: m.vocab ?? [] })),
    };
  }
  if (doc.version === 2) {
    doc = {
      ...doc,
      version: 3,
      flashcardStats: doc.flashcardStats ?? {},
    };
  }
  if (doc.version === 3) {
    doc = {
      ...doc,
      version: 4,
      quizStats: doc.quizStats ?? {},
    };
  }
  return doc;
}

export function emptyDoc(themeKey = 'focus') {
  return {
    version: CURRENT_VERSION, themeKey,
    dailyGoal: 1, weeklyGoalDays: 5,
    streak: 0,
    weekDots: [false, false, false, false, false, false, false],
    modules: [],
    generalQuizzes: [],
    flashcardStats: {},
    quizStats: {},
  };
}
