import { NextResponse } from 'next/server';
import { makeCacheKey, getCached, setCache } from '@/lib/redis/cache.js';
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit/limiter.js';
import { trackEvent, extractContext } from '@/lib/analytics/tracker.js';
import { EVENTS } from '@/lib/analytics/constants.js';

// System prompt for code generation
const CODE_SYSTEM_PROMPT = `You are an expert coding assistant. Generate clean, well-documented, and efficient code.

CRITICAL INSTRUCTIONS:
1. ALWAYS provide solutions in multiple programming languages
2. Include brief comments explaining key parts
3. Use proper formatting and indentation
4. Include any necessary imports/headers

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

## Solution

[Brief 1-2 sentence explanation of the approach]

## Python
\`\`\`python
[Complete Python code with comments]
\`\`\`

## C++
\`\`\`cpp
[Complete C++ code with comments]
\`\`\`

## Java
\`\`\`java
[Complete Java code with comments]
\`\`\`

## JavaScript
\`\`\`javascript
[Complete JavaScript code with comments]
\`\`\`

## Explanation
[Brief explanation of how the code works, 2-3 sentences]

RULES:
- Make code production-ready and complete
- Include input/output handling where appropriate
- Use modern syntax and best practices
- Keep explanations concise but clear`;

const FIX_SYSTEM_PROMPT = `You are an expert code debugging assistant. Analyze and fix the provided code.

CRITICAL INSTRUCTIONS:
1. Identify the bug or issue
2. Provide the corrected code
3. Explain what was wrong

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

## Issue Found
[Brief description of the bug/issue]

## Fixed Code
\`\`\`[language]
[The corrected code with the fix highlighted in comments]
\`\`\`

## What Was Wrong
[Bullet points explaining the issues]
- Issue 1
- Issue 2 (if applicable)

## How It's Fixed
[Brief explanation of the fix]`;

// Provider configurations (reusing from ai route)
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
        model: 'google/gemini-2.5-flash-lite',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Asteroid Code Generator'
        }),
        envKey: 'OPENROUTER_API_KEY'
    }
};

async function callOpenAICompatible(config, apiKey, messages) {
    const response = await fetch(config.url, {
        method: 'POST',
        headers: config.getHeaders(apiKey),
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            temperature: 0.3, // Lower temperature for more consistent code
            max_tokens: 4000,
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
                temperature: 0.3,
                maxOutputTokens: 4000,
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

// Parse the code response into structured format
function parseCodeResponse(content) {
    const codeBlocks = [];
    let explanation = '';
    let issue = '';
    let solution = '';

    // Extract solution/issue description
    const solutionMatch = content.match(/## (?:Solution|Issue Found)\n([\s\S]*?)(?=##|$)/);
    if (solutionMatch) {
        solution = solutionMatch[1].trim();
    }

    // Extract all code blocks with their languages
    const codeRegex = /## (Python|C\+\+|Java|JavaScript|TypeScript|Go|Rust|Ruby|PHP|C|Fixed Code)\n```(\w+)?\n([\s\S]*?)```/gi;
    let match;

    while ((match = codeRegex.exec(content)) !== null) {
        codeBlocks.push({
            language: match[1].replace('Fixed Code', 'Fixed'),
            syntax: match[2] || match[1].toLowerCase().replace('c++', 'cpp'),
            code: match[3].trim()
        });
    }

    // Extract explanation
    const explanationMatch = content.match(/## (?:Explanation|How It's Fixed|What Was Wrong)\n([\s\S]*?)(?=##|$)/);
    if (explanationMatch) {
        explanation = explanationMatch[1].trim();
    }

    return {
        solution,
        codeBlocks,
        explanation,
        rawContent: content
    };
}

export async function POST(request) {
    try {
        // ── Rate Limiting ─────────────────────────────────
        const { identifier, userId } = await getRateLimitIdentifier(request);
        const rateLimit = await checkRateLimit(identifier, {
            windowMs: 60_000,
            maxRequests: 3,
            prefix: 'rl:code',
        });
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

        const { query, isFixMode = false, model = 'groq' } = await request.json();
        const analyticsCtx = { ...extractContext(request), route: 'code', userId };

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // ── Cache Lookup ──────────────────────────────────
        const cacheKey = makeCacheKey('code', { query, model, isFixMode });
        const cached = await getCached(cacheKey);
        if (cached) {
            trackEvent(EVENTS.CACHE_HIT, { query, route: 'code' }, analyticsCtx);
            return NextResponse.json({ ...cached, fromCache: true });
        }
        trackEvent(EVENTS.CACHE_MISS, { query, route: 'code' }, analyticsCtx);
        trackEvent(EVENTS.CODE_REQUEST, { query, model, isFixMode }, analyticsCtx);

        // Select appropriate system prompt
        const systemPrompt = isFixMode ? FIX_SYSTEM_PROMPT : CODE_SYSTEM_PROMPT;

        // ── Provider selection with automatic failover ────────
        // Try the requested provider first, then every other configured
        // provider, so a single provider outage doesn't take code mode down.
        const preferredProvider = PROVIDERS[model] || PROVIDERS.groq;
        const orderedProviders = [
            preferredProvider,
            ...Object.values(PROVIDERS).filter((p) => p !== preferredProvider),
        ];

        let result = null;
        for (const config of orderedProviders) {
            const apiKey = process.env[config.envKey];
            if (!apiKey) continue;
            result = await generateCode(config, apiKey, systemPrompt, query);
            if (result) break;
            console.log(`Provider ${config.envKey} call failed — trying next provider`);
            trackEvent(EVENTS.PROVIDER_FALLBACK, { model, reason: 'api_call_failed' }, analyticsCtx);
        }

        if (!result) {
            return NextResponse.json({
                error: 'No AI provider available. Check provider API keys.',
                isCodeMode: true,
                codeBlocks: []
            }, { status: 500 });
        }

        // ── Cache Write ───────────────────────────────────
        await setCache(cacheKey, result, 'code');

        return NextResponse.json(result);

    } catch (error) {
        console.error('Code generation error:', error);
        trackEvent(EVENTS.API_ERROR, { error: error.message, route: 'code' });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateCode(providerConfig, apiKey, systemPrompt, query) {
    let result;

    if (providerConfig.isGemini) {
        result = await callGemini(providerConfig, apiKey, systemPrompt, query);
    } else {
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ];
        result = await callOpenAICompatible(providerConfig, apiKey, messages);
    }

    if (!result) return null;

    console.log(`Code generated using ${result.model}`);

    // Parse the response
    const { solution, codeBlocks, explanation, rawContent } = parseCodeResponse(result.content);

    return {
        isCodeMode: true,
        solution,
        codeBlocks,
        explanation,
        rawContent,
        model: result.model
    };
}
