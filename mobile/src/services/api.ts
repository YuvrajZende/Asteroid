/**
 * Typed API client for the Asteroid Next.js backend.
 *
 * - Base URL from EXPO_PUBLIC_API_URL (10.0.2.2:3000 reaches the host
 *   machine from the Android emulator).
 * - 10s AbortController timeout on every call.
 * - 429 → RateLimitError with the server's retryAfter seconds.
 * - Signed-in calls attach `Authorization: Bearer <Clerk session token>`
 *   via a token getter installed once from the root layout (keeps this
 *   module usable outside React components).
 */
import type {
  AIResponse,
  CodeResponse,
  ModelId,
  NewsResponse,
  ResearchResponse,
  SearchResponse,
  SocialResponse,
  WebResult,
} from '@/types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly retryAfterSec: number,
  ) {
    super(`Rate limited — retry in ${retryAfterSec}s`);
    this.name = 'RateLimitError';
  }
}

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

/** Called once from the root layout so every request can attach the session token. */
export function setTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // No session — proceed unauthenticated (IP-based rate limiting applies)
    }
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 429) {
      let retryAfterSec = 60;
      try {
        const body = await response.json();
        if (typeof body?.retryAfter === 'number') retryAfterSec = body.retryAfter;
      } catch {
        // keep default
      }
      throw new RateLimitError(retryAfterSec);
    }

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch {
        // keep default message
      }
      throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError || err instanceof RateLimitError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond', 408);
    }
    throw new ApiError('Network unavailable — check your connection', 0);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Endpoint wrappers (shapes per design spec §3) ─────────────

export function searchWeb(query: string, count = 10): Promise<SearchResponse> {
  return apiFetch<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, count }),
  });
}

export function synthesize(
  query: string,
  searchResults: WebResult[],
  model: ModelId,
): Promise<AIResponse> {
  return apiFetch<AIResponse>('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ query, searchResults, model }),
  });
}

export function generateCode(
  query: string,
  isFixMode: boolean,
  model: ModelId,
): Promise<CodeResponse> {
  return apiFetch<CodeResponse>('/api/code', {
    method: 'POST',
    body: JSON.stringify({ query, isFixMode, model }),
  });
}

export function fetchNews(category: string, refresh = false): Promise<NewsResponse> {
  return apiFetch<NewsResponse>(
    `/api/news?category=${encodeURIComponent(category)}${refresh ? '&refresh=true' : ''}`,
  );
}

export function fetchPapers(category: string, refresh = false): Promise<ResearchResponse> {
  return apiFetch<ResearchResponse>(
    `/api/research?category=${encodeURIComponent(category)}${refresh ? '&refresh=true' : ''}`,
  );
}

export function fetchSocial(query: string): Promise<SocialResponse> {
  return apiFetch<SocialResponse>('/api/social', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export function fetchHealth(): Promise<{ status?: string }> {
  return apiFetch<{ status?: string }>('/api/health');
}
