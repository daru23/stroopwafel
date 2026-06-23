// Sentence-level conjugation drills for the Quiz (and Flashcards).
// Each base sentence is hand-verified, then mechanically expanded into five
// forms so every conjugation + word order is correct:
//   present · imperfectum · perfectum · inversion (present) · inversion + past
//
// Base fields:
//   time     — a frontable adverb (position 1 in the inversion forms)
//   subj     — subject pronoun / noun
//   inf      — infinitive (shown in the cue)
//   pres     — present form for this subject
//   presInv  — present form AFTER the verb (jij loses its -t in inversion); defaults to pres
//   imp      — imperfectum for this subject
//   aux      — perfectum auxiliary conjugated for this subject (heb/hebt/heeft/hebben/ben/bent/is/zijn)
//   part     — voltooid deelwoord
//   rest     — the rest of the sentence (object / complement), may be ''
//   auxName  — 'hebben' | 'zijn'  (for the explanation)
//   motion   — true when 'zijn' is used because of movement/change (for the explanation)
//   reg      — 'zwak' | 'sterk' | 'onregelmatig' (for the imperfectum explanation)
//   presNote — short note on how the present form is built

const BASES = [
  // ----- regular (weak) verbs -----
  { time: 'vandaag', subj: 'ik', inf: 'werken', pres: 'werk', imp: 'werkte', aux: 'heb', part: 'gewerkt', rest: 'op kantoor', auxName: 'hebben', reg: 'zwak', presNote: "ik-vorm = de stam: werk" },
  { time: 'soms', subj: 'hij', inf: 'koken', pres: 'kookt', imp: 'kookte', aux: 'heeft', part: 'gekookt', rest: 'het eten', auxName: 'hebben', reg: 'zwak', presNote: "hij = stam + t: kookt" },
  { time: 'vaak', subj: 'wij', inf: 'spelen', pres: 'spelen', imp: 'speelden', aux: 'hebben', part: 'gespeeld', rest: 'in de tuin', auxName: 'hebben', reg: 'zwak', presNote: "meervoud = hele werkwoord: spelen" },
  { time: 'elke dag', subj: 'jij', inf: 'leren', pres: 'leert', presInv: 'leer', imp: 'leerde', aux: 'hebt', part: 'geleerd', rest: 'Nederlands', auxName: 'hebben', reg: 'zwak', presNote: "jij = stam + t: leert" },
  { time: 'thuis', subj: 'ik', inf: 'luisteren', pres: 'luister', imp: 'luisterde', aux: 'heb', part: 'geluisterd', rest: 'naar muziek', auxName: 'hebben', reg: 'zwak', presNote: "ik-vorm = de stam: luister" },
  { time: 'nu', subj: 'zij', inf: 'wonen', pres: 'woont', imp: 'woonde', aux: 'heeft', part: 'gewoond', rest: 'in Amsterdam', auxName: 'hebben', reg: 'zwak', presNote: "zij (enkelvoud) = stam + t: woont" },
  { time: 'buiten', subj: 'de kinderen', inf: 'spelen', pres: 'spelen', imp: 'speelden', aux: 'hebben', part: 'gespeeld', rest: 'de hele dag', auxName: 'hebben', reg: 'zwak', presNote: "meervoud = hele werkwoord: spelen" },
  { time: 'samen', subj: 'wij', inf: 'betalen', pres: 'betalen', imp: 'betaalden', aux: 'hebben', part: 'betaald', rest: 'de rekening', auxName: 'hebben', reg: 'zwak', presNote: "meervoud = hele werkwoord: betalen" },
  { time: 'soms', subj: 'ik', inf: 'praten', pres: 'praat', imp: 'praatte', aux: 'heb', part: 'gepraat', rest: 'met de buren', auxName: 'hebben', reg: 'zwak', presNote: "ik-vorm = de stam: praat" },
  { time: 'altijd', subj: 'jij', inf: 'wachten', pres: 'wacht', imp: 'wachtte', aux: 'hebt', part: 'gewacht', rest: 'op de bus', auxName: 'hebben', reg: 'zwak', presNote: "stam eindigt al op -t: wacht" },

  // ----- strong / irregular verbs -----
  { time: 'vandaag', subj: 'ik', inf: 'gaan', pres: 'ga', imp: 'ging', aux: 'ben', part: 'gegaan', rest: 'naar school', auxName: 'zijn', motion: true, reg: 'onregelmatig', presNote: "onregelmatig: ik ga" },
  { time: 'vaak', subj: 'hij', inf: 'komen', pres: 'komt', imp: 'kwam', aux: 'is', part: 'gekomen', rest: 'te laat', auxName: 'zijn', motion: true, reg: 'onregelmatig', presNote: "hij komt (stam kom + t)" },
  { time: 'altijd', subj: 'wij', inf: 'eten', pres: 'eten', imp: 'aten', aux: 'hebben', part: 'gegeten', rest: 'fruit', auxName: 'hebben', reg: 'sterk', presNote: "meervoud = hele werkwoord: eten" },
  { time: 'soms', subj: 'ik', inf: 'lezen', pres: 'lees', imp: 'las', aux: 'heb', part: 'gelezen', rest: 'een boek', auxName: 'hebben', reg: 'sterk', presNote: "ik-vorm = de stam: lees" },
  { time: 'nu', subj: 'jij', inf: 'schrijven', pres: 'schrijft', presInv: 'schrijf', imp: 'schreef', aux: 'hebt', part: 'geschreven', rest: 'een brief', auxName: 'hebben', reg: 'sterk', presNote: "jij = stam + t: schrijft" },
  { time: 'altijd', subj: 'hij', inf: 'drinken', pres: 'drinkt', imp: 'dronk', aux: 'heeft', part: 'gedronken', rest: 'koffie', auxName: 'hebben', reg: 'sterk', presNote: "hij = stam + t: drinkt" },
  { time: 'vandaag', subj: 'wij', inf: 'blijven', pres: 'blijven', imp: 'bleven', aux: 'zijn', part: 'gebleven', rest: 'thuis', auxName: 'zijn', motion: true, reg: 'sterk', presNote: "meervoud = hele werkwoord: blijven" },
  { time: 'vaak', subj: 'ik', inf: 'zien', pres: 'zie', imp: 'zag', aux: 'heb', part: 'gezien', rest: 'mijn vrienden', auxName: 'hebben', reg: 'sterk', presNote: "ik-vorm = de stam: zie" },
  { time: 'elke dag', subj: 'zij', inf: 'nemen', pres: 'neemt', imp: 'nam', aux: 'heeft', part: 'genomen', rest: 'de trein', auxName: 'hebben', reg: 'sterk', presNote: "zij (enkelvoud) = stam + t: neemt" },
  { time: 'samen', subj: 'wij', inf: 'lopen', pres: 'lopen', imp: 'liepen', aux: 'zijn', part: 'gelopen', rest: 'naar het park', auxName: 'zijn', motion: true, reg: 'sterk', presNote: "meervoud = hele werkwoord: lopen" },
  { time: 'altijd', subj: 'ik', inf: 'slapen', pres: 'slaap', imp: 'sliep', aux: 'heb', part: 'geslapen', rest: 'lang', auxName: 'hebben', reg: 'sterk', presNote: "ik-vorm = de stam: slaap" },
  { time: 'vaak', subj: 'hij', inf: 'helpen', pres: 'helpt', imp: 'hielp', aux: 'heeft', part: 'geholpen', rest: 'zijn moeder', auxName: 'hebben', reg: 'sterk', presNote: "hij = stam + t: helpt" },
  { time: 'soms', subj: 'jij', inf: 'vergeten', pres: 'vergeet', imp: 'vergat', aux: 'bent', part: 'vergeten', rest: 'je sleutels', auxName: 'zijn', motion: true, reg: 'sterk', presNote: "jij = stam + t: vergeet" },
  { time: 'vandaag', subj: 'wij', inf: 'kopen', pres: 'kopen', imp: 'kochten', aux: 'hebben', part: 'gekocht', rest: 'brood', auxName: 'hebben', reg: 'onregelmatig', presNote: "meervoud = hele werkwoord: kopen" },
  { time: 'altijd', subj: 'ik', inf: 'doen', pres: 'doe', imp: 'deed', aux: 'heb', part: 'gedaan', rest: 'mijn huiswerk', auxName: 'hebben', reg: 'onregelmatig', presNote: "onregelmatig: ik doe" },
  { time: 'nu', subj: 'hij', inf: 'staan', pres: 'staat', imp: 'stond', aux: 'heeft', part: 'gestaan', rest: 'voor de deur', auxName: 'hebben', reg: 'onregelmatig', presNote: "hij staat (stam sta + t)" },

  // ----- 'zijn' and 'hebben' as main verbs -----
  { time: 'vandaag', subj: 'wij', inf: 'zijn', pres: 'zijn', imp: 'waren', aux: 'zijn', part: 'geweest', rest: 'blij', auxName: 'zijn', reg: 'onregelmatig', presNote: "onregelmatig: wij zijn" },
  { time: 'nu', subj: 'ik', inf: 'hebben', pres: 'heb', imp: 'had', aux: 'heb', part: 'gehad', rest: 'honger', auxName: 'hebben', reg: 'onregelmatig', presNote: "onregelmatig: ik heb" },
];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const squish = (s) => s.replace(/\s+/g, ' ').trim();
const sentence = (...parts) => cap(squish(parts.join(' '))) + '.';
const cue = (...parts) => parts.filter(Boolean).join(' · ');

function impNote(b) {
  if (b.reg === 'zwak') return `Zwak werkwoord: stam + -te/-de → ${b.imp}`;
  if (b.reg === 'sterk') return `Sterk werkwoord (klinkerwisseling): ${b.inf} → ${b.imp}`;
  return `Onregelmatig: ${b.inf} → ${b.imp}`;
}
function perfNote(b) {
  let s = `Perfectum = ${b.auxName} (${b.aux}) + voltooid deelwoord. Het deelwoord '${b.part}' staat achteraan.`;
  if (b.motion && b.auxName === 'zijn') s += ` We gebruiken 'zijn' (beweging of verandering).`;
  return s;
}
function invNote(b, past) {
  const verb = past ? b.imp : (b.presInv || b.pres);
  let s = `Inversie: de zin begint met '${cap(b.time)}', dus het werkwoord ('${verb}') blijft op plaats 2 — vóór het onderwerp '${b.subj}'.`;
  if (!past && (b.subj === 'jij' || b.subj === 'je') && (b.presInv || b.pres) !== b.pres) {
    s += ` Let op: na het werkwoord verliest 'jij' de -t (${b.presInv} jij, niet ${b.pres} jij).`;
  }
  if (past) s += ` Het werkwoord staat in de verleden tijd.`;
  return s;
}

function build(themeId, prompt, makeAnswer, makeGloss, withTime) {
  return BASES.map((b) => ({
    nl: withTime ? cue(b.time, b.subj, b.inf, b.rest) : cue(b.subj, b.inf, b.rest),
    en: makeAnswer(b),
    prompt,
    gloss: makeGloss(b),
    kind: 'sentence',
  }));
}

// --- Separable verbs (scheidbare werkwoorden) ---
// In a main clause the prefix splits off and goes to the end ("Ik bel ... op").
// In the perfectum, -ge- sits between the prefix and the stem ("opgebeld").
//   subj — subject
//   inf  — full separable infinitive (shown in the cue)
//   sep  — the separable prefix (goes to the end in the present)
//   verb — the main verb conjugated for the subject, WITHOUT the prefix
//   aux  — perfectum auxiliary conjugated for the subject
//   part — full participle (prefix + ge + stem)
//   rest — object / complement (may be '')
//   en   — English meaning
const SEP_BASES = [
  { subj: 'ik', inf: 'opbellen', sep: 'op', verb: 'bel', aux: 'heb', part: 'opgebeld', rest: 'mijn moeder', en: 'to call up' },
  { subj: 'ik', inf: 'opstaan', sep: 'op', verb: 'sta', aux: 'ben', part: 'opgestaan', rest: 'vroeg', en: 'to get up' },
  { subj: 'de trein', inf: 'aankomen', sep: 'aan', verb: 'komt', aux: 'is', part: 'aangekomen', rest: 'op tijd', en: 'to arrive' },
  { subj: 'ik', inf: 'meenemen', sep: 'mee', verb: 'neem', aux: 'heb', part: 'meegenomen', rest: 'mijn boek', en: 'to take along' },
  { subj: 'wij', inf: 'uitgaan', sep: 'uit', verb: 'gaan', aux: 'zijn', part: 'uitgegaan', rest: 'vanavond', en: 'to go out' },
  { subj: 'ik', inf: 'afwassen', sep: 'af', verb: 'was', aux: 'heb', part: 'afgewassen', rest: 'de borden', en: 'to do the dishes' },
  { subj: 'ik', inf: 'opruimen', sep: 'op', verb: 'ruim', aux: 'heb', part: 'opgeruimd', rest: 'mijn kamer', en: 'to tidy up' },
  { subj: 'hij', inf: 'schoonmaken', sep: 'schoon', verb: 'maakt', aux: 'heeft', part: 'schoongemaakt', rest: 'het huis', en: 'to clean' },
  { subj: 'ik', inf: 'meedoen', sep: 'mee', verb: 'doe', aux: 'heb', part: 'meegedaan', rest: '', en: 'to join in' },
  { subj: 'hij', inf: 'terugkomen', sep: 'terug', verb: 'komt', aux: 'is', part: 'teruggekomen', rest: 'laat', en: 'to come back' },
  { subj: 'ik', inf: 'aantrekken', sep: 'aan', verb: 'trek', aux: 'heb', part: 'aangetrokken', rest: 'mijn jas', en: 'to put on' },
  { subj: 'ik', inf: 'uittrekken', sep: 'uit', verb: 'trek', aux: 'heb', part: 'uitgetrokken', rest: 'mijn schoenen', en: 'to take off' },
  { subj: 'ik', inf: 'opendoen', sep: 'open', verb: 'doe', aux: 'heb', part: 'opengedaan', rest: 'de deur', en: 'to open' },
  { subj: 'ik', inf: 'dichtdoen', sep: 'dicht', verb: 'doe', aux: 'heb', part: 'dichtgedaan', rest: 'het raam', en: 'to close' },
  { subj: 'ik', inf: 'aanzetten', sep: 'aan', verb: 'zet', aux: 'heb', part: 'aangezet', rest: 'de tv', en: 'to turn on' },
  { subj: 'ik', inf: 'uitzetten', sep: 'uit', verb: 'zet', aux: 'heb', part: 'uitgezet', rest: 'de radio', en: 'to turn off' },
  { subj: 'ik', inf: 'ophangen', sep: 'op', verb: 'hang', aux: 'heb', part: 'opgehangen', rest: 'de was', en: 'to hang up' },
  { subj: 'ik', inf: 'ophalen', sep: 'op', verb: 'haal', aux: 'heb', part: 'opgehaald', rest: 'de kinderen', en: 'to pick up' },
  { subj: 'wij', inf: 'afspreken', sep: 'af', verb: 'spreken', aux: 'hebben', part: 'afgesproken', rest: 'iets', en: 'to make an appointment' },
  { subj: 'ik', inf: 'uitnodigen', sep: 'uit', verb: 'nodig', aux: 'heb', part: 'uitgenodigd', rest: 'mijn vrienden', en: 'to invite' },
  { subj: 'ik', inf: 'terugbrengen', sep: 'terug', verb: 'breng', aux: 'heb', part: 'teruggebracht', rest: 'het boek', en: 'to bring back' },
  { subj: 'ik', inf: 'weggaan', sep: 'weg', verb: 'ga', aux: 'ben', part: 'weggegaan', rest: 'vroeg', en: 'to leave' },
  { subj: 'hij', inf: 'binnenkomen', sep: 'binnen', verb: 'komt', aux: 'is', part: 'binnengekomen', rest: 'stil', en: 'to come in' },
  { subj: 'wij', inf: 'instappen', sep: 'in', verb: 'stappen', aux: 'zijn', part: 'ingestapt', rest: '', en: 'to get in / board' },
  { subj: 'wij', inf: 'uitstappen', sep: 'uit', verb: 'stappen', aux: 'zijn', part: 'uitgestapt', rest: '', en: 'to get off' },
  { subj: 'ik', inf: 'overstappen', sep: 'over', verb: 'stap', aux: 'ben', part: 'overgestapt', rest: 'in Utrecht', en: 'to transfer / change' },
  { subj: 'ik', inf: 'opletten', sep: 'op', verb: 'let', aux: 'heb', part: 'opgelet', rest: 'goed', en: 'to pay attention' },
  { subj: 'ik', inf: 'afmaken', sep: 'af', verb: 'maak', aux: 'heb', part: 'afgemaakt', rest: 'mijn werk', en: 'to finish' },
  { subj: 'ik', inf: 'invullen', sep: 'in', verb: 'vul', aux: 'heb', part: 'ingevuld', rest: 'het formulier', en: 'to fill in' },
  { subj: 'ik', inf: 'opschrijven', sep: 'op', verb: 'schrijf', aux: 'heb', part: 'opgeschreven', rest: 'het adres', en: 'to write down' },
  { subj: 'hij', inf: 'uitleggen', sep: 'uit', verb: 'legt', aux: 'heeft', part: 'uitgelegd', rest: 'de regel', en: 'to explain' },
  { subj: 'ik', inf: 'voorstellen', sep: 'voor', verb: 'stel', aux: 'heb', part: 'voorgesteld', rest: 'een plan', en: 'to propose / introduce' },
  { subj: 'hij', inf: 'aanbieden', sep: 'aan', verb: 'biedt', aux: 'heeft', part: 'aangeboden', rest: 'koffie', en: 'to offer' },
  { subj: 'ik', inf: 'meebrengen', sep: 'mee', verb: 'breng', aux: 'heb', part: 'meegebracht', rest: 'een cadeau', en: 'to bring along' },
];

const sepAuxName = (a) => (['ben', 'bent', 'is', 'zijn'].includes(a) ? 'zijn' : 'hebben');

function buildSep(prompt, makeAnswer, makeGloss) {
  return SEP_BASES.map((b) => ({
    nl: cue(b.subj, b.inf, b.rest),
    en: makeAnswer(b),
    prompt,
    gloss: makeGloss(b),
    kind: 'sentence',
  }));
}

export const SENTENCE_THEMES = [
  {
    id: 's-pres', group: 'sentences',
    name: 'Zinnen — Tegenwoordige tijd',
    label: 'Sentences · Tegenwoordige tijd (present)',
    cards: build('s-pres', 'tegenwoordige tijd',
      (b) => sentence(b.subj, b.pres, b.rest),
      (b) => `Tegenwoordige tijd. ${b.presNote}.`,
      false),
  },
  {
    id: 's-imp', group: 'sentences',
    name: 'Zinnen — Verleden tijd',
    label: 'Sentences · Verleden tijd (imperfectum)',
    cards: build('s-imp', 'verleden tijd (imperfectum)',
      (b) => sentence(b.subj, b.imp, b.rest),
      (b) => `Verleden tijd. ${impNote(b)}.`,
      false),
  },
  {
    id: 's-perf', group: 'sentences',
    name: 'Zinnen — Perfectum',
    label: 'Sentences · Perfectum (voltooid)',
    cards: build('s-perf', 'perfectum',
      (b) => sentence(b.subj, b.aux, b.rest, b.part),
      (b) => perfNote(b),
      false),
  },
  {
    id: 's-inv', group: 'sentences',
    name: 'Zinnen — Inversie',
    label: 'Sentences · Inversie (tegenwoordige tijd)',
    cards: build('s-inv', 'inversie + tegenwoordige tijd',
      (b) => sentence(b.time, (b.presInv || b.pres), b.subj, b.rest),
      (b) => invNote(b, false),
      true),
  },
  {
    id: 's-invp', group: 'sentences',
    name: 'Zinnen — Inversie + verleden tijd',
    label: 'Sentences · Inversie + verleden tijd',
    cards: build('s-invp', 'inversie + verleden tijd',
      (b) => sentence(b.time, b.imp, b.subj, b.rest),
      (b) => invNote(b, true),
      true),
  },
  {
    id: 's-sep', group: 'sentences',
    name: 'Zinnen — Scheidbare werkwoorden',
    label: 'Sentences · Scheidbare werkwoorden',
    cards: buildSep('scheidbaar werkwoord',
      (b) => sentence(b.subj, b.verb, b.rest, b.sep),
      (b) => `Scheidbaar werkwoord (${b.en}): het voorvoegsel '${b.sep}' splitst af en gaat naar het einde van de zin → ${b.verb} … ${b.sep}.`),
  },
  {
    id: 's-sep-perf', group: 'sentences',
    name: 'Zinnen — Scheidbare werkwoorden (perfectum)',
    label: 'Sentences · Scheidbare werkwoorden (perfectum)',
    cards: buildSep('scheidbaar werkwoord · perfectum',
      (b) => sentence(b.subj, b.aux, b.rest, b.part),
      (b) => `Scheidbaar werkwoord in de perfectum: -ge- komt tussen het voorvoegsel '${b.sep}' en de stam → ${b.part}. Hulpwerkwoord: ${sepAuxName(b.aux)}. (${b.en})`),
  },
];
