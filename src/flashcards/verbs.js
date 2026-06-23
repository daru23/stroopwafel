// A2 Dutch verbs with conjugations, curated for the Verbs practice themes.
// Every verb carries all three forms so the present / imperfectum / participle
// themes cover the exact same verb set:
//   inf     — infinitive (shown as the prompt)
//   en      — English meaning (shown as a hint on the answer side)
//   present — hij/zij/het present form (regular stem+t even for strong verbs;
//             only a handful of verbs are irregular in the present)
//   imp     — imperfectum "singular / plural" (the matcher accepts either)
//   part    — voltooid deelwoord (participle)
//   aux     — perfectum auxiliary: 'hebben' | 'zijn' | 'hebben/zijn'
//
// Note: 'zullen' is intentionally excluded — it has no participle, so it can't
// appear in all three themes.

const VERBS = [
  // --- auxiliaries, modals & verbs with an irregular present ---
  { inf: 'zijn', en: 'to be', present: 'is', imp: 'was / waren', part: 'geweest', aux: 'zijn' },
  { inf: 'hebben', en: 'to have', present: 'heeft', imp: 'had / hadden', part: 'gehad', aux: 'hebben' },
  { inf: 'kunnen', en: 'can / to be able to', present: 'kan', imp: 'kon / konden', part: 'gekund', aux: 'hebben' },
  { inf: 'mogen', en: 'may / to be allowed to', present: 'mag', imp: 'mocht / mochten', part: 'gemogen', aux: 'hebben' },
  { inf: 'moeten', en: 'must / to have to', present: 'moet', imp: 'moest / moesten', part: 'gemoeten', aux: 'hebben' },
  { inf: 'willen', en: 'to want', present: 'wil', imp: 'wilde / wilden', part: 'gewild', aux: 'hebben' },
  { inf: 'gaan', en: 'to go', present: 'gaat', imp: 'ging / gingen', part: 'gegaan', aux: 'zijn' },
  { inf: 'staan', en: 'to stand', present: 'staat', imp: 'stond / stonden', part: 'gestaan', aux: 'hebben' },
  { inf: 'doen', en: 'to do', present: 'doet', imp: 'deed / deden', part: 'gedaan', aux: 'hebben' },
  { inf: 'zien', en: 'to see', present: 'ziet', imp: 'zag / zagen', part: 'gezien', aux: 'hebben' },
  { inf: 'slaan', en: 'to hit', present: 'slaat', imp: 'sloeg / sloegen', part: 'geslagen', aux: 'hebben' },
  { inf: 'komen', en: 'to come', present: 'komt', imp: 'kwam / kwamen', part: 'gekomen', aux: 'zijn' },
  { inf: 'worden', en: 'to become', present: 'wordt', imp: 'werd / werden', part: 'geworden', aux: 'zijn' },

  // --- strong / irregular (regular present: stem + t) ---
  { inf: 'weten', en: 'to know', present: 'weet', imp: 'wist / wisten', part: 'geweten', aux: 'hebben' },
  { inf: 'geven', en: 'to give', present: 'geeft', imp: 'gaf / gaven', part: 'gegeven', aux: 'hebben' },
  { inf: 'nemen', en: 'to take', present: 'neemt', imp: 'nam / namen', part: 'genomen', aux: 'hebben' },
  { inf: 'eten', en: 'to eat', present: 'eet', imp: 'at / aten', part: 'gegeten', aux: 'hebben' },
  { inf: 'lezen', en: 'to read', present: 'leest', imp: 'las / lazen', part: 'gelezen', aux: 'hebben' },
  { inf: 'spreken', en: 'to speak', present: 'spreekt', imp: 'sprak / spraken', part: 'gesproken', aux: 'hebben' },
  { inf: 'steken', en: 'to stab / put', present: 'steekt', imp: 'stak / staken', part: 'gestoken', aux: 'hebben' },
  { inf: 'breken', en: 'to break', present: 'breekt', imp: 'brak / braken', part: 'gebroken', aux: 'hebben/zijn' },
  { inf: 'drinken', en: 'to drink', present: 'drinkt', imp: 'dronk / dronken', part: 'gedronken', aux: 'hebben' },
  { inf: 'zingen', en: 'to sing', present: 'zingt', imp: 'zong / zongen', part: 'gezongen', aux: 'hebben' },
  { inf: 'winnen', en: 'to win', present: 'wint', imp: 'won / wonnen', part: 'gewonnen', aux: 'hebben' },
  { inf: 'beginnen', en: 'to begin', present: 'begint', imp: 'begon / begonnen', part: 'begonnen', aux: 'zijn' },
  { inf: 'zwemmen', en: 'to swim', present: 'zwemt', imp: 'zwom / zwommen', part: 'gezwommen', aux: 'hebben/zijn' },
  { inf: 'vinden', en: 'to find', present: 'vindt', imp: 'vond / vonden', part: 'gevonden', aux: 'hebben' },
  { inf: 'zitten', en: 'to sit', present: 'zit', imp: 'zat / zaten', part: 'gezeten', aux: 'hebben' },
  { inf: 'liggen', en: 'to lie (down)', present: 'ligt', imp: 'lag / lagen', part: 'gelegen', aux: 'hebben' },
  { inf: 'schrijven', en: 'to write', present: 'schrijft', imp: 'schreef / schreven', part: 'geschreven', aux: 'hebben' },
  { inf: 'blijven', en: 'to stay', present: 'blijft', imp: 'bleef / bleven', part: 'gebleven', aux: 'zijn' },
  { inf: 'kijken', en: 'to look / watch', present: 'kijkt', imp: 'keek / keken', part: 'gekeken', aux: 'hebben' },
  { inf: 'krijgen', en: 'to get / receive', present: 'krijgt', imp: 'kreeg / kregen', part: 'gekregen', aux: 'hebben' },
  { inf: 'rijden', en: 'to drive / ride', present: 'rijdt', imp: 'reed / reden', part: 'gereden', aux: 'hebben/zijn' },
  { inf: 'snijden', en: 'to cut', present: 'snijdt', imp: 'sneed / sneden', part: 'gesneden', aux: 'hebben' },
  { inf: 'stijgen', en: 'to rise', present: 'stijgt', imp: 'steeg / stegen', part: 'gestegen', aux: 'zijn' },
  { inf: 'wijzen', en: 'to point', present: 'wijst', imp: 'wees / wezen', part: 'gewezen', aux: 'hebben' },
  { inf: 'verliezen', en: 'to lose', present: 'verliest', imp: 'verloor / verloren', part: 'verloren', aux: 'hebben' },
  { inf: 'kiezen', en: 'to choose', present: 'kiest', imp: 'koos / kozen', part: 'gekozen', aux: 'hebben' },
  { inf: 'genieten', en: 'to enjoy', present: 'geniet', imp: 'genoot / genoten', part: 'genoten', aux: 'hebben' },
  { inf: 'schieten', en: 'to shoot', present: 'schiet', imp: 'schoot / schoten', part: 'geschoten', aux: 'hebben' },
  { inf: 'sluiten', en: 'to close', present: 'sluit', imp: 'sloot / sloten', part: 'gesloten', aux: 'hebben' },
  { inf: 'bieden', en: 'to offer', present: 'biedt', imp: 'bood / boden', part: 'geboden', aux: 'hebben' },
  { inf: 'vliegen', en: 'to fly', present: 'vliegt', imp: 'vloog / vlogen', part: 'gevlogen', aux: 'hebben/zijn' },
  { inf: 'trekken', en: 'to pull', present: 'trekt', imp: 'trok / trokken', part: 'getrokken', aux: 'hebben' },
  { inf: 'bewegen', en: 'to move', present: 'beweegt', imp: 'bewoog / bewogen', part: 'bewogen', aux: 'hebben' },
  { inf: 'wegen', en: 'to weigh', present: 'weegt', imp: 'woog / wogen', part: 'gewogen', aux: 'hebben' },
  { inf: 'lopen', en: 'to walk', present: 'loopt', imp: 'liep / liepen', part: 'gelopen', aux: 'hebben/zijn' },
  { inf: 'roepen', en: 'to call / shout', present: 'roept', imp: 'riep / riepen', part: 'geroepen', aux: 'hebben' },
  { inf: 'slapen', en: 'to sleep', present: 'slaapt', imp: 'sliep / sliepen', part: 'geslapen', aux: 'hebben' },
  { inf: 'laten', en: 'to let', present: 'laat', imp: 'liet / lieten', part: 'gelaten', aux: 'hebben' },
  { inf: 'houden', en: 'to hold / keep', present: 'houdt', imp: 'hield / hielden', part: 'gehouden', aux: 'hebben' },
  { inf: 'vallen', en: 'to fall', present: 'valt', imp: 'viel / vielen', part: 'gevallen', aux: 'zijn' },
  { inf: 'dragen', en: 'to carry / wear', present: 'draagt', imp: 'droeg / droegen', part: 'gedragen', aux: 'hebben' },
  { inf: 'vergeten', en: 'to forget', present: 'vergeet', imp: 'vergat / vergaten', part: 'vergeten', aux: 'zijn' },
  { inf: 'hangen', en: 'to hang', present: 'hangt', imp: 'hing / hingen', part: 'gehangen', aux: 'hebben' },
  { inf: 'vangen', en: 'to catch', present: 'vangt', imp: 'ving / vingen', part: 'gevangen', aux: 'hebben' },
  { inf: 'helpen', en: 'to help', present: 'helpt', imp: 'hielp / hielpen', part: 'geholpen', aux: 'hebben' },
  { inf: 'lachen', en: 'to laugh', present: 'lacht', imp: 'lachte / lachten', part: 'gelachen', aux: 'hebben' },
  { inf: 'wassen', en: 'to wash', present: 'wast', imp: 'waste / wasten', part: 'gewassen', aux: 'hebben' },

  // --- common "mixed" verbs (weak imperfectum, irregular spelling) ---
  { inf: 'brengen', en: 'to bring', present: 'brengt', imp: 'bracht / brachten', part: 'gebracht', aux: 'hebben' },
  { inf: 'denken', en: 'to think', present: 'denkt', imp: 'dacht / dachten', part: 'gedacht', aux: 'hebben' },
  { inf: 'kopen', en: 'to buy', present: 'koopt', imp: 'kocht / kochten', part: 'gekocht', aux: 'hebben' },
  { inf: 'zoeken', en: 'to search', present: 'zoekt', imp: 'zocht / zochten', part: 'gezocht', aux: 'hebben' },
  { inf: 'verkopen', en: 'to sell', present: 'verkoopt', imp: 'verkocht / verkochten', part: 'verkocht', aux: 'hebben' },
  { inf: 'vragen', en: 'to ask', present: 'vraagt', imp: 'vroeg / vroegen', part: 'gevraagd', aux: 'hebben' },
  { inf: 'zeggen', en: 'to say', present: 'zegt', imp: 'zei / zeiden', part: 'gezegd', aux: 'hebben' },
  { inf: 'begrijpen', en: 'to understand', present: 'begrijpt', imp: 'begreep / begrepen', part: 'begrepen', aux: 'hebben' },

  // --- weak / regular (stem+te/de, ge+stem+t/d) ---
  { inf: 'werken', en: 'to work', present: 'werkt', imp: 'werkte / werkten', part: 'gewerkt', aux: 'hebben' },
  { inf: 'maken', en: 'to make', present: 'maakt', imp: 'maakte / maakten', part: 'gemaakt', aux: 'hebben' },
  { inf: 'wonen', en: 'to live (reside)', present: 'woont', imp: 'woonde / woonden', part: 'gewoond', aux: 'hebben' },
  { inf: 'leren', en: 'to learn', present: 'leert', imp: 'leerde / leerden', part: 'geleerd', aux: 'hebben' },
  { inf: 'spelen', en: 'to play', present: 'speelt', imp: 'speelde / speelden', part: 'gespeeld', aux: 'hebben' },
  { inf: 'praten', en: 'to talk', present: 'praat', imp: 'praatte / praatten', part: 'gepraat', aux: 'hebben' },
  { inf: 'luisteren', en: 'to listen', present: 'luistert', imp: 'luisterde / luisterden', part: 'geluisterd', aux: 'hebben' },
  { inf: 'wachten', en: 'to wait', present: 'wacht', imp: 'wachtte / wachtten', part: 'gewacht', aux: 'hebben' },
  { inf: 'betalen', en: 'to pay', present: 'betaalt', imp: 'betaalde / betaalden', part: 'betaald', aux: 'hebben' },
  { inf: 'bestellen', en: 'to order', present: 'bestelt', imp: 'bestelde / bestelden', part: 'besteld', aux: 'hebben' },
  { inf: 'koken', en: 'to cook', present: 'kookt', imp: 'kookte / kookten', part: 'gekookt', aux: 'hebben' },
  { inf: 'gebruiken', en: 'to use', present: 'gebruikt', imp: 'gebruikte / gebruikten', part: 'gebruikt', aux: 'hebben' },
  { inf: 'kennen', en: 'to know (be acquainted)', present: 'kent', imp: 'kende / kenden', part: 'gekend', aux: 'hebben' },
  { inf: 'reizen', en: 'to travel', present: 'reist', imp: 'reisde / reisden', part: 'gereisd', aux: 'hebben/zijn' },
];

// Present, imperfectum and participle themes all map over the same VERBS list,
// so they cover the identical verb set.
export const VERB_THEMES = [
  {
    id: 'v-pres',
    name: 'Werkwoorden — Tegenwoordige tijd',
    label: 'Verbs · Tegenwoordige tijd (present)',
    group: 'verbs',
    cards: VERBS.map((v) => ({ nl: v.inf, en: v.present, prompt: 'present · hij/zij/het', gloss: v.en })),
  },
  {
    id: 'v-imp',
    name: 'Werkwoorden — Imperfectum',
    label: 'Verbs · Imperfectum (simple past)',
    group: 'verbs',
    cards: VERBS.map((v) => ({ nl: v.inf, en: v.imp, prompt: 'imperfectum', gloss: v.en })),
  },
  {
    id: 'v-part',
    name: 'Werkwoorden — Voltooid deelwoord',
    label: 'Verbs · Voltooid deelwoord (participle)',
    group: 'verbs',
    cards: VERBS.map((v) => ({ nl: v.inf, en: v.part, prompt: 'voltooid deelwoord', gloss: `${v.aux} · ${v.en}` })),
  },
];

export const VERB_COUNT = VERBS.length;
