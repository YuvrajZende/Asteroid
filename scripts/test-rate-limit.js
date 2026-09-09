/**
 * Rate Limit Test Script
 *
 * Fires 5 rapid requests to the AI endpoint and verifies that
 * request #4 and #5 receive a 429 Too Many Requests response.
 *
 * Usage:  node scripts/test-rate-limit.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/ai`;

const payload = {
  query: 'test rate limiting',
  model: 'groq',
  searchResults: [
    {
      title: 'Test Result',
      url: 'https://example.com',
      description: 'Test description for rate limit testing',
      siteName: 'example.com',
    },
  ],
};

async function fire(index) {
  const start = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - start;
    const status = res.status;
    const body = await res.json();

    const emoji = status === 429 ? '🚫' : '✅';
    console.log(
      `${emoji} Request #${index + 1}  →  ${status}  (${elapsed}ms)` +
      (status === 429 ? `  Retry-After: ${body.retryAfter}s` : '')
    );
    return status;
  } catch (err) {
    console.error(`❌ Request #${index + 1} failed:`, err.message);
    return 0;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    Asteroid — Rate Limit Test            ║');
  console.log('║    Sending 5 rapid requests to /api/ai   ║');
  console.log('║    Expect: 3 pass, 2 rejected (429)      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  const statuses = [];
  for (let i = 0; i < 5; i++) {
    const status = await fire(i);
    statuses.push(status);
  }

  console.log('');
  const passed = statuses.filter((s) => s !== 429).length;
  const blocked = statuses.filter((s) => s === 429).length;

  console.log(`Results:  ${passed} allowed,  ${blocked} blocked`);

  if (blocked >= 2) {
    console.log('✅ Rate limiting is working correctly!');
  } else {
    console.log('⚠️  Rate limiting may not be active. Is Redis running?');
  }
}

main();
