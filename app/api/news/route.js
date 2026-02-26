import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

async function getCache(category) {
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

async function setCache(category, responseData) {
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

// Fetch fresh news from API
async function fetchFreshNews(category) {
    const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

    if (!GNEWS_API_KEY) {
        throw new Error('GNews API key not configured');
    }

    const gnewsCategory = CATEGORY_MAP[category] || 'general';
    const response = await fetchWithTimeout(
        `https://gnews.io/api/v4/top-headlines?category=${gnewsCategory}&country=in&lang=en&max=12&apikey=${GNEWS_API_KEY}`,
        API_TIMEOUT_MS
    );

    if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform GNews response to our format
    const articles = data.articles?.map((article, index) => ({
        id: index,
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.image,
        source: article.source?.name,
        publishedAt: article.publishedAt,
    })).filter(article => article.title) || [];

    const responseData = {
        articles,
        totalResults: data.totalArticles || articles.length,
        category,
        fetchedAt: new Date().toISOString()
    };

    // Cache the response into Supabase
    await setCache(category, responseData);

    return responseData;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';
        const forceRefresh = searchParams.get('refresh') === 'true';

        const cachedRecord = await getCache(category);
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

        const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

        if (!GNEWS_API_KEY) {
            // Return stale cache if available
            if (cachedData) {
                return NextResponse.json({
                    ...cachedData,
                    cached: true,
                    stale: true,
                    error: 'API key not configured, showing cached data'
                });
            }
            return NextResponse.json({
                error: 'GNews API key not configured. Add GNEWS_API_KEY to .env.local',
                articles: []
            }, { status: 500 });
        }

        console.log(`Fetching fresh news for ${category} from GNews`);

        try {
            const responseData = await fetchFreshNews(category);
            return NextResponse.json({
                ...responseData,
                cached: false
            });
        } catch (fetchError) {
            console.error('GNews API error:', fetchError.message);

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
        return NextResponse.json({
            error: 'Internal server error',
            articles: []
        }, { status: 500 });
    }
}
