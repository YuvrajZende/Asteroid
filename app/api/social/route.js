'use server'

import { NextResponse } from 'next/server';
import { makeCacheKey, getCached, setCache } from '@/lib/redis/cache.js';
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit/limiter.js';
import { trackEvent, extractContext } from '@/lib/analytics/tracker.js';
import { EVENTS } from '@/lib/analytics/constants.js';

export async function POST(request) {
    try {
        // ── Rate Limiting ─────────────────────────────────
        const { identifier, userId } = await getRateLimitIdentifier(request);
        const rateLimit = await checkRateLimit(identifier, {
            windowMs: 60_000,
            maxRequests: 10,
            prefix: 'rl:social',
        });
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

        const { query } = await request.json();
        const analyticsCtx = { ...extractContext(request), route: 'social', userId };

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // ── Cache Lookup ──────────────────────────────────
        const cacheKey = makeCacheKey('social', { query });
        const cached = await getCached(cacheKey);
        if (cached) {
            trackEvent(EVENTS.CACHE_HIT, { query, route: 'social' }, analyticsCtx);
            return NextResponse.json({ ...cached, fromCache: true });
        }
        trackEvent(EVENTS.CACHE_MISS, { query, route: 'social' }, analyticsCtx);

        const SERPER_API_KEY = process.env.SERPER_API_KEY;

        if (!SERPER_API_KEY) {
            return NextResponse.json({ error: 'Search API not configured' }, { status: 500 });
        }

        // Search Reddit for discussions
        const redditResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: `${query} site:reddit.com`,
                num: 5,
            }),
        });

        let redditPosts = [];
        if (redditResponse.ok) {
            const data = await redditResponse.json();
            redditPosts = data.organic?.slice(0, 3).map(result => ({
                title: result.title,
                snippet: result.snippet,
                url: result.link,
                source: 'reddit',
                subreddit: extractSubreddit(result.link),
            })) || [];
        }

        // Search X/Twitter for discussions
        const twitterResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: `${query} site:twitter.com OR site:x.com`,
                num: 5,
            }),
        });

        let twitterPosts = [];
        if (twitterResponse.ok) {
            const data = await twitterResponse.json();
            twitterPosts = data.organic?.slice(0, 3).map(result => ({
                title: result.title,
                snippet: result.snippet,
                url: result.link,
                source: 'twitter',
                username: extractTwitterUsername(result.link),
            })) || [];
        }

        // ── Cache Write ───────────────────────────────────
        const responsePayload = {
            reddit: redditPosts,
            twitter: twitterPosts,
            total: redditPosts.length + twitterPosts.length,
        };
        await setCache(cacheKey, responsePayload, 'social');
        trackEvent(EVENTS.SOCIAL_SEARCH, { query, total: responsePayload.total }, analyticsCtx);

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('Social search error:', error);
        trackEvent(EVENTS.API_ERROR, { error: error.message, route: 'social' });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function extractSubreddit(url) {
    try {
        const match = url.match(/reddit\.com\/r\/([^\/]+)/);
        return match ? `r/${match[1]}` : 'reddit';
    } catch {
        return 'reddit';
    }
}

function extractTwitterUsername(url) {
    try {
        const match = url.match(/(?:twitter|x)\.com\/([^\/]+)/);
        return match ? `@${match[1]}` : '';
    } catch {
        return '';
    }
}
