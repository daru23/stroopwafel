// A2-level Dutch grammar modules to start with. The user can add/edit/delete freely.
export const SEED_MODULES = [
  {
    id: 'm-perfectum',
    name: 'Perfectum (hebben/zijn + voltooid deelwoord)',
    tags: ['grammar'],
    notes: '• Form: hebben/zijn (aux) + past participle\n• Past participle: ge- + stem + -t/-d (weak verbs)\n• "Zijn" with motion / change-of-state verbs: gaan, komen, beginnen, blijven\n• Example: Ik heb gewerkt · Ik ben gegaan',
    createdAt: '2026-05-12T10:00:00Z',
    lastReviewed: '2026-06-07T14:30:00Z',
    quizzes: [
      { id: 'q-perf-1', score: 6, total: 10, date: '2026-05-15T18:00:00Z', note: 'Confused werken/gewerkt' },
      { id: 'q-perf-2', score: 7, total: 10, date: '2026-05-22T19:10:00Z', note: '' },
      { id: 'q-perf-3', score: 8, total: 10, date: '2026-06-07T14:30:00Z', note: 'Better with hebben/zijn split' },
    ],
  },
  {
    id: 'm-imperfectum',
    name: 'Imperfectum (simple past)',
    tags: ['grammar'],
    notes: '• Weak verbs: stem + -te(n) / -de(n)\n• "t kofschip" rule decides -te vs -de\n• Strong verbs: vowel change (lopen → liep)\n• Used in storytelling & written narration',
    createdAt: '2026-05-18T10:00:00Z',
    lastReviewed: '2026-06-01T20:00:00Z',
    quizzes: [
      { id: 'q-imp-1', score: 5, total: 10, date: '2026-05-25T20:00:00Z', note: 'Strong verbs are hard' },
      { id: 'q-imp-2', score: 7, total: 10, date: '2026-06-01T20:00:00Z', note: '' },
    ],
  },
  {
    id: 'm-er-hier-daar',
    name: 'Er / Hier / Daar',
    tags: ['grammar', 'speaking'],
    notes: '• "Er" as placeholder subject ("Er is een…")\n• "Er" with quantities: er zijn er drie\n• Hier/Daar + preposition: hierop, daarover\n• Practice in everyday phrases',
    createdAt: '2026-05-28T10:00:00Z',
    lastReviewed: '2026-05-30T15:00:00Z',
    quizzes: [
      { id: 'q-erhd-1', score: 4, total: 10, date: '2026-05-30T15:00:00Z', note: 'Still tricky' },
    ],
  },
  {
    id: 'm-modale-werkwoorden',
    name: 'Modale werkwoorden (kunnen, mogen, moeten, willen, zullen)',
    tags: ['grammar'],
    notes: '• Modal + infinitive at sentence end\n• "Ik wil graag een koffie" — wens\n• "Je moet hier wachten" — verplichting\n• Watch for "mogen" → permission vs "kunnen" → ability',
    createdAt: '2026-06-02T10:00:00Z',
    lastReviewed: '2026-06-08T20:00:00Z',
    quizzes: [
      { id: 'q-mod-1', score: 9, total: 10, date: '2026-06-08T20:00:00Z', note: 'Felt confident' },
    ],
  },
  {
    id: 'm-bijzin',
    name: 'Bijzin — woordvolgorde (subordinate clause word order)',
    tags: ['grammar'],
    notes: '• Verb goes to the end in subordinate clauses\n• Triggers: omdat, dat, als, wanneer, terwijl, hoewel\n• "Ik blijf thuis omdat het regent."\n• Multi-verb stacks at end (hoofdwerkwoord laatst of voorlaatst)',
    createdAt: '2026-06-04T10:00:00Z',
    lastReviewed: null,
    quizzes: [],
  },
];

export const SEED_STATE = {
  version: 1,
  themeKey: 'focus',
  dailyGoal: 1,           // lessons/quizzes per day
  weeklyGoalDays: 5,      // days/week
  streak: 4,
  weekDots: [true, true, false, true, true, true, false], // Mon..Sun
  modules: SEED_MODULES,
  generalQuizzes: [
    { id: 'gq-1', moduleIds: ['m-perfectum', 'm-imperfectum'], score: 12, total: 15, date: '2026-06-05T19:00:00Z', note: 'Mixed tenses drill' },
    { id: 'gq-2', moduleIds: ['m-modale-werkwoorden', 'm-er-hier-daar'], score: 8, total: 12, date: '2026-06-09T18:30:00Z', note: '' },
  ],
};

export function emptyState(themeKey = 'focus') {
  return {
    version: 1, themeKey,
    dailyGoal: 1, weeklyGoalDays: 5,
    streak: 0,
    weekDots: [false, false, false, false, false, false, false],
    modules: [],
    generalQuizzes: [],
  };
}
