/**
 * API contract smoke test — the mobile app's client (src/services/api.ts)
 * depends on exactly these shapes. Run against a live dev server:
 *
 *   cd mobile && node --test scripts/smoke-api.mjs
 *
 * Prerequisites (repo root): `npm run dev` running with SERPER_API_KEY,
 * GROQ_API_KEY set, and Redis up (`docker-compose up -d redis`).
 * Override the target with API_URL=http://10.0.2.2:3000 etc.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_URL ?? 'http://localhost:3000';
const QUERY = 'what is quantum computing';

async function post(path, payload) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

test('GET /api/health reports healthy', async () => {
  const res = await fetch(`${BASE}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.equal(body.status, 'healthy');
});

test('POST /api/search returns webResults in the documented shape', async () => {
  const res = await post('/api/search', { query: QUERY, count: 10 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.webResults), 'webResults must be an array');
  if (body.webResults.length > 0) {
    const first = body.webResults[0];
    assert.equal(typeof first.title, 'string');
    assert.equal(typeof first.url, 'string');
    assert.ok('siteName' in first, 'siteName used for source display');
  }
  assert.ok(Array.isArray(body.peopleAlsoAsk ?? []));
  assert.ok(Array.isArray(body.images ?? []));
});

test('POST /api/ai returns a structured, cited answer', async () => {
  const search = await (await post('/api/search', { query: QUERY })).json();
  const res = await post('/api/ai', {
    query: QUERY,
    searchResults: search.webResults ?? [],
    model: 'groq',
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.isAI, true, 'isAI must be true on success');
  assert.equal(typeof body.answer, 'string');
  assert.ok(body.answer.length > 0);
  assert.ok(Array.isArray(body.sources), 'sources array drives citation badges');
  assert.ok(Array.isArray(body.sections ?? []));
  assert.ok(Array.isArray(body.keyPoints ?? []));
});

test('POST /api/code returns codeBlocks for a code request', async () => {
  const res = await post('/api/code', {
    query: 'write code for binary search in python',
    isFixMode: false,
    model: 'groq',
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.codeBlocks), 'codeBlocks array');
  assert.ok(body.codeBlocks.length > 0, 'at least one code block');
  const block = body.codeBlocks[0];
  assert.equal(typeof block.code, 'string');
  assert.ok('language' in block && 'syntax' in block);
});
