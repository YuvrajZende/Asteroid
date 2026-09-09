/**
 * Cache Test Script
 *
 * Sends the same query twice and verifies the second response
 * is served from cache (has `fromCache: true` flag).
 *
 * Usage:  node scripts/test-cache.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/ai`;

const payload = {
  query: 'what is the meaning of life',
  model: 'groq',
  searchResults: [
    {
      title: 'Philosophy',
      url: 'https://example.com/philosophy',
      description: 'The meaning of life is a deep philosophical question.',
      siteName: 'example.com',
    },
  ],
};

async function sendRequest(label) {
  const start = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const elapsed = Date.now() - start;
  const body = await res.json();

  console.log(`${label}:`);
  console.log(`  Status:     ${res.status}`);
  console.log(`  Time:       ${elapsed}ms`);
  console.log(`  From Cache: ${body.fromCache || false}`);
  console.log(`  Model:      ${body.model || 'n/a'}`);
  console.log('');

  return { elapsed, fromCache: body.fromCache || false };
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    Asteroid — Cache Test                 ║');
  console.log('║    Sending same query twice              ║');
  console.log('║    Expect: 2nd hit is cached & faster    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  const first = await sendRequest('📡 Request #1 (cold)');

  // Small delay to ensure cache write completes
  await new Promise((r) => setTimeout(r, 500));

  const second = await sendRequest('⚡ Request #2 (should be cached)');

  console.log('─────────────────────────────────────');
  if (second.fromCache) {
    console.log('✅ Caching is working! Second request was served from Redis.');
    console.log(`   Speed improvement: ${first.elapsed}ms → ${second.elapsed}ms`);
  } else {
    console.log('⚠️  Second request was NOT cached. Is Redis running?');
  }
}

main();
