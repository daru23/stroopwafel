// A2 Dutch verbs with conjugations, curated for the Verbs practice themes.
// Each entry:
//   inf  — infinitive (shown as the prompt)
//   en   — English meaning (shown as a hint on the answer side)
//   imp  — imperfectum "singular / plural" (the matcher accepts either)
//   part — voltooid deelwoord (participle); null when the verb has none (zullen)
//   aux  — perfectum auxiliary: 'hebben' | 'zijn' | 'hebben/zijn'
//   present — only for verbs whose present tense isn't the plain stem/stem+t rule:
//             { form } is the hij/zij/het form, { paradigm } the full set for the back

const VERBS = [
  // --- auxiliaries, modals & highly irregular ---
  { inf: 'zijn', en: 'to be', imp: 'was / waren', part: 'geweest', aux: 'zijn', present: { form: 'is', paradigm: 'ik ben · jij bent · hij is · wij zijn' } },
  { inf: 'hebben', en: 'to have', imp: 'had / hadden', part: 'gehad', aux: 'hebben', present: { form: 'heeft', paradigm: 'ik heb · jij hebt · hij heeft · wij hebben' } },
  { inf: 'kunnen', en: 'can / to be able to', imp: 'kon / konden', part: 'gekund', aux: 'hebben', present: { form: 'kan', paradigm: 'ik kan · jij kunt · hij kan · wij kunnen' } },
  { inf: 'mogen', en: 'may / to be allowed to', imp: 'mocht / mochten', part: 'gemogen', aux: 'hebben', present: { form: 'mag', paradigm: 'ik mag · jij mag · hij mag · wij mogen' } },
  { inf: 'moeten', en: 'must / to have to', imp: 'moest / moesten', part: 'gemoeten', aux: 'hebben', present: { form: 'moet', paradigm: 'ik moet · jij moet · hij moet · wij moeten' } },
  { inf: 'willen', en: 'to want', imp: 'wilde / wilden', part: 'gewild', aux: 'hebben', present: { form: 'wil', paradigm: 'ik wil · jij wilt · hij wil · wij willen' } },
  { inf: 'zullen', en: 'shall / will', imp: 'zou / zouden', part: null, aux: 'hebben', present: { form: 'zal', paradigm: 'ik zal · jij zult · hij zal · wij zullen' } },
  { inf: 'gaan', en: 'to go', imp: 'ging / gingen', part: 'gegaan', aux: 'zijn', present: { form: 'gaat', paradigm: 'ik ga · jij gaat · hij gaat · wij gaan' } },
  { inf: 'staan', en: 'to stand', imp: 'stond / stonden', part: 'gestaan', aux: 'hebben', present: { form: 'staat', paradigm: 'ik sta · jij staat · hij staat · wij staan' } },
  { inf: 'doen', en: 'to do', imp: 'deed / deden', part: 'gedaan', aux: 'hebben', present: { form: 'doet', paradigm: 'ik doe · jij doet · hij doet · wij doen' } },
  { inf: 'zien', en: 'to see', imp: 'zag / zagen', part: 'gezien', aux: 'hebben', present: { form: 'ziet', paradigm: 'ik zie · jij ziet · hij ziet · wij zien' } },
  { inf: 'slaan', en: 'to hit', imp: 'sloeg / sloegen', part: 'geslagen', aux: 'hebben', present: { form: 'slaat', paradigm: 'ik sla · jij slaat · hij slaat · wij slaan' } },
  { inf: 'komen', en: 'to come', imp: 'kwam / kwamen', part: 'gekomen', aux: 'zijn', present: { form: 'komt', paradigm: 'ik kom · jij komt · hij komt · wij komen' } },
  { inf: 'worden', en: 'to become', imp: 'werd / werden', part: 'geworden', aux: 'zijn', present: { form: 'wordt', paradigm: 'ik word · jij wordt · hij wordt · wij worden' } },

  // --- strong / irregular (regular present, so no present field) ---
  { inf: 'weten', en: 'to know', imp: 'wist / wisten', part: 'geweten', aux: 'hebben' },
  { inf: 'geven', en: 'to give', imp: 'gaf / gaven', part: 'gegeven', aux: 'hebben' },
  { inf: 'nemen', en: 'to take', imp: 'nam / namen', part: 'genomen', aux: 'hebben' },
  { inf: 'eten', en: 'to eat', imp: 'at / aten', part: 'gegeten', aux: 'hebben' },
  { inf: 'lezen', en: 'to read', imp: 'las / lazen', part: 'gelezen', aux: 'hebben' },
  { inf: 'spreken', en: 'to speak', imp: 'sprak / spraken', part: 'gesproken', aux: 'hebben' },
  { inf: 'steken', en: 'to stab / put', imp: 'stak / staken', part: 'gestoken', aux: 'hebben' },
  { inf: 'breken', en: 'to break', imp: 'brak / braken', part: 'gebroken', aux: 'hebben/zijn' },
  { inf: 'drinken', en: 'to drink', imp: 'dronk / dronken', part: 'gedronken', aux: 'hebben' },
  { inf: 'zingen', en: 'to sing', imp: 'zong / zongen', part: 'gezongen', aux: 'hebben' },
  { inf: 'winnen', en: 'to win', imp: 'won / wonnen', part: 'gewonnen', aux: 'hebben' },
  { inf: 'beginnen', en: 'to begin', imp: 'begon / begonnen', part: 'begonnen', aux: 'zijn' },
  { inf: 'zwemmen', en: 'to swim', imp: 'zwom / zwommen', part: 'gezwommen', aux: 'hebben/zijn' },
  { inf: 'vinden', en: 'to find', imp: 'vond / vonden', part: 'gevonden', aux: 'hebben' },
  { inf: 'zitten', en: 'to sit', imp: 'zat / zaten', part: 'gezeten', aux: 'hebben' },
  { inf: 'liggen', en: 'to lie (down)', imp: 'lag / lagen', part: 'gelegen', aux: 'hebben' },
  { inf: 'schrijven', en: 'to write', imp: 'schreef / schreven', part: 'geschreven', aux: 'hebben' },
  { inf: 'blijven', en: 'to stay', imp: 'bleef / bleven', part: 'gebleven', aux: 'zijn' },
  { inf: 'kijken', en: 'to look / watch', imp: 'keek / keken', part: 'gekeken', aux: 'hebben' },
  { inf: 'krijgen', en: 'to get / receive', imp: 'kreeg / kregen', part: 'gekregen', aux: 'hebben' },
  { inf: 'rijden', en: 'to drive / ride', imp: 'reed / reden', part: 'gereden', aux: 'hebben/zijn' },
  { inf: 'snijden', en: 'to cut', imp: 'sneed / sneden', part: 'gesneden', aux: 'hebben' },
  { inf: 'stijgen', en: 'to rise', imp: 'steeg / stegen', part: 'gestegen', aux: 'zijn' },
  { inf: 'wijzen', en: 'to point', imp: 'wees / wezen', part: 'gewezen', aux: 'hebben' },
  { inf: 'verliezen', en: 'to lose', imp: 'verloor / verloren', part: 'verloren', aux: 'hebben' },
  { inf: 'kiezen', en: 'to choose', imp: 'koos / kozen', part: 'gekozen', aux: 'hebben' },
  { inf: 'genieten', en: 'to enjoy', imp: 'genoot / genoten', part: 'genoten', aux: 'hebben' },
  { inf: 'schieten', en: 'to shoot', imp: 'schoot / schoten', part: 'geschoten', aux: 'hebben' },
  { inf: 'sluiten', en: 'to close', imp: 'sloot / sloten', part: 'gesloten', aux: 'hebben' },
  { inf: 'bieden', en: 'to offer', imp: 'bood / boden', part: 'geboden', aux: 'hebben' },
  { inf: 'vliegen', en: 'to fly', imp: 'vloog / vlogen', part: 'gevlogen', aux: 'hebben/zijn' },
  { inf: 'trekken', en: 'to pull', imp: 'trok / trokken', part: 'getrokken', aux: 'hebben' },
  { inf: 'bewegen', en: 'to move', imp: 'bewoog / bewogen', part: 'bewogen', aux: 'hebben' },
  { inf: 'wegen', en: 'to weigh', imp: 'woog / wogen', part: 'gewogen', aux: 'hebben' },
  { inf: 'lopen', en: 'to walk', imp: 'liep / liepen', part: 'gelopen', aux: 'hebben/zijn' },
  { inf: 'roepen', en: 'to call / shout', imp: 'riep / riepen', part: 'geroepen', aux: 'hebben' },
  { inf: 'slapen', en: 'to sleep', imp: 'sliep / sliepen', part: 'geslapen', aux: 'hebben' },
  { inf: 'laten', en: 'to let', imp: 'liet / lieten', part: 'gelaten', aux: 'hebben' },
  { inf: 'houden', en: 'to hold / keep', imp: 'hield / hielden', part: 'gehouden', aux: 'hebben' },
  { inf: 'vallen', en: 'to fall', imp: 'viel / vielen', part: 'gevallen', aux: 'zijn' },
  { inf: 'dragen', en: 'to carry / wear', imp: 'droeg / droegen', part: 'gedragen', aux: 'hebben' },
  { inf: 'vergeten', en: 'to forget', imp: 'vergat / vergaten', part: 'vergeten', aux: 'zijn' },
  { inf: 'hangen', en: 'to hang', imp: 'hing / hingen', part: 'gehangen', aux: 'hebben' },
  { inf: 'vangen', en: 'to catch', imp: 'ving / vingen', part: 'gevangen', aux: 'hebben' },
  { inf: 'helpen', en: 'to help', imp: 'hielp / hielpen', part: 'geholpen', aux: 'hebben' },
  { inf: 'lachen', en: 'to laugh', imp: 'lachte / lachten', part: 'gelachen', aux: 'hebben' },
  { inf: 'wassen', en: 'to wash', imp: 'waste / wasten', part: 'gewassen', aux: 'hebben' },

  // --- common "mixed" verbs (weak imperfectum, irregular spelling) ---
  { inf: 'brengen', en: 'to bring', imp: 'bracht / brachten', part: 'gebracht', aux: 'hebben' },
  { inf: 'denken', en: 'to think', imp: 'dacht / dachten', part: 'gedacht', aux: 'hebben' },
  { inf: 'kopen', en: 'to buy', imp: 'kocht / kochten', part: 'gekocht', aux: 'hebben' },
  { inf: 'zoeken', en: 'to search', imp: 'zocht / zochten', part: 'gezocht', aux: 'hebben' },
  { inf: 'verkopen', en: 'to sell', imp: 'verkocht / verkochten', part: 'verkocht', aux: 'hebben' },
  { inf: 'vragen', en: 'to ask', imp: 'vroeg / vroegen', part: 'gevraagd', aux: 'hebben' },
  { inf: 'zeggen', en: 'to say', imp: 'zei / zeiden', part: 'gezegd', aux: 'hebben' },
  { inf: 'begrijpen', en: 'to understand', imp: 'begreep / begrepen', part: 'begrepen', aux: 'hebben' },

  // --- weak / regular (for contrast with the rule: stem+te/de, ge+stem+t/d) ---
  { inf: 'werken', en: 'to work', imp: 'werkte / werkten', part: 'gewerkt', aux: 'hebben' },
  { inf: 'maken', en: 'to make', imp: 'maakte / maakten', part: 'gemaakt', aux: 'hebben' },
  { inf: 'wonen', en: 'to live (reside)', imp: 'woonde / woonden', part: 'gewoond', aux: 'hebben' },
  { inf: 'leren', en: 'to learn', imp: 'leerde / leerden', part: 'geleerd', aux: 'hebben' },
  { inf: 'spelen', en: 'to play', imp: 'speelde / speelden', part: 'gespeeld', aux: 'hebben' },
  { inf: 'praten', en: 'to talk', imp: 'praatte / praatten', part: 'gepraat', aux: 'hebben' },
  { inf: 'luisteren', en: 'to listen', imp: 'luisterde / luisterden', part: 'geluisterd', aux: 'hebben' },
  { inf: 'wachten', en: 'to wait', imp: 'wachtte / wachtten', part: 'gewacht', aux: 'hebben' },
  { inf: 'betalen', en: 'to pay', imp: 'betaalde / betaalden', part: 'betaald', aux: 'hebben' },
  { inf: 'bestellen', en: 'to order', imp: 'bestelde / bestelden', part: 'besteld', aux: 'hebben' },
  { inf: 'koken', en: 'to cook', imp: 'kookte / kookten', part: 'gekookt', aux: 'hebben' },
  { inf: 'gebruiken', en: 'to use', imp: 'gebruikte / gebruikten', part: 'gebruikt', aux: 'hebben' },
  { inf: 'kennen', en: 'to know (be acquainted)', imp: 'kende / kenden', part: 'gekend', aux: 'hebben' },
  { inf: 'reizen', en: 'to travel', imp: 'reisde / reisden', part: 'gereisd', aux: 'hebben/zijn' },
];

export const VERB_THEMES = [
  {
    id: 'v-pres',
    name: 'Werkwoorden — Tegenwoordige tijd',
    label: 'Verbs · Tegenwoordige tijd (present)',
    group: 'verbs',
    cards: VERBS.filter((v) => v.present).map((v) => ({
      nl: v.inf,
      en: v.present.form,
      prompt: 'present · hij/zij/het',
      gloss: v.present.paradigm,
    })),
  },
  {
    id: 'v-imp',
    name: 'Werkwoorden — Imperfectum',
    label: 'Verbs · Imperfectum (simple past)',
    group: 'verbs',
    cards: VERBS.map((v) => ({
      nl: v.inf,
      en: v.imp,
      prompt: 'imperfectum',
      gloss: v.en,
    })),
  },
  {
    id: 'v-part',
    name: 'Werkwoorden — Voltooid deelwoord',
    label: 'Verbs · Voltooid deelwoord (participle)',
    group: 'verbs',
    cards: VERBS.filter((v) => v.part).map((v) => ({
      nl: v.inf,
      en: v.part,
      prompt: 'voltooid deelwoord',
      gloss: `${v.aux} · ${v.en}`,
    })),
  },
];
