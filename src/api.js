const TOKEN_KEY = 'dutch-tracker-token';

export class AuthError extends Error {}
export class ConflictError extends Error {
  constructor(rev, doc) {
    super('Conflict');
    this.rev = rev;
    this.doc = doc;
  }
}
export class NetworkError extends Error {}

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(path, { ...opts, headers });
  } catch (e) {
    throw new NetworkError(e.message);
  }
  if (res.status === 401) throw new AuthError('Unauthorized');
  return res;
}

export async function fetchState() {
  const res = await apiFetch('/api/state');
  if (!res.ok) throw new NetworkError(`HTTP ${res.status}`);
  return res.json(); // { rev, doc }
}

export async function saveStateRemote(doc, rev) {
  const res = await apiFetch('/api/state', {
    method: 'PUT',
    headers: { 'If-Match': String(rev) },
    body: JSON.stringify({ doc }),
  });
  if (res.status === 409) {
    const body = await res.json();
    throw new ConflictError(body.rev, body.doc);
  }
  if (!res.ok) throw new NetworkError(`HTTP ${res.status}`);
  return res.json(); // { rev }
}
