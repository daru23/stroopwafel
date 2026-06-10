# Nederlands — Dutch Study Tracker

A personal dashboard for tracking your Dutch (A2) studies: grammar modules, quiz scores, notes, and spaced-repetition review reminders. Everything is stored locally in your browser — no account, no server.

Built with React + Vite.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Running with Docker

No Node.js needed — the image builds the app and serves it with nginx:

```bash
docker compose up --build
```

Then open http://localhost:8080. To use a different port, change the first number in the `ports` mapping in [docker-compose.yaml](docker-compose.yaml) (e.g. `"3000:80"`).

Or without compose:

```bash
docker build -t dutch-study-tracker .
docker run -p 8080:80 dutch-study-tracker
```

Your data still lives in your browser's localStorage, so it survives container restarts and rebuilds.

## How to use

The app starts with demo data (five A2 grammar modules) so you can explore. When you're ready to start fresh, open **⚙ Settings** (bottom-right) → **Clear all data**.

### Overview

Your daily landing page:

- **Stat cards** — module count, total quizzes logged, overall average score, and your study streak.
- **Due for review** — modules the spaced-repetition schedule says you should revisit today. Click one to open it.
- **Recent quizzes** — your latest attempts across all modules.

### Modules

One module per grammar topic (perfectum, er/hier/daar, bijzin word order, …).

- **+ New module** — give it a name, pick tags (grammar, vocab, listening, speaking), and optionally add notes.
- Each card shows the quiz count, last review time, tags, and an average-score bar. A **Due** pill means it's time to review.
- Use the search box or the tag filters in the sidebar to narrow the list.

### Module detail

Click any module card to open it:

- **Log a score** — after a self-test, textbook exercise, or class quiz, record your raw result (e.g. 8/10) with an optional note about what tripped you up.
- **Quiz history** — every attempt with date, score, and note. Delete entries with ×.
- **Notes & journal** — free-form notes that save automatically when you click away.
- **SRS banner** — tells you when the topic is next due and lets you **Mark reviewed** without logging a score.
- **Edit module** / **Delete this module** — rename, retag, or remove it entirely.

### General quizzes

For drills that span multiple topics:

- **Pick modules** — check the topics you want to combine, or
- **Pick at random** — choose how many and roll the 🎲.
- After the drill, **log one score** for the whole set. History shows which modules each quiz covered — click a module chip to jump to it.

### Spaced repetition

Review intervals adapt to your average score per module:

| Average score | Review cycle |
|---|---|
| ≥ 90% | every 14 days |
| ≥ 75% | every 7 days |
| ≥ 60% | every 3 days |
| below 60% (or never quizzed) | every day |

Anything past its interval shows up as **Due** on the Overview and Modules pages.

### Settings (⚙ bottom-right)

- **Color theme** — three palettes with cognitive intent:
  - **Calm Focus** (default) — blue for concentration, sage for growth
  - **Warm Momentum** — terracotta for motivation, mustard for optimism
  - **Dutch Delft** — Delft blue and Oranje, a heritage cue
- **Reset to demo data** — restore the seeded example modules.
- **Clear all data** — wipe everything and start empty.

## Data & privacy

All data lives in your browser's localStorage under the key `dutch-tracker-v1`. Clearing site data in your browser deletes it. There is no sync or export yet.

## Known limitations

- The streak and week dots are static demo values — not yet wired to actual study days.
- Quizzes are logged manually; the app doesn't generate quiz questions.
