import { NextResponse } from 'next/server';

// System prompt for AI responses - designed for comprehensive, in-depth answers
const SYSTEM_PROMPT = `You are Asteroid AI - an expert research assistant with deep expertise across all domains. Your goal is to provide COMPREHENSIVE, DETAILED, and ANALYTICAL answers that go FAR beyond simple summaries.

CRITICAL INSTRUCTIONS:
1. DO NOT just summarize the source snippets - SYNTHESIZE and EXPAND on the information
2. ADD your own expert knowledge to fill gaps and provide deeper context
3. EXPLAIN the significance, implications, and background of the topic
4. PROVIDE specific details, dates, statistics, and facts
5. WRITE long, thorough paragraphs (5-8 sentences each minimum)

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

## Overview
Write a comprehensive 6-8 sentence introduction that thoroughly answers the query. Go beyond the sources - explain the broader context, significance, and key details. Include specific facts, figures, and dates. Use citations like [1], [2] to reference sources where applicable.

## Background & Context  
Provide 5-7 sentences explaining the historical context, background information, and relevant developments that led to the current situation. Add expert knowledge beyond what's in the sources. Explain why this topic matters and its significance.

## Key Details & Analysis
Write a detailed 6-8 sentence analysis covering the most important aspects. Include:
- Specific facts, numbers, dates, names
- Expert insights and implications
- Comparisons and context
- What makes this significant

## [Topic-Specific Section]
Create 1-2 additional sections based on the topic with relevant titles (e.g., "Economic Impact", "Technical Details", "Future Implications", "Expert Opinions"). Each section should be 5-7 sentences with deep analysis.

## Key Takeaways
- Detailed takeaway 1 with specific facts and context [1]
- Detailed takeaway 2 with implications [2]
- Detailed takeaway 3 with expert insight
- Detailed takeaway 4 with future outlook
- Detailed takeaway 5

## Related Questions
- Related question users might want to explore?
- Another related question?
- A third related question?

MANDATORY RULES:
1. Each section MUST be at least 5-7 sentences - short responses are unacceptable
2. SYNTHESIZE information - don't just repeat source snippets
3. ADD expert context, analysis, and insights beyond the sources
4. Include specific numbers, dates, names, and facts
5. Explain WHY things matter, not just WHAT happened
6. Total response should be 400-600 words minimum
7. Use proper markdown formatting with ## headers
8. Include inline citations [1], [2], etc.
9. Be informative, engaging, and thorough

Remember: Users want DEEP UNDERSTANDING, not shallow summaries. Act as an expert researcher who provides real insight.`;


// Provider configurations
const PROVIDERS = {
    groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }),
        envKey: 'GROQ_API_KEY'
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        }),
        envKey: 'GEMINI_API_KEY',
        isGemini: true
    },
    openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.0-flash-exp:free',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Asteroid AI Search'
        }),
        envKey: 'OPENROUTER_API_KEY'
    },
    zai: {
        url: 'https://api.zeroai.link/v1/chat/completions',
        model: 'gpt-4o',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }),
        envKey: 'ZAI_API_KEY'
    }
};

async function callOpenAICompatible(config, apiKey, messages) {
    const response = await fetch(config.url, {
        method: 'POST',
        headers: config.getHeaders(apiKey),
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            temperature: 0.5,
            max_tokens: 6000,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`${config.envKey} API error:`, errorText);
        return null;
    }

    const data = await response.json();
    return {
        content: data.choices[0]?.message?.content || '',
        model: data.model || config.model
    };
}

async function callGemini(config, apiKey, systemPrompt, userMessage) {
    const response = await fetch(config.url, {
        method: 'POST',
        headers: config.getHeaders(apiKey),
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
            }],
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 6000,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        return null;
    }

    const data = await response.json();
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model: 'gemini-2.0-flash'
    };
}

function parseAIResponse(content) {
    const sections = [];
    let summary = '';
    let keyPoints = [];
    let relatedQuestions = [];

    // Try to parse structured response with ## headers
    const parts = content.split(/^## /gm).filter(Boolean);

    for (const part of parts) {
        const lines = part.trim().split('\n');
        const title = lines[0]?.trim();
        const body = lines.slice(1).join('\n').trim();

        const titleLower = title?.toLowerCase() || '';

        // Match overview, summary, or introduction sections
        if (titleLower.includes('overview') || titleLower.includes('summary') || titleLower.includes('introduction')) {
            summary = body;
        } else if (titleLower.includes('key takeaway') || titleLower.includes('key points') || titleLower.includes('takeaways')) {
            keyPoints = body.split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
                .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
                .filter(Boolean);
        } else if (titleLower.includes('related question') || titleLower.includes('related queries')) {
            relatedQuestions = body.split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
                .map(line => line.replace(/^[-•\d.]\s*/, '').replace(/\?$/, '').trim() + '?')
                .filter(line => line.length > 1);
        } else if (title && body) {
            sections.push({ title, content: body });
        }
    }

    // If no structured content was parsed, use the full content as summary
    if (!summary && sections.length === 0) {
        summary = content;
    }

    // If we have sections but no summary, use first section as summary
    if (!summary && sections.length > 0) {
        summary = sections[0].content;
        sections.shift();
    }

    return {
        summary,
        sections,
        keyPoints,
        relatedQuestions,
        rawContent: content  // Include raw content for debugging/display
    };
}

export async function POST(request) {
    try {
        const { query, searchResults, model = 'groq' } = await request.json();

        if (!query || !searchResults) {
            return NextResponse.json({ error: 'Query and search results are required' }, { status: 400 });
        }

        // Build context from search results
        const context = searchResults.slice(0, 6).map((result, index) =>
            `[Source ${index + 1}] ${result.title}
Website: ${result.siteName}
URL: ${result.url}
Content: ${result.description}
${result.extraSnippets?.join(' ') || ''}`
        ).join('\n\n---\n\n');

        const userMessage = `User Query: "${query}"

Reference Sources (use these as starting points, but expand with your expert knowledge):
${context}

IMPORTANT INSTRUCTIONS:
1. DO NOT just summarize or paraphrase the sources above
2. USE the sources as jumping-off points, then ADD comprehensive expert analysis
3. EXPLAIN the background, context, significance, and implications
4. PROVIDE detailed paragraphs with 5-8 sentences each
5. Include specific facts, dates, statistics, and expert insights
6. Your response should be 400-600 words minimum
7. Follow the exact section format specified in your instructions

Now provide a comprehensive, deeply researched answer that would satisfy an expert seeking thorough understanding:`;

        // Get provider config
        const providerConfig = PROVIDERS[model] || PROVIDERS.groq;
        const apiKey = process.env[providerConfig.envKey];

        // Fallback response if no API key
        if (!apiKey) {
            console.log(`No API key found for ${model}, returning fallback response`);
            const combinedContent = searchResults.slice(0, 3).map(r => r.description).join(' ');
            return NextResponse.json({
                answer: combinedContent || 'No results found. Please add an API key for AI-powered answers.',
                sections: [],
                sources: searchResults.slice(0, 5).map((r, i) => ({
                    number: i + 1,
                    title: r.title,
                    url: r.url,
                    siteName: r.siteName,
                })),
                isAI: false,
                model: 'none'
            });
        }

        // Call the appropriate API
        let result;
        if (providerConfig.isGemini) {
            result = await callGemini(providerConfig, apiKey, SYSTEM_PROMPT, userMessage);
        } else {
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ];
            result = await callOpenAICompatible(providerConfig, apiKey, messages);
        }

        // Fallback if API call failed
        if (!result) {
            return NextResponse.json({
                answer: searchResults.slice(0, 3).map(r => r.description).join(' '),
                sections: [],
                sources: searchResults.slice(0, 5).map((r, i) => ({
                    number: i + 1,
                    title: r.title,
                    url: r.url,
                    siteName: r.siteName,
                })),
                isAI: false,
                model: 'fallback'
            });
        }

        console.log(`LLM Response (${model}):`, result.content.substring(0, 500));

        // Parse the response
        const { summary, sections, keyPoints, relatedQuestions, rawContent } = parseAIResponse(result.content);

        return NextResponse.json({
            answer: summary || result.content,
            rawContent: rawContent,
            sections: sections,
            keyPoints: keyPoints,
            table: null,
            relatedQuestions: relatedQuestions,
            sources: searchResults.slice(0, 6).map((r, i) => ({
                number: i + 1,
                title: r.title,
                url: r.url,
                siteName: r.siteName,
            })),
            isAI: true,
            model: result.model
        });

    } catch (error) {
        console.error('AI API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
