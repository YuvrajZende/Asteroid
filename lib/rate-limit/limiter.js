/**
 * Rate Limiter — Sliding Window Counter (Redis Sorted Sets)
 *
 * Uses a sorted set per identifier where:
 *   - Member = unique request ID (timestamp + random)
 *   - Score  = timestamp in milliseconds
 *
 * On each request:
 *   1. Remove all entries older than the window
 *   2. Count remaining entries
 *   3. If count >= limit → reject with 429
 *   4. Else → add the new entry and allow
 *
 * This is the industry-standard sliding window approach used by
 * Stripe, Cloudflare, and Discord.
 */
import { getRedisClient } from '../redis/client.js';
import { trackEvent } from '../analytics/tracker.js';
import { EVENTS } from '../analytics/constants.js';
import { auth } from '@clerk/nextjs/server';

// ── Configuration ──────────────────────────────────────────
const DEFAULT_WINDOW_MS = 60 * 1000;   // 1 minute
const DEFAULT_MAX_REQUESTS = 3;        // 3 requests per window

/**
 * Check and enforce rate limiting for an identifier.
 *
 * @param {string} identifier  — IP address, user ID, or API key
 * @param {object} [options]
 * @param {number} [options.windowMs=60000]      — window size in ms
 * @param {number} [options.maxRequests=3]        — max requests per window
 * @param {string} [options.prefix='rl']          — key prefix
 * @returns {Promise<{ allowed: boolean, remaining: number, resetMs: number, retryAfterSec: number }>}
 */
export async function checkRateLimit(identifier, options = {}) {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    prefix = 'rl',
  } = options;

  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      return {
        allowed: true,
        remaining: maxRequests,
        resetMs: windowMs,
        retryAfterSec: Math.ceil(windowMs / 1000),
      };
    }

    // Atomic pipeline: clean + count + add + set TTL
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);         // 1. prune old entries
    pipeline.zcard(key);                                     // 2. count current entries
    pipeline.zadd(key, now, `${now}:${Math.random()}`);     // 3. add this request
    pipeline.pexpire(key, windowMs);                         // 4. auto-expire the key

    const results = await pipeline.exec();
    const currentCount = results[1][1]; // zcard result

    if (currentCount >= maxRequests) {
      // ── Rate Limited ─────────────────────────────────
      // Remove the entry we just added (request is denied)
      await redis.zremrangebyscore(key, now, now + 1);

      // Calculate when the oldest entry expires
      const oldestEntries = await redis.zrangebyscore(key, '-inf', '+inf', 'LIMIT', 0, 1);
      let resetMs = windowMs;
      if (oldestEntries.length > 0) {
        const oldestScore = await redis.zscore(key, oldestEntries[0]);
        resetMs = Math.max(0, (parseInt(oldestScore) + windowMs) - now);
      }

      const retryAfterSec = Math.ceil(resetMs / 1000);

      // Track the rate-limit event for analytics
      trackEvent(EVENTS.RATE_LIMIT_HIT, {
        identifier,
        currentCount,
        maxRequests,
        windowMs,
      });

      return {
        allowed: false,
        remaining: 0,
        resetMs,
        retryAfterSec,
      };
    }

    // ── Allowed ──────────────────────────────────────
    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetMs: windowMs,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  } catch (err) {
    console.error('[RateLimit] Redis error — allowing request (fail-open):', err.message);
    // Fail-open: if Redis is down, don't block users
    return {
      allowed: true,
      remaining: maxRequests,
      resetMs: windowMs,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }
}

/**
 * Build a rate-limit response (429 Too Many Requests).
 * @param {object} rateLimitResult  — from checkRateLimit()
 * @returns {Response}
 */
export function rateLimitResponse(rateLimitResult) {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. You can make 3 requests per minute. Please try again in ${rateLimitResult.retryAfterSec} seconds.`,
      retryAfter: rateLimitResult.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimitResult.retryAfterSec),
        'X-RateLimit-Limit': String(DEFAULT_MAX_REQUESTS),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimitResult.resetMs) / 1000)),
      },
    }
  );
}

/**
 * Extract the client IP from a Next.js request.
 * Works with Vercel, Cloudflare, nginx, and local dev.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

/**
 * Resolve the rate-limit identifier for a request.
 *
 * Hybrid model: authenticated Clerk users are limited per-account
 * (so shared Wi-Fi / NAT doesn't lock out legitimate users), while
 * anonymous traffic is limited per-IP to block scraper bots.
 *
 * @param {Request} request
 * @returns {Promise<{ identifier: string, userId: string | null }>}
 */
export async function getRateLimitIdentifier(request) {
  try {
    const { userId } = await auth();
    if (userId) return { identifier: `user:${userId}`, userId };
  } catch {
    // No Clerk session context (public route, missing keys) — fall through to IP
  }
  return { identifier: `ip:${getClientIp(request)}`, userId: null };
}
