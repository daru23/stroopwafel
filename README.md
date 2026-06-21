# Nederlands — Dutch Study Tracker

A personal dashboard for tracking your Dutch (A2) studies: grammar modules, vocabulary word lists, quiz scores, notes, and spaced-repetition review reminders. Progress syncs across browsers via a lightweight API backed by SQLite.

Built with React + Vite (frontend) and Hono + better-sqlite3 (API).

## Getting started (local dev)

Requires Node.js 18+.

```bash
# Frontend
npm install
npm run dev

# API server (separate terminal)
cd server && npm install
API_TOKEN=mytoken DB_PATH=/tmp/tracker.db node index.js
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to `localhost:3000`.

Enter your token in the **Sync token** gate that appears on first load. Click **Use offline** to skip sync and work from local cache only.

Other frontend commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Running with Docker Compose

Copy `.env.example` to `.env`, then set a token and optional port:

```bash
cp .env.example .env
echo "API_TOKEN=$(openssl rand -hex 32)" >> .env
docker compose up --build
```

Open http://localhost:8080. Data persists in a named Docker volume (`tracker-data`); it survives container restarts and rebuilds.

The API container is not published externally — Caddy proxies `/api/*` internally.

### Without Compose (two images)

```bash
# Build
docker build --target web -t dutch-tracker-web .
docker build --target api -t dutch-tracker-api .

# Run (share the same network so Caddy can reach the api container)
docker network create dutch-tracker
docker run -d --network dutch-tracker --name api \
  -e API_TOKEN=mytoken -e DB_PATH=/data/tracker.db \
  -v tracker-data:/data dutch-tracker-api
docker run -d --network dutch-tracker -p 8080:80 dutch-tracker-web
```

## How to use

The app starts with demo data (five A2 grammar modules). When you're ready to start fresh, open **⚙ Settings** → **Clear all data**.

### Overview

Your daily landing page:

- **Stat cards** — module count, total quizzes, overall average score, and your streak.
- **Due for review** — modules the spaced-repetition schedule says to revisit today.
- **Recent quizzes** — your latest attempts across all modules.

### Modules

One module per grammar topic (perfectum, er/hier/daar, bijzin word order, …).

- **+ New module** — give it a name, pick tags (grammar, vocab, listening, speaking), and optionally add notes.
- Cards show quiz count, word count, last review time, tags, and an average-score bar. A **Due** pill means it's time to review.
- Use the search box or sidebar tag filters to narrow the list.

### Module detail

Click any module card to open it:

- **Log a score** — record a raw result (e.g. 8/10) with an optional note after any self-test.
- **Quiz history** — every attempt with date and score. Delete entries with ×.
- **Notes & journal** — free-form notes that save automatically on blur.
- **Vocabulary** — word list per module (Dutch / English / example sentence). Add, edit inline, or delete. Toggle **Hide translations** to self-test.
- **SRS banner** — shows the next due date and lets you **Mark reviewed** without logging a score.

### General quizzes

For drills that span multiple topics: pick modules, log one score for the whole set. History shows which modules each quiz covered.

### Flashcards

Practice vocabulary Dutch → English. Two modes:

- **By theme** — pick a single chapter and study it
- **All themes** — shuffle everything together

For each mode, choose a subset size with the chips (`10 / 20 / 50 / All`) or a custom number. In the session, click the card or press **Space** to flip; then **Got it** (`1`) or **Didn't know** (`2`). At the end you see your percentage and a list of missed cards. Per-card stats sync across browsers along with the rest of your state.

### Spaced repetition

Review intervals adapt to your average score per module:

| Average score | Review cycle |
|---|---|
| ≥ 90% | every 14 days |
| ≥ 75% | every 7 days |
| ≥ 60% | every 3 days |
| below 60% (or never quizzed) | every day |

### Settings (⚙ bottom-right)

- **Color theme** — three palettes: **Calm Focus**, **Warm Momentum**, **Dutch Delft**
- **Export JSON** — download all your data as a portable JSON file
- **Import JSON** — bulk-add modules, vocabulary, and quiz history from a JSON file
- **Reset to demo data** — restore the seeded example modules
- **Clear all data** — wipe everything and start empty

## Import / Export format

See [docs/import-format.md](docs/import-format.md) for the full schema, merge semantics, and `curl` examples for the server-side import endpoint.

Quick example — bulk-add vocabulary to an existing module:

```json
{
  "format": "dutch-tracker-import",
  "version": 2,
  "modules": [{
    "name": "De/Het woorden",
    "vocab": [
      { "nl": "de fiets", "en": "the bicycle" },
      { "nl": "het station", "en": "the station" }
    ]
  }]
}
```

## Adding more flashcard themes

Flashcards are static data in [src/flashcards/themes.js](src/flashcards/themes.js). To add a new theme, append an object to the `THEMES` array:

```js
{
  id: 't8',
  name: 'Werk',
  label: 'Theme 8 · Werk (Work)',
  cards: [
    { nl: 'baan', article: 'de', en: 'job' },
    { nl: 'sollicitatie', article: 'de', en: 'job application' },
    // …
  ],
}
```

Card ids are auto-generated from theme + Dutch slug (`t8:baan`), so adding cards to an existing theme keeps your progress on the unchanged ones. Each card supports `nl` (required), `en` (required), and optional `article` (`de` / `het`) and `example`.

Then rebuild the web image and re-deploy — see [deploy/README.md](deploy/README.md#re-deploy-after-image-update).

## Sync across browsers

The app talks to the API with a shared-secret token (`API_TOKEN`). Enter the token once in the **Sync token** gate; it's stored in `localStorage`. Changes sync automatically (debounced 800 ms). On conflict (two tabs editing simultaneously), the server's version wins and a toast notifies you. When the server is unreachable, an **Offline** banner appears and changes are saved locally until the next successful sync.

## Deployment with Ansible

See [deploy/README.md](deploy/README.md) for the full Ansible setup. The playbook deploys to any server that already has Docker installed, pulls images from GHCR, and is idempotent (re-running it is safe).

## CI: building and pushing images

On a `v*` tag or manual dispatch, the [build workflow](.github/workflows/build.yml) builds both images and pushes them to GHCR under `ghcr.io/OWNER/dutch-tracker-{web,api}`.

### Push manually (from a Mac to an x86_64 server)

Requires a GitHub PAT with `write:packages` ([create one](https://github.com/settings/tokens/new?scopes=write:packages,read:packages)) and one-time `docker login`:

```bash
echo 'YOUR_PAT' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Use buildx + --platform when your Mac is arm64 but the server is x86_64
docker buildx build --platform linux/amd64 --target web \
  -t ghcr.io/YOUR_GITHUB_USERNAME/dutch-tracker-web:latest --push .
docker buildx build --platform linux/amd64 --target api \
  -t ghcr.io/YOUR_GITHUB_USERNAME/dutch-tracker-api:latest --push .
```

If GHCR packages are private, make them public after the first push (see [deploy/README.md](deploy/README.md#building-images)) or configure the server to log in.

## Data storage

| Storage | Key | Purpose |
|---|---|---|
| Server SQLite | `/data/tracker.db` | Source of truth, synced across browsers. State document version 3 (modules, generalQuizzes, vocab per module, flashcardStats per card) |
| Browser localStorage | `dutch-tracker-v2` | Offline cache, survives page reload. Migrated to current doc version on load |
| Browser localStorage | `dutch-tracker-token` | API token (not sent to any third party) |

### Backups

The server-side SQLite file lives in the Docker named volume `dutch-tracker_tracker-data`. You can either snapshot the volume directly or use the `/api/export` endpoint:

```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_DOMAIN/api/export > tracker-$(date +%F).json
```

Restore by importing the JSON in **⚙ Settings → Import JSON** or `POST`ing it to `/api/import`. See [deploy/README.md](deploy/README.md#backups) for volume-level snapshot/restore commands.

## Known limitations

- The streak and week dots are static demo values — not yet wired to actual study days.
- Quizzes are logged manually; the app doesn't generate quiz questions.
