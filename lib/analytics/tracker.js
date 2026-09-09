/**
 * Analytics — Event Tracker (Fire-and-Forget)
 *
 * Pushes events to a Redis List queue (`analytics:events`).
 * The analytics worker drains this queue and batch-inserts into
 * the persistent store (Supabase / PostgreSQL).
 *
 * Design principles:
 *   - NEVER block or slow down the API request
 *   - NEVER throw — swallow errors silently
 *   - Use LPUSH for O(1) writes
 */
import { getRedisClient } from '../redis/client.js';
import { ANALYTICS_QUEUE_KEY } from './constants.js';

/**
 * Track an analytics event.
 * This is fire-and-forget — it never awaits and never throws.
 *
 * @param {string} eventType  — one of EVENTS.* from constants.js
 * @param {Record<string, any>} [metadata={}] — arbitrary event data
 * @param {object} [context={}]
 * @param {string} [context.userId]   — Clerk user ID if authenticated
 * @param {string} [context.ip]       — client IP
 * @param {string} [context.route]    — API route name
 */
export function trackEvent(eventType, metadata = {}, context = {}) {
  // Build the event payload
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    metadata,
    context: {
      userId: context.userId || null,
      ip: context.ip || null,
      route: context.route || null,
      userAgent: context.userAgent || null,
    },
  };

  // Fire-and-forget: push to Redis without awaiting
  try {
    const redis = getRedisClient();
    if (redis.status === 'ready') {
      redis.lpush(ANALYTICS_QUEUE_KEY, JSON.stringify(event)).catch(() => {});
    }
  } catch (err) {
    // Swallow — analytics should never crash the app
  }
}

/**
 * Helper: extract analytics context from a Next.js Request object.
 * @param {Request} request
 * @returns {{ ip: string, userAgent: string }}
 */
export function extractContext(request) {
  return {
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}
