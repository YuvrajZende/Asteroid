/**
 * Analytics — Event Type Constants
 *
 * Single source of truth for all tracked event names.
 * Keeping these as constants prevents typos and enables autocomplete.
 */

export const EVENTS = {
  // ── Search & AI ──────────────────────────────────────
  SEARCH_EXECUTED:    'search_executed',
  AI_PROMPT:          'ai_prompt',
  CODE_REQUEST:       'code_request',
  NEWS_FETCH:         'news_fetch',
  RESEARCH_QUERY:     'research_query',
  SOCIAL_SEARCH:      'social_search',

  // ── Caching ──────────────────────────────────────────
  CACHE_HIT:          'cache_hit',
  CACHE_MISS:         'cache_miss',

  // ── Rate Limiting ────────────────────────────────────
  RATE_LIMIT_HIT:     'rate_limit_hit',

  // ── System ───────────────────────────────────────────
  API_ERROR:          'api_error',
  PROVIDER_FALLBACK:  'provider_fallback',
};

/**
 * Redis key used for the analytics event queue.
 */
export const ANALYTICS_QUEUE_KEY = 'analytics:events';

/**
 * Maximum events to flush per worker cycle.
 */
export const FLUSH_BATCH_SIZE = 100;
