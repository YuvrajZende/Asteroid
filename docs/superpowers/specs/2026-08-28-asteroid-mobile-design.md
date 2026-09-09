# Asteroid Mobile — Design

**Date:** 2026-08-28
**Status:** Approved (design conversation, pending spec review)
**Scope:** new `mobile/` Expo app in the Asteroid repo

## 1. Overview

Replaces the deleted `ecoSentinel-Application/` with an Asteroid-branded mobile
client (Expo / React Native, run and tested through Android Studio's emulator).
The app shares identity with the Asteroid Next.js web app (Clerk), consumes the
existing web API directly, and reaches **functional parity with the web app in
three phases**: AI search → research/code → news/social.

The visual system, splash, and auth flows follow the previously approved
["Asteroid v1 — Splash & Auth Design"](2026-08-27-asteroid-splash-auth-design.md).

### Goals

- Dark-first, Perplexity-inspired premium UI per the approved visual spec.
- AI search with structured, cited answers — same contract as the web app.
- Shared search history: mobile and web read/write the same Supabase `Library`
  table.
- Guest mode; Clerk auth (email+password with email code, Google OAuth).
- Phased delivery: each phase ends testable in the emulator.

### Non-goals

- Any backend rewrite — the Next.js API is consumed as-is (a possible
  follow-up: per-user rate-limit attribution for mobile, see §5).
- SSE/token streaming (web doesn't stream yet either; both would move later).
- Light theme, Apple OAuth, push notifications (same exclusions as the v1 spec).
- Chat/memory/conversational threads (roadmap item on the web side too).

## 2. Architecture & repo layout

```
mobile/                      # Expo app (new, SDK 57 per v1 spec, expo-router)
  app/                       # routes: splash, (auth)/, (tabs)/, search/[libId]
  components/ui/             # theme-token driven UI kit (single-purpose)
  components/brand/          # Logo, wordmark, orbiting-particles splash
  services/                  # api client, supabase client, intent detection
  stores/                    # Zustand: search, settings, guest flag
  theme/theme.ts             # dark-first tokens (§6)
  .env.example               # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
                             # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY
```

- **API base URL**: `EXPO_PUBLIC_API_URL`. Emulator default
  `http://10.0.2.2:3000` (Android loopback → host). Physical device uses LAN IP;
  production points at the deployed Vercel URL.
- Native `fetch` is not subject to CORS, so the public `/api/*` routes work
  unchanged.
- No new backend dependencies. Mobile dependencies: `expo` (~SDK 54),
  `expo-router`, `@clerk/clerk-expo`, `expo-secure-store`, `zustand`,
  `@react-native-async-storage/async-storage`, `react-native-reanimated`,
  `expo-haptics`, `expo-linear-gradient`, `react-native-svg`,
  `@expo-google-fonts/inter`, `@expo-google-fonts/space-grotesk`,
  `react-native-markdown-display`, `@supabase/supabase-js`.

## 3. API contract (as implemented today — verified against route code)

| Endpoint | Request | Response (success) |
|---|---|---|
| `POST /api/search` | `{query, count=10}` | `{query, webResults[{title,url,description,favicon,siteName,position}], images[{src,thumbnail,title,url,source}], knowledgeGraph\|null, relatedSearches[], answerBox\|null, peopleAlsoAsk[{question,answer,source}], totalResults}` |
| `POST /api/ai` | `{query, searchResults[], model}` | `{answer, rawContent, sections[{title,content}], keyPoints[], relatedQuestions[], sources[{number,title,url,siteName}], isAI, model, fromCache?}` |
| `POST /api/code` | `{query, isFixMode, model}` | `{solution, codeBlocks[{language,syntax,code}], explanation, rawContent, fromCache?}` |
| `GET /api/news` | `?category=&refresh=` | `{articles[{id,title,description,url,image,source,publishedAt}], totalResults, category, fetchedAt, cached?, stale?, fromCache?}` |
| `GET /api/research` | `?category=&refresh=` | `{papers[{id,title,snippet,link,authors,source,citedBy,year,pdfLink}], totalResults, category, fetchedAt, cached?, stale?, fromCache?}` |
| `POST /api/social` | `{query}` | `{reddit[{title,snippet,url,source,subreddit}], twitter[{title,snippet,url,source,username}], total, fromCache?}` |
| `GET /api/health` | — | `{status, services{redis…}, …}` |

`model` ∈ `groq | gemini | openrouter | zai` — same option list as the web
(`services/Shared.jsx`). Errors: `{error}` with 4xx/5xx status; 429 includes
`retryAfter` (seconds). Clients parse defensively (all list fields optional).

## 4. State & data flow

- **Zustand stores**: `useSearch` (current query, staged status, results,
  per-libId conversation cache persisted to AsyncStorage), `useSettings`
  (default model, persisted), `useGuest` (persisted guest flag).
- **Search orchestration** (Search tab): intent detection (port of
  `services/intentDetector.js` — rule-based, <1ms) → if code request:
  `POST /api/code` directly; else `POST /api/search` → render web results
  immediately → `POST /api/ai {query, searchResults: webResults, model}` →
  replace skeleton with structured answer. `isFixRequest` sets `isFixMode`.
- **History**: on each successful search, insert into Supabase `Library`
  `{searchInput, userEmail, type: 'search'|'research'|'code', libId: uuid}` —
  identical to web, so history is shared. Guests skip the insert (local recents
  only) and the Library tab shows an on-device list.
- **Reopening** a history entry fetches nothing server-side (conversations
  aren't persisted server-side on the web either): Library stores enough
  locally (query + model + libId) to re-run, and cached conversations replay
  instantly. Re-running a query benefits from the server's Redis cache.

## 5. Auth & identity

Per the approved splash/auth spec: splash (fonts + Clerk load, orbiting
particles) → gate (`isLoaded` + guest flag) → tabs or (auth) flow:
welcome → sign-up → verify (6-box OTP) → sign-in; Google OAuth via
`useOAuth('oauth_google')`; guest mode persists until sign-in.

- API calls attach `Authorization: Bearer <token>` (`useAuth().getToken()`)
  when signed in.
- **Spike (P1, first week):** verify clerkMiddleware attributes Bearer tokens
  so `getRateLimitIdentifier` keys on `user:` instead of `ip:`. Verify by
  firing >3 AI calls in a minute and checking analytics events / 429 headers.
  **Fallback if it fails:** mobile works unauthenticated through IP limiting
  (all routes are public); user attribution becomes a small backend follow-up
  (Approach B) — not a blocker.
- Google OAuth in Expo Go on Android uses the auth-proxy/proxy-redirect flow —
  smoke-tested in P1, verified in a dev build if needed (same caveat as the
  v1 spec).

## 6. Visual system

Tokens from the approved v1 spec, unchanged: background `#191A1A`, surfaces
`#202222` / elevated `#26282B`, hairline borders ~8% white, text `#F2F3F5` /
`#9AA0A6`, accent teal `#20808D` (interactive `#2BB0C7`), semantic warning
`#F59E0B` / critical `#EF4444` / success `#22C55E`; Space Grotesk display +
Inter body; entrance animations 300–800ms (Reanimated, UI thread); light
haptics on primary presses. UI kit: Button, TextField, PasswordField, OtpInput,
SocialButton, GlowBackground, plus search-specific: SourceBadge, KeyPointRow,
ImageCarousel, QuestionChip, ModelPicker (bottom sheet), SkeletonCard,
RateLimitCard, MarkdownRenderer (markdown + code blocks; syntax highlighting
and copy button land in P2).

## 7. Navigation & screens

- **Splash** → **(auth) welcome / sign-up / verify / sign-in** → **(tabs)**
  (4-tab bottom bar):
  - **Search** (home): hero wordmark + query input, mode is automatic (intent
    detection), model picker chip, recent-search chips (guest-safe, local).
  - **Discover**: segmented **News** (P3, maps to `/api/news`) / **Papers**
    (P2, maps to `/api/research` — category chips, citation counts, PDF
    links); paper queries can be sent to AI synthesis as a follow-up (P3).
  - **Library**: shared history (signed-in) or local recents (guest); tap →
    result screen replaying/re-running that `libId`.
  - **Profile**: account info, sign-out, guest→sign-in prompt, default model
    picker, about + legal.
- **Result screen** (stack route `search/[libId]`): staged loading
  ("Searching the web…" → "Synthesizing…" with SkeletonCards) → answer hero
  (summary), key points, sections, `[1]` citation badges linking to
  `sources[i].url`, image carousel, people-also-ask chips re-running search,
  web-sources list, social-discussion cards (P3).

## 8. Error handling & graceful degrade

Mirrors the backend's philosophy:

- **429** → `RateLimitCard` with live `Retry-After` countdown, then auto-retry
  affordance.
- **Network unreachable / timeout (10s AbortController)** → if a cached
  conversation or previous results exist, show them with a stale banner;
  otherwise a designed offline state with retry.
- **`isAI: false`** (all providers failed) → render raw snippets honestly
  labeled "Showing web results — AI is briefly unavailable".
- **Empty/no-key provider errors** (500) → error card with retry; never a
  blank screen.
- All list parses tolerate missing fields (`?.` + defaults) so a partial
  backend response degrades visually instead of crashing.

## 9. Phases

**P1 — Runnable core.** Scaffold `mobile/`, theme + UI kit, splash + Clerk
auth + guest gate, Search tab end-to-end (search → web results → AI answer
with citations), Library (shared history + local recents), Profile (model
picker, account), Bearer-auth spike (§5) with documented outcome. The 4-tab
shell ships in P1 with Discover and Research rendered as designed
"coming in the next release" placeholder states.
*Exit:* fresh install → sign up → search → cited answer → entry appears in
web Library and vice versa.

**P2 — Deep modes.** Research tab (papers, citation sort), code answers
(intent-detected) with syntax-highlighted blocks + copy button, related-
question follow-ups. *Exit:* code query renders highlighted blocks; research
tab lists papers sorted by citations.

**P3 — Discover & polish.** News feed with categories + stale handling,
social discussions woven into results, follow-up AI on papers, app icon +
branded splash polish, empty/error-state audit, animation pass.
*Exit:* full web parity; manual matrix below green.

## 10. Testing & verification

- `tsc --noEmit` + `expo lint` clean at each phase gate.
- Manual emulator matrix (Android Studio): cold start (no theme flash), all
  auth paths (sign-up + email code, sign-in, wrong password, Google
  complete/cancel, guest persistence), search happy path, code query,
  research categories, news categories + pull-to-refresh, offline state,
  429 countdown, history write/read shared with web.
- Backend integration: `scripts/test-cache.js` / `test-rate-limit.js` re-run
  with mobile-originated calls; `/api/health` green from the app's About
  screen (P3 nicety).
- No unit-test runner initially (matches web repo); parsers (intent
  detection, citation regex) are pure functions — if flakes appear, add Jest
  for those units only.

## 11. Risks & open items

- **Clerk Bearer → rate-limit attribution** may not work via clerkMiddleware;
  fallback is IP limiting (§5). Tracked as P1 spike.
- **Google OAuth in Expo Go** is proxy-based and brittle; dev build is the
  reliable path (v1 spec note).
- **Discover/Research need third-party keys** (GNEWS_API_KEY, SERPAPI_KEY) on
  whichever backend the app points at; empty-key states are designed.
- **Physical-device testing** requires same-network access to the dev server
  (`EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000`); document in mobile/README.
