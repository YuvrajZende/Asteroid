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
            maxRequests: 10,     // search is lighter than AI, allow more
            prefix: 'rl:search',
        });

        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit);
        }

        const { query, count = 10 } = await request.json();
        const analyticsCtx = { ...extractContext(request), route: 'search', userId };

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // ── Cache Lookup ──────────────────────────────────
        const cacheKey = makeCacheKey('search', { query, count });
        const cached = await getCached(cacheKey);
        if (cached) {
            trackEvent(EVENTS.CACHE_HIT, { query, ...analyticsCtx });
            return NextResponse.json(cached);
        }

        const SERPER_API_KEY = process.env.SERPER_API_KEY;
        let data = null;

        // Tier 1: Serper.dev with timeout
        if (SERPER_API_KEY) {
            try {
                const response = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': SERPER_API_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ q: query, num: count }),
                    signal: AbortSignal.timeout(6000),
                });

                if (response.ok) {
                    data = await response.json();
                } else {
                    console.warn('Serper returned status:', response.status);
                }
            } catch (err) {
                console.warn('Serper search timed out or failed, falling back:', err.message);
            }
        }

        // Tier 2: Wikipedia / DuckDuckGo Fallback if Serper is down or timed out
        let webResults = [];
        let peopleAlsoAsk = [];
        let relatedSearches = [];
        let knowledgeGraph = null;
        let answerBox = null;

        if (data && data.organic) {
            webResults = data.organic.map(result => {
                let siteName = 'web';
                let favicon = 'https://www.google.com/s2/favicons?sz=32&domain=google.com';
                try {
                    const parsedUrl = new URL(result.link);
                    siteName = parsedUrl.hostname.replace('www.', '');
                    favicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`;
                } catch {}

                return {
                    title: result.title,
                    url: result.link,
                    description: result.snippet || '',
                    favicon,
                    siteName,
                    position: result.position,
                };
            });

            if (data.knowledgeGraph) {
                knowledgeGraph = {
                    title: data.knowledgeGraph.title,
                    description: data.knowledgeGraph.description,
                    image: data.knowledgeGraph.imageUrl,
                    type: data.knowledgeGraph.type,
                    attributes: data.knowledgeGraph.attributes || {},
                };
            }

            if (data.relatedSearches) {
                relatedSearches = data.relatedSearches.map(rs => rs.query).filter(Boolean);
            }

            if (data.answerBox) {
                answerBox = {
                    title: data.answerBox.title,
                    answer: data.answerBox.answer || data.answerBox.snippet,
                    source: data.answerBox.link,
                };
            }

            if (data.peopleAlsoAsk) {
                peopleAlsoAsk = data.peopleAlsoAsk.map(paa => ({
                    question: paa.question,
                    answer: paa.snippet,
                    source: paa.link,
                })).filter(p => p.question);
            }
        } else {
            // Fallback: Fetch Wikipedia results
            try {
                const wikiRes = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`,
                    { signal: AbortSignal.timeout(4000) }
                );
                if (wikiRes.ok) {
                    const wikiData = await wikiRes.json();
                    const items = wikiData.query?.search || [];
                    webResults = items.slice(0, count).map((item, idx) => ({
                        title: item.title,
                        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                        description: item.snippet?.replace(/<\/?[^>]+(>|$)/g, '') || '',
                        favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
                        siteName: 'wikipedia.org',
                        position: idx + 1,
                    }));
                }
            } catch (wikiErr) {
                console.warn('Wikipedia fallback failed:', wikiErr.message);
            }
        }

        // Get images from Serper (with non-blocking 3s timeout)
        let images = [];
        if (SERPER_API_KEY) {
            try {
                const imageResponse = await fetch('https://google.serper.dev/images', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': SERPER_API_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ q: query, num: 8 }),
                    signal: AbortSignal.timeout(3500),
                });

                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    images = imageData.images?.map(img => ({
                        src: img.imageUrl,
                        thumbnail: img.thumbnailUrl,
                        title: img.title,
                        url: img.link,
                        source: img.source,
                    })) || [];
                }
            } catch {}
        }

        const responsePayload = {
            query,
            webResults,
            images,
            knowledgeGraph,
            relatedSearches,
            answerBox,
            peopleAlsoAsk,
            totalResults: webResults.length,
        };

        // ── Cache Write ──────────────────────────────────
        await setCache(cacheKey, responsePayload, 'search');
        trackEvent(EVENTS.SEARCH_EXECUTED, { query, resultCount: webResults.length }, analyticsCtx);

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('Search API error:', error);
        trackEvent(EVENTS.API_ERROR, { error: error.message, route: 'search' });
        return NextResponse.json({
            query: 'Search',
            webResults: [],
            images: [],
            peopleAlsoAsk: [],
            relatedSearches: [],
            totalResults: 0,
        });
    }
}
