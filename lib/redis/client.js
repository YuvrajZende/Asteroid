/**
 * Redis Client — Singleton Connection
 * 
 * Provides a single shared ioredis connection across the entire application.
 * Handles auto-reconnect, graceful shutdown, and lazy initialization.
 * 
 * Microservice boundary: This module is the ONLY place that creates a Redis
 * connection. All other modules import from here.
 */
import Redis from 'ioredis';

/** @type {import('ioredis').Redis | null} */
let redisInstance = null;

/**
 * Returns the singleton Redis client.
 * Creates the connection lazily on first call.
 * @returns {import('ioredis').Redis}
 */
export function getRedisClient() {
  if (redisInstance) return redisInstance;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisInstance = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false, // NEVER block requests when Redis is offline
    connectTimeout: 1000,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 5) {
        // Backoff to 10s if Redis is not running
        return 10000;
      }
      return Math.min(times * 100, 2000);
    },
  });

  // ── Lifecycle Logging ────────────────────────────────────
  redisInstance.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redisInstance.on('error', (err) => {
    // Only log first few errors to avoid flooding terminal when Redis is intentionally offline
    if (!redisInstance._hasLoggedError) {
      console.warn('[Redis] Not connected — running without Redis cache (fail-open)');
      redisInstance._hasLoggedError = true;
    }
  });

  redisInstance.on('ready', () => {
    redisInstance._hasLoggedError = false;
    console.log('[Redis] Ready for operations');
  });

  // ── Graceful Shutdown ────────────────────────────────────
  const shutdown = async () => {
    if (redisInstance) {
      console.log('[Redis] Shutting down gracefully…');
      try {
        await redisInstance.quit();
      } catch {}
      redisInstance = null;
    }
  };

  if (typeof process !== 'undefined' && process.on) {
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  return redisInstance;
}

/**
 * Check if Redis is healthy.
 * @returns {Promise<boolean>}
 */
export async function isRedisHealthy() {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
