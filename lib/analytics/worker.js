/**
 * Analytics Worker — Background Queue Drain
 *
 * Runs as a standalone Node.js process (outside Next.js).
 * Pops events from the Redis `analytics:events` list and
 * batch-inserts them into Supabase every FLUSH_INTERVAL_MS.
 *
 * Usage:
 *   node lib/analytics/worker.js
 *
 * In Docker, this runs as a separate container/service.
 *
 * ┌────────────┐    LPUSH    ┌───────────┐    BATCH INSERT    ┌──────────┐
 * │  API Route │ ──────────→ │   Redis   │ ────────────────→  │ Supabase │
 * └────────────┘             │  (queue)  │                    │  (pgsql) │
 *                            └───────────┘                    └──────────┘
 */
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

// ── Configuration ──────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// analytics_events has RLS enabled (no public insert policy) — the worker
// must use the service-role key; the anon key silently fails inserts.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;
const QUEUE_KEY = 'analytics:events';
const FLUSH_INTERVAL_MS = 5_000;  // drain every 5 seconds
const BATCH_SIZE = 100;           // max events per flush
const TABLE_NAME = 'analytics_events';

// ── Init Clients ───────────────────────────────────────────
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ── Flush Logic ────────────────────────────────────────────
async function flush() {
  try {
    // Pop up to BATCH_SIZE events from the right end of the list (FIFO)
    const events = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const raw = await redis.rpop(QUEUE_KEY);
      if (!raw) break; // queue is empty
      try {
        events.push(JSON.parse(raw));
      } catch {
        console.warn('[Worker] Skipping malformed event');
      }
    }

    if (events.length === 0) return;

    console.log(`[Worker] Flushing ${events.length} events`);

    // Transform events for the database
    const rows = events.map((evt) => ({
      event_type: evt.type,
      metadata: evt.metadata || {},
      user_id: evt.context?.userId || null,
      ip_address: evt.context?.ip || null,
      route: evt.context?.route || null,
      user_agent: evt.context?.userAgent || null,
      created_at: evt.timestamp || new Date().toISOString(),
    }));

    if (supabase) {
      const { error } = await supabase.from(TABLE_NAME).insert(rows);
      if (error) {
        console.error('[Worker] Supabase insert error:', error.message);
        // Re-queue failed events so they aren't lost
        const pipeline = redis.pipeline();
        events.forEach((evt) => pipeline.rpush(QUEUE_KEY, JSON.stringify(evt)));
        await pipeline.exec();
      } else {
        console.log(`[Worker] Successfully inserted ${rows.length} rows`);
      }
    } else {
      // No Supabase configured — log to stdout (useful in dev)
      console.log('[Worker] No Supabase configured, logging events to stdout:');
      rows.forEach((r) => console.log(`  [${r.event_type}] ${r.route || '-'} — ${r.ip_address}`));
    }
  } catch (err) {
    console.error('[Worker] Flush error:', err.message);
  }
}

// ── Main Loop ──────────────────────────────────────────────
console.log('===========================================');
console.log(' Asteroid Analytics Worker');
console.log(`   Redis:    ${REDIS_URL}`);
console.log(`   Supabase: ${SUPABASE_URL ? (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'connected (service-role)' : 'connected (anon — inserts will fail while RLS is enabled on analytics_events; set SUPABASE_SERVICE_ROLE_KEY)') : 'NOT configured (stdout mode)'}`);
console.log(`   Interval: ${FLUSH_INTERVAL_MS}ms`);
console.log(`   Batch:    ${BATCH_SIZE}`);
console.log('===========================================');

const interval = setInterval(flush, FLUSH_INTERVAL_MS);

// ── Graceful Shutdown ──────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Worker] Received ${signal}, shutting down…`);
  clearInterval(interval);
  // Final flush to drain any remaining events
  await flush();
  await redis.quit();
  console.log('[Worker] Goodbye.');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
