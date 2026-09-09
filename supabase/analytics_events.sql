-- ============================================================
-- Asteroid — Analytics Events Table
--
-- Written to by lib/analytics/worker.js, which drains the Redis
-- analytics:events queue and batch-inserts rows here.
--
-- Run this in the Supabase SQL editor (or via migration) before
-- starting the analytics worker.
--
-- RLS is enabled with NO public policies on purpose: event rows
-- are written server-side only. The worker therefore needs the
-- service-role key (SUPABASE_SERVICE_ROLE_KEY), which bypasses
-- RLS. The anon key cannot insert.
-- ============================================================

create table if not exists analytics_events (
  id          bigint generated always as identity primary key,
  event_type  text        not null,              -- e.g. 'search_executed', 'ai_prompt', 'cache_hit'
  metadata    jsonb       not null default '{}'::jsonb,
  user_id     text,                              -- Clerk user ID (null for anonymous)
  ip_address  text,
  route       text,                              -- 'search' | 'ai' | 'code' | 'news' | 'research' | 'social'
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Query patterns: per-event-type dashboards over time, per-user usage history
create index if not exists analytics_events_type_created_idx
  on analytics_events (event_type, created_at desc);

create index if not exists analytics_events_user_idx
  on analytics_events (user_id)
  where user_id is not null;

alter table analytics_events enable row level security;
