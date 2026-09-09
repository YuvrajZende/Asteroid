import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { makeCacheKey, getCached, setCache } from '@/lib/redis/cache.js';
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit/limiter.js';
import { trackEvent, extractContext } from '@/lib/analytics/tracker.js';
import { EVENTS } from '@/lib/analytics/constants.js';

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes - after this, refresh in background
const API_TIMEOUT_MS = 5000; // 5 second timeout for API calls

// Category mapping for GNews API
const CATEGORY_MAP = {
    'general': 'general',
    'technology': 'technology',
    'science': 'science',
    'business': 'business',
    'entertainment': 'entertainment',
    'health': 'health',
    'sports': 'sports',
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function getCacheAge(updatedAt) {
    if (!updatedAt) return Infinity;
    return Date.now() - new Date(updatedAt).getTime();
}

async function getApiCache(category) {
    try {
        const { data, error } = await supabase
            .from('ApiCache')
            .select('*')
            .eq('id', `news_${category}_in`)
            .single();

        if (error || !data) return null;
        return data;
    } catch {
        return null;
    }
}

async function setApiCache(category, responseData) {
    try {
        await supabase
            .from('ApiCache')
            .upsert({
                id: `news_${category}_in`,
                data: responseData,
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error writing to Supabase cache:', error);
    }
}

// Fetch with timeout
async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Fetch fresh news from API with multi-provider fallbacks
async function fetchFreshNews(category) {
    const gnewsCategory = CATEGORY_MAP[category] || 'general';
    let articles = [];

    // 1. Try GNews
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
    if (GNEWS_API_KEY) {
        try {
            const response = await fetchWithTimeout(
                `https://gnews.io/api/v4/top-headlines?category=${gnewsCategory}&lang=en&max=12&apikey=${GNEWS_API_KEY}`,
                API_TIMEOUT_MS
            );
            if (response.ok) {
                const data = await response.json();
                articles = data.articles?.map((article, index) => ({
                    id: index,
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    image: article.image,
                    source: article.source?.name,
                    publishedAt: article.publishedAt,
                })).filter(article => article.title) || [];
            }
        } catch (err) {
            console.warn('GNews fetch failed, trying fallback:', err.message);
        }
    }

    // 2. Try NewsAPI as fallback if GNews returned no articles
    if (articles.length === 0) {
        const NEWS_API_KEY = process.env.NEWS_API_KEY;
        if (NEWS_API_KEY) {
            try {
                const response = await fetchWithTimeout(
                    `https://newsapi.org/v2/top-headlines?category=${gnewsCategory}&language=en&pageSize=12&apiKey=${NEWS_API_KEY}`,
                    API_TIMEOUT_MS
                );
                if (response.ok) {
                    const data = await response.json();
                    articles = data.articles?.map((article, index) => ({
                        id: index,
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        image: article.urlToImage,
                        source: article.source?.name,
                        publishedAt: article.publishedAt,
                    })).filter(article => article.title && !article.title.includes('[Removed]')) || [];
                }
            } catch (err) {
                console.warn('NewsAPI fetch failed, trying Serper fallback:', err.message);
            }
        }
    }

    // 3. Try Serper News as fallback if still no articles
    if (articles.length === 0) {
        const SERPER_API_KEY = process.env.SERPER_API_KEY;
        if (SERPER_API_KEY) {
            try {
                const response = await fetchWithTimeout(
                    'https://google.serper.dev/news',
                    {
                        method: 'POST',
                        headers: {
                            'X-API-KEY': SERPER_API_KEY,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ q: `top ${category} news`, num: 12 }),
                    },
                    API_TIMEOUT_MS
                );
                if (response.ok) {
                    const data = await response.json();
                    articles = data.news?.map((item, index) => ({
                        id: index,
                        title: item.title,
                        description: item.snippet,
                        url: item.link,
                        image: item.imageUrl,
                        source: item.source,
                        publishedAt: item.date || new Date().toISOString(),
                    })).filter(article => article.title) || [];
                }
            } catch (err) {
                console.warn('Serper news fallback failed:', err.message);
            }
        }
    }

    if (articles.length === 0) {
        throw new Error('No news articles found across providers');
    }

    const responseData = {
        articles,
        totalResults: articles.length,
        category,
        fetchedAt: new Date().toISOString()
    };

    // Cache the response into Supabase
    await setApiCache(category, responseData);

    return responseData;
}

export async function GET(request) {
    try {
        // ── Rate Limiting ─────────────────────────────────
        const { identifier, userId } = await getRateLimitIdentifier(request);
        const rateLimit = await checkRateLimit(identifier, {
            windowMs: 60_000,
            maxRequests: 10,
            prefix: 'rl:news',
        });
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';
        const forceRefresh = searchParams.get('refresh') === 'true';
        const analyticsCtx = { ...extractContext(request), route: 'news', userId };

        // ── Redis Cache Lookup (fast path, 3 min TTL) ────
        const cacheKey = makeCacheKey('news', { category });
        if (!forceRefresh) {
            const cached = await getCached(cacheKey);
            if (cached) {
                trackEvent(EVENTS.CACHE_HIT, { category, route: 'news' }, analyticsCtx);
                return NextResponse.json({ ...cached, fromCache: true });
            }
        }
        trackEvent(EVENTS.CACHE_MISS, { category, route: 'news' }, analyticsCtx);

        const cachedRecord = await getApiCache(category);
        const cachedData = cachedRecord ? cachedRecord.data : null;
        const cacheAge = cachedRecord ? getCacheAge(cachedRecord.created_at) : Infinity;

        // If we have valid cache and not forcing refresh
        if (!forceRefresh && cachedData && cacheAge < CACHE_DURATION_MS) {
            console.log(`Serving Supabase cached news for ${category} (age: ${Math.round(cacheAge / 60000)}m)`);

            // If cache is getting stale, trigger background refresh (fire and forget)
            if (cacheAge >= STALE_THRESHOLD_MS) {
                console.log(`Background refresh triggered for ${category}`);
                fetchFreshNews(category).catch(err =>
                    console.error('Background refresh failed:', err.message)
                );
            }

            return NextResponse.json({
                ...cachedData,
                cached: true,
                cacheAge: Math.round(cacheAge / 60000) + ' minutes'
            });
        }

        console.log(`Fetching news for ${category}`);

        try {
            const responseData = await fetchFreshNews(category);

            // ── Redis Cache Write ─────────────────────────
            await setCache(cacheKey, responseData, 'news');
            trackEvent(EVENTS.NEWS_FETCH, { category, resultCount: responseData.articles.length }, analyticsCtx);

            return NextResponse.json({
                ...responseData,
                cached: false
            });
        } catch (fetchError) {
            console.error('News API fetch error:', fetchError.message);

            // If API fails but we have any cache (even stale), use it
            if (cachedData) {
                console.log(`Serving stale Supabase cache for ${category} due to API error`);
                return NextResponse.json({
                    ...cachedData,
                    cached: true,
                    stale: true,
                    error: 'API temporarily unavailable, showing cached data'
                });
            }

            return NextResponse.json({
                error: 'Failed to fetch news',
                articles: []
            }, { status: 500 });
        }

    } catch (error) {
        console.error('News API error:', error);
        trackEvent(EVENTS.API_ERROR, { error: error.message, route: 'news' });
        return NextResponse.json({
            error: 'Internal server error',
            articles: []
        }, { status: 500 });
    }
}
