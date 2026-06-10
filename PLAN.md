# Dutch Study Tracker — Phase 2: Sync backend, Vocabulary, Import/Export, Ansible deploy

## Context

The app is currently a pure-frontend Vite + React SPA persisting to localStorage, served by nginx in Docker. The user wants: (1) progress that syncs across browsers (single user, no accounts), (2) an easy JSON-based way to bulk-add modules, vocabulary, and quizzes, (3) a vocabulary feature (word lists per module), and (4) an Ansible-driven deployment to an existing server using registry-hosted Docker images, fully self-contained so it can't clash with other services.

Decisions confirmed with the user: tiny Node API + SQLite; shared-secret token auth; vocab as word lists per module; images pushed to a registry; **Caddy (not nginx) as the web server**.

Once this plan is accepted, it is also written to `PLAN.md` in the repo root (first implementation step).

## Architecture decisions

1. **Two containers behind Caddy.** A `caddy` service serves the built SPA (`dist/`) and reverse-proxies `/api/*` to an `api` service (Node). nginx is removed everywhere. Caddy config is a small `Caddyfile` (SPA fallback via `try_files`, `reverse_proxy /api/* api:3000`).
2. **Single state-document API** — `GET/PUT /api/state` with integer `rev` + `If-Match` header for optimistic concurrency (`409` returns current doc; client adopts it and shows a toast). Fine-grained REST buys nothing for one user whose state is already one JSON object; all existing App.jsx mutations stay untouched.
3. **Hono + better-sqlite3**, one table, one row: `state(id=1, rev, doc TEXT, updated_at)`. better-sqlite3 over `node:sqlite` (still experimental); synchronous is fine for a one-row workload.
4. **Auth** — `API_TOKEN` env var on the api service; `Authorization: Bearer` header; `crypto.timingSafeEqual` compare; token remembered in `localStorage('dutch-tracker-token')`; a `TokenGate` screen on 401.
5. **State v2** — every module gains `vocab: []` with entries `{id, nl, en, example}`. Shared `migrate()` (v1→v2) used by server bootstrap, app load path, and seed.

## State v2 & import format

```js
// src/shared/migrate.js — v1→v2: add vocab: [] to each module, version: 2
// vocab entry: { id, nl, en, example }  (example optional)
```

Import/export JSON (documented in `docs/import-format.md`, round-trippable):

```json
{
  "format": "dutch-tracker-import",
  "version": 2,
  "modules": [{
    "id": "m-optional", "name": "De/Het woorden", "tags": ["vocab"], "notes": "…",
    "vocab": [{ "nl": "de fiets", "en": "the bicycle", "example": "Ik ga met de fiets." }],
    "quizzes": [{ "score": 8, "total": 10, "date": "2026-06-01T10:00:00Z", "note": "" }]
  }],
  "generalQuizzes": [{ "moduleIds": ["m-optional"], "score": 12, "total": 15, "date": "…", "note": "" }]
}
```

Merge semantics (`src/importExport.js`, pure + testable): match modules by `id`, else case-insensitive `name`; matched → shallow-merge metadata, append vocab (dedup by `nl`) and quizzes (dedup by id); unmatched → create with `uid()`; generalQuizzes append (dedup by id). Import UI shows a preview summary ("1 new, 2 merged, +42 vocab") before applying.

## API surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | no | `{ ok: true }` |
| GET | `/api/state` | yes | `{ rev, doc }` (migrated) |
| PUT | `/api/state` | yes | body `{ doc }`, `If-Match: <rev>`; `409 {rev, doc}` on mismatch; `412` if header missing |
| POST | `/api/import` | yes | server-side merge of an import file (curl-friendly) |
| GET | `/api/export` | yes | import-format JSON |

Static SPA (with fallback to index.html) served by Caddy, not the API.

## Milestones

### M1 — Server (`server/`)
- `server/package.json` (hono, @hono/node-server, better-sqlite3)
- `server/index.js` — auth middleware, API routes only (no statics); `PORT` (3000), `DB_PATH` (`/data/tracker.db`)
- `server/db.js` — init, bootstrap empty v2 row, `getState()`, `putState(doc, expectedRev)` in a transaction
- `server/merge.js` — import merge for POST /api/import (mirrors src/importExport.js)
- Reuses `src/shared/migrate.js` (shared between frontend and server)

### M2 — Frontend persistence
- `src/api.js` — token helpers, `fetchState()`, `saveStateRemote(doc, rev)`, typed errors (Auth/Conflict/Network)
- `src/App.jsx` — replace `loadState/saveState` with a synced-state hook: TokenGate on missing/invalid token; GET on mount (spinner); debounced 800 ms PUT with `If-Match`; on 409 adopt server doc + toast; keepalive flush on unload; localStorage kept as offline cache (`dutch-tracker-v2`) with an "offline" banner fallback
- `src/seed.js` — bump to v2 (`vocab: []` on seed modules)
- `vite.config.js` — dev proxy `/api → localhost:3000`

### M3 — Vocabulary
- `src/App.jsx` — `addVocab`/`updateVocab`/`deleteVocab` mutations
- `src/ModuleDetail.jsx` — "Vocabulary" section: table of nl/translation/example, inline add/edit/delete, hide-translations toggle for self-testing, Empty state pointing at import
- `src/ModulesView.jsx` — small vocab-count chip on cards

### M4 — Import/Export
- `src/importExport.js` — `validateImport`, `planMerge` (summary + merged state), `toExport`
- `src/Settings.jsx` — Export JSON (Blob download), Import JSON (file input → validate → preview modal → apply)
- `docs/import-format.md` — schema + curl examples

### M5 — Docker (Caddy + API)
- `Caddyfile` — `:80`, `root * /srv`, `try_files {path} /index.html`, `file_server`, `handle /api/* { reverse_proxy api:3000 }`
- Rewrite `Dockerfile` as two targets (or two Dockerfiles):
  - **web**: build stage (`node:22-alpine`, vite build) → `caddy:2-alpine` runtime with `dist/` at `/srv` + `Caddyfile`
  - **api**: `node:22-alpine`, `npm ci --omit=dev` in `server/` (musl build tools fallback for better-sqlite3), `USER node`, `VOLUME /data`, EXPOSE 3000
- Rewrite `docker-compose.yaml`: project `name: dutch-tracker`; services `web` (`${HOST_PORT:-8080}:80`) and `api` (no published port, internal network only); `API_TOKEN` required on api; named volume `tracker-data:/data`; `restart: unless-stopped` on both
- `.env.example`

### M6 — Ansible (`deploy/ansible/`)
```
deploy/ansible/
  ansible.cfg
  inventory.example.ini
  playbook.yml                 # flat single playbook (no role — project-sized)
  group_vars/all.yml.example   # tracker_web_image, tracker_api_image, tracker_tag,
                               # tracker_host_port, tracker_dir (/opt/dutch-tracker),
                               # tracker_api_token (vault), optional registry creds
  templates/compose.yml.j2
  templates/env.j2             # mode 0600
deploy/README.md
```
Tasks (idempotent, `community.docker` collection): assert docker present (do NOT install — existing server), create dir, optional `docker_login`, template compose + .env, `docker_compose_v2` with `pull: always`, health check via `uri` on `/api/health` through the web port with retries.
Isolation: own compose project + network, named volume, the only published port is `{{ tracker_host_port }}` on the web service; api container stays internal.

### M7 — CI (minimal)
- `.github/workflows/build.yml`: on tag `v*` / manual dispatch → build & push `ghcr.io/<owner>/dutch-tracker-web` and `…-api` `{tag,latest}` using `GITHUB_TOKEN`. Manual `docker build && docker push` documented as alternative.

Order: M1 → M2 → M3 → M4 → M5 → M6; M7 anytime after M5. Update `README.md` at the end; write `PLAN.md` first.

## Files to create
`PLAN.md` · `server/{package.json,index.js,db.js,merge.js}` · `src/{api.js,importExport.js,shared/migrate.js}` · `Caddyfile` · `docs/import-format.md` · `deploy/ansible/{ansible.cfg,inventory.example.ini,playbook.yml,group_vars/all.yml.example,templates/compose.yml.j2,templates/env.j2}` · `deploy/README.md` · `.env.example` · `.github/workflows/build.yml`

## Files to modify
`src/App.jsx` · `src/seed.js` · `src/ModuleDetail.jsx` · `src/Settings.jsx` · `src/ModulesView.jsx` · `vite.config.js` · `Dockerfile` · `docker-compose.yaml` · `README.md`

## Verification
- **API:** curl health; GET without token → 401; PUT with stale `If-Match` → 409 with current doc.
- **Two-browser sync:** compose up locally; Chrome + Firefox on `localhost:8080`, token entered in both; quiz logged in A appears in B; near-simultaneous edits → 409 path adopts server state with toast, no data loss.
- **Caddy routing:** `/` serves the SPA (and deep links like `/anything` fall back to index.html); `/api/health` proxies to the api container.
- **Migration:** seed a v1 doc in localStorage, load offline → modules get `vocab: []`, version 2.
- **Import:** export → clear all → re-import → identical counts; import same vocab file twice → no duplicates; malformed JSON → error shown, state untouched; curl POST /api/import works.
- **Persistence:** `docker compose down && up` → data survives.
- **Deploy:** `ansible-playbook --check --diff` dry-run, then real run; health URL responds; second run reports zero changes (idempotent).
