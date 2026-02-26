import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const CATEGORY_QUERIES = {
    'ai': 'artificial intelligence machine learning deep learning',
    'tech': 'technology computer science software engineering',
    'physics': 'physics quantum mechanics astrophysics',
    'math': 'mathematics algorithms computational',
    'biology': 'biology genetics molecular',
    'chemistry': 'chemistry materials science',
    'medicine': 'medicine medical research clinical',
    'engineering': 'engineering robotics systems',
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
            .eq('id', `research_${category}`)
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
                id: `research_${category}`,
                data: responseData,
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error writing to Supabase cache:', error);
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'ai';
        const forceRefresh = searchParams.get('refresh') === 'true';

        const cachedRecord = await getCache(category);
        const cachedData = cachedRecord ? cachedRecord.data : null;
        const cacheAge = cachedRecord ? getCacheAge(cachedRecord.created_at) : Infinity;

        // Check if we have valid cached data
        if (!forceRefresh && cachedData && cacheAge < CACHE_DURATION_MS) {
            console.log(`Serving Supabase cached research papers for ${category}`);
            return NextResponse.json({
                ...cachedData,
                cached: true,
                cacheAge: Math.round(cacheAge / (1000 * 60 * 60)) + ' hours'
            });
        }

        const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.RESEARCH_API_KEY;

        if (!SERPAPI_KEY) {
            return NextResponse.json({
                error: 'SerpAPI key not configured. Add SERPAPI_KEY or RESEARCH_API_KEY to .env.local',
                papers: []
            }, { status: 500 });
        }

        console.log(`Fetching fresh research papers for ${category} from Google Scholar`);

        const searchQuery = CATEGORY_QUERIES[category] || category;

        const params = new URLSearchParams({
            api_key: SERPAPI_KEY,
            engine: 'google_scholar',
            q: searchQuery,
            num: '20',
            as_ylo: (new Date().getFullYear() - 1).toString(),
        });

        const response = await fetch(`https://serpapi.com/search.json?${params}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('SerpAPI error:', errorText);

            if (cachedData) {
                return NextResponse.json({
                    ...cachedData,
                    cached: true,
                    stale: true
                });
            }

            return NextResponse.json({
                error: 'Failed to fetch research papers',
                papers: []
            }, { status: response.status });
        }

        const data = await response.json();

        const papers = data.organic_results?.map((result, index) => ({
            id: index,
            title: result.title,
            snippet: result.snippet,
            link: result.link,
            authors: result.publication_info?.authors?.map(a => a.name).join(', ') || 'Unknown',
            source: result.publication_info?.summary || '',
            citedBy: result.inline_links?.cited_by?.total || 0,
            year: result.publication_info?.summary?.match(/\d{4}/)?.[0] || new Date().getFullYear().toString(),
            pdfLink: result.resources?.find(r => r.file_format === 'PDF')?.link || null,
        }))
            .filter(paper => paper.title)
            .sort((a, b) => b.citedBy - a.citedBy)
            .slice(0, 10) || [];

        const responseData = {
            papers,
            totalResults: papers.length,
            category,
            fetchedAt: new Date().toISOString()
        };

        await setCache(category, responseData);

        return NextResponse.json({
            ...responseData,
            cached: false
        });

    } catch (error) {
        console.error('Research API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            papers: []
        }, { status: 500 });
    }
}
