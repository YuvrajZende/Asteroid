import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query, count = 10 } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const SERPER_API_KEY = process.env.SERPER_API_KEY;

        if (!SERPER_API_KEY) {
            console.error('SERPER_API_KEY is not configured');
            return NextResponse.json({ error: 'Search API not configured. Add SERPER_API_KEY to .env.local' }, { status: 500 });
        }

        // Call Serper.dev API for Google Search results
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: query,
                num: count,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serper API error:', errorText);
            return NextResponse.json({ error: 'Search failed' }, { status: response.status });
        }

        const data = await response.json();

        // Extract and format web results
        const webResults = data.organic?.map(result => ({
            title: result.title,
            url: result.link,
            description: result.snippet,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}&sz=32`,
            siteName: new URL(result.link).hostname.replace('www.', ''),
            position: result.position,
        })) || [];

        // Get images from Serper image search
        const imageResponse = await fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 10 }),
        });

        let images = [];
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

        // Get knowledge graph if available
        const knowledgeGraph = data.knowledgeGraph ? {
            title: data.knowledgeGraph.title,
            description: data.knowledgeGraph.description,
            image: data.knowledgeGraph.imageUrl,
            type: data.knowledgeGraph.type,
            attributes: data.knowledgeGraph.attributes || {},
        } : null;

        // Get related searches
        const relatedSearches = data.relatedSearches?.map(rs => rs.query) || [];

        // Get answer box if available
        const answerBox = data.answerBox ? {
            title: data.answerBox.title,
            answer: data.answerBox.answer || data.answerBox.snippet,
            source: data.answerBox.link,
        } : null;

        // Get "People Also Ask" questions
        const peopleAlsoAsk = data.peopleAlsoAsk?.map(paa => ({
            question: paa.question,
            answer: paa.snippet,
            source: paa.link,
        })) || [];

        return NextResponse.json({
            query: data.searchParameters?.q || query,
            webResults,
            images,
            knowledgeGraph,
            relatedSearches,
            answerBox,
            peopleAlsoAsk,
            totalResults: webResults.length,
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
