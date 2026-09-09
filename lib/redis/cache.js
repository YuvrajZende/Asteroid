/**
 * Redis KV Cache — Query-level caching layer
 *
 * Provides hash-based key generation and TTL-aware get/set for
 * caching expensive API responses (AI completions, search results).
 *
 * Key schema:  cache:{routeName}:{sha256(query + model)}
 * Values are JSON-serialised and compressed by ioredis automatically.
 */
import crypto from 'crypto';
import { getRedisClient } from './client.js';

// ── Default TTLs (seconds) ─────────────────────────────────
const DEFAULT_TTL = 60 * 10; // 10 minutes
const TTL_MAP = {
  ai:       60 * 15,   // 15 min — AI responses are expensive
  search:   60 * 5,    // 5 min  — web search results change often
  code:     60 * 15,   // 15 min
  news:     60 * 3,    // 3 min  — news is time-sensitive
  research: 60 * 15,   // 15 min
  social:   60 * 5,    // 5 min
};

/**
 * Generate a deterministic cache key from a route name and arbitrary params.
 * @param {string} route   — e.g. 'ai', 'search', 'code'
 * @param {Record<string, any>} params — query, model, count, etc.
 * @returns {string}
 */
export function makeCacheKey(route, params) {
  const raw = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `cache:${route}:${hash}`;
}

/**
 * Attempt to read a cached response.
 * @param {string} key
 * @returns {Promise<object | null>}  Parsed JSON or null on miss.
 */
export async function getCached(key) {
  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready') return null;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null; // degrade gracefully — treat as cache miss
  }
}

/**
 * Write a response to cache with a TTL.
 * @param {string} key
 * @param {object} value
 * @param {string} [route]  — used to pick the TTL from TTL_MAP
 */
export async function setCache(key, value, route) {
  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready') return;
    const ttl = typeof route === 'number' ? route : (TTL_MAP[route] ?? DEFAULT_TTL);
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    // fire-and-forget — never fail the request because of cache
  }
}

/**
 * Invalidate a single cache key.
 * @param {string} key
 */
export async function invalidateCache(key) {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (err) {
    console.error('[Cache] DEL error:', err.message);
  }
}

/**
 * Invalidate all keys for a given route.
 * Uses SCAN to avoid blocking Redis.
 * @param {string} route
 */
export async function invalidateRouteCache(route) {
  try {
    const redis = getRedisClient();
    const stream = redis.scanStream({ match: `cache:${route}:*`, count: 100 });
    stream.on('data', (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        pipeline.exec();
      }
    });
  } catch (err) {
    console.error('[Cache] Route invalidation error:', err.message);
  }
}
