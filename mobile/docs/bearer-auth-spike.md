# Bearer-Auth Spike — Outcome

**Date:** 2026-08-28 · **Spec:** §5 of the mobile design · **Status:** partially verified (anonymous path green; user path needs one emulator run)

## What was verified (live)

Anonymous rate limiting behaves exactly as documented:

- 4 rapid `POST /api/ai` calls: `200, 200, 200, 429`
- The 429 body carries `retryAfter` seconds (mobile renders the RateLimitCard countdown from this)
- Redis key namespace after the run: `rl:ai:ip:::1` → **IP namespace**, as expected for unauthenticated traffic

## What remains

Attributing a **Clerk Bearer token** to the `rl:*:user:*` namespace requires a
real session token, which only exists inside a signed-in app session. One
manual run to finish the spike:

1. `npx expo start` → sign in on the emulator
2. Profile → **Dev: log session token** → copy the token from the Metro console
3. `node scripts/spike-bearer-auth.mjs "<token>"`
4. Re-inspect keys: `docker exec asteroid-redis-1 redis-cli --scan --pattern 'rl:ai:*'`
   - `rl:ai:user:user_…` → per-user attribution confirmed
   - still `rl:ai:ip:…` → clerkMiddleware does not attribute Bearer tokens

## Fallback (per spec §5)

Either outcome is non-blocking: all `/api/*` routes are public and the limiter
fails open, so mobile works fully through IP limiting. If attribution fails,
follow-up is a small backend change (authenticate the Bearer token in
`getRateLimitIdentifier`).
