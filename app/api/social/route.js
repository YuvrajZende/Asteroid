'use server'

import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

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

        return NextResponse.json({
            reddit: redditPosts,
            twitter: twitterPosts,
            total: redditPosts.length + twitterPosts.length,
        });

    } catch (error) {
        console.error('Social search error:', error);
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
