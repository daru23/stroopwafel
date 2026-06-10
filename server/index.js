import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { timingSafeEqual } from 'node:crypto';
import { getState, putState } from './db.js';
import { validateImport, planMerge, toExport } from '../src/shared/merge.js';

const PORT = Number(process.env.PORT || 3000);
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  console.error('API_TOKEN env var is required');
  process.exit(1);
}

function tokenMatches(provided) {
  const a = Buffer.from(String(provided));
  const b = Buffer.from(API_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

// Auth for everything else under /api
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/health') return next();
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !tokenMatches(token)) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  return next();
});

app.get('/api/state', (c) => c.json(getState()));

app.put('/api/state', async (c) => {
  const ifMatch = c.req.header('If-Match');
  if (ifMatch == null || ifMatch === '') {
    return c.json({ error: 'If-Match header required' }, 412);
  }
  const expectedRev = Number(ifMatch);
  if (!Number.isInteger(expectedRev)) {
    return c.json({ error: 'If-Match must be an integer revision' }, 412);
  }
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }
  if (!body || typeof body.doc !== 'object' || body.doc === null) {
    return c.json({ error: 'body must be { doc }' }, 400);
  }
  const result = putState(body.doc, expectedRev);
  if (result.conflict) return c.json(result.conflict, 409);
  return c.json({ rev: result.rev });
});

app.post('/api/import', async (c) => {
  let imp;
  try {
    imp = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }
  const check = validateImport(imp);
  if (!check.ok) return c.json({ error: check.error }, 400);

  // Retry on the (unlikely) concurrent-write conflict; merge is cheap.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { rev, doc } = getState();
    const { state, summary } = planMerge(doc, imp);
    const result = putState(state, rev);
    if (!result.conflict) return c.json({ rev: result.rev, summary });
  }
  return c.json({ error: 'conflict, retry' }, 409);
});

app.get('/api/export', (c) => {
  const { doc } = getState();
  return c.json(toExport(doc));
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API listening on :${PORT}`);
});
