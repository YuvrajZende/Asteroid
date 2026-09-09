/**
 * Bearer-auth spike (spec §5): does a Clerk Bearer token move rate-limit
 * keying from the IP namespace (rl:*:ip:…) to the user namespace
 * (rl:*:user:…)?
 *
 * Usage:
 *   1. Sign in on the app → Profile → "Dev: log session token" → copy
 *      the token from the Metro/console output.
 *   2. node scripts/spike-bearer-auth.mjs "<token>"
 *
 * Then inspect Redis keys between runs:
 *   docker exec $(docker ps --filter name=redis -q) redis-cli --scan --pattern 'rl:ai:*'
 *
 * Interpretation:
 *   - keys rl:ai:ip:<…>       → Bearer NOT attributed (expected default);
 *                               mobile still works via IP limiting.
 *   - keys rl:ai:user:user_…  → Bearer attributed; per-user limiting live.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000';
const TOKEN = process.argv[2] ?? null;
const CALLS = 4;

const payload = {
  query: `bearer spike ${Date.now()}`,
  model: 'groq',
  searchResults: [
    { title: 'Spike', url: 'https://example.com', description: 'rate limit probe', siteName: 'example.com' },
  ],
};

for (let i = 1; i <= CALLS; i++) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}/api/ai`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const suffix = TOKEN ? 'WITH token' : 'anonymous';
  console.log(`call ${i}/${CALLS} (${suffix}) → ${res.status}`);
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    console.log(`  retryAfter: ${body.retryAfter}s`);
    break;
  }
}

console.log('\nNow inspect Redis to see which namespace was keyed:');
console.log(`  docker exec $(docker ps --filter name=redis -q) redis-cli --scan --pattern 'rl:ai:*'`);
