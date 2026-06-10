import Database from 'better-sqlite3';
import { migrate, emptyDoc } from '../src/shared/migrate.js';

const DB_PATH = process.env.DB_PATH || '/data/tracker.db';

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    rev INTEGER NOT NULL,
    doc TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

if (!db.prepare('SELECT 1 FROM state WHERE id = 1').get()) {
  db.prepare('INSERT INTO state (id, rev, doc, updated_at) VALUES (1, 1, ?, ?)')
    .run(JSON.stringify(emptyDoc()), new Date().toISOString());
}

export function getState() {
  const row = db.prepare('SELECT rev, doc FROM state WHERE id = 1').get();
  return { rev: row.rev, doc: migrate(JSON.parse(row.doc)) };
}

// Returns { rev } on success or { conflict: { rev, doc } } on rev mismatch.
export const putState = db.transaction((doc, expectedRev) => {
  const row = db.prepare('SELECT rev, doc FROM state WHERE id = 1').get();
  if (row.rev !== expectedRev) {
    return { conflict: { rev: row.rev, doc: migrate(JSON.parse(row.doc)) } };
  }
  const rev = row.rev + 1;
  db.prepare('UPDATE state SET rev = ?, doc = ?, updated_at = ? WHERE id = 1')
    .run(rev, JSON.stringify(doc), new Date().toISOString());
  return { rev };
});
