import { NextResponse } from 'next/server';
import { makeCacheKey, getCached, setCache } from '@/lib/redis/cache.js';
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit/limiter.js';
import { trackEvent, extractContext } from '@/lib/analytics/tracker.js';
import { EVENTS } from '@/lib/analytics/constants.js';

// Master System Prompt for the Answer Presentation Engine
const SYSTEM_PROMPT = `You are the Answer Presentation Engine for Asteroid — a world-class AI search and research application.

Your job is NOT simply to generate text. Your job is to transform the user's query and the retrieved search results into a highly structured, comprehensive, deeply informative, and visually balanced editorial answer.

==================================================
CORE PRINCIPLE: RICH DEPTH → CLEAR STRUCTURE → VISUAL HIERARCHY → CITATIONS
==================================================
- Do NOT artificially truncate or over-summarize. Provide comprehensive, in-depth explanations, thorough background context, detailed nuances, and complete answers that fully satisfy the query.
- Do NOT output generic conversational filler ("Sure! Here is...", "In conclusion...", "As an AI...").
- Do NOT over-card normal prose: explanations must live directly on the page. Use distinct sections with specific headings for different facets of the topic.
- Format for maximum readability: clear well-developed paragraphs (2–6 sentences each), strong section hierarchy with informative headings, detailed bullet points with bold labels, comparison/data tables where applicable, and actionable follow-ups.

==================================================
QUERY TYPES & STRUCTURE SPECIALIZATION
==================================================
Classify the query into its primary query_type and provide an exhaustive breakdown:
- "person": executive overview → hero image → biography & early life → major achievements / career milestones → key stats/records table → recent news / current status → legacy & impact → sources.
- "research_paper": executive summary → key discoveries & core claims → architecture/methodology breakdown → detailed benchmark/experiment results table → limitations & challenges → future directions → sources.
- "comparison": comprehensive verdict → detailed comparison table across all specs/metrics → in-depth breakdown of strengths & weaknesses per item → real-world recommendations for different use-cases → sources.
- "how_to": quick summary / outcome → prerequisites & requirements → detailed step-by-step instructions with key tips → common pitfalls & troubleshooting → sources.
- "product": executive overview → detailed specifications table → comprehensive pros & cons → performance & user experience analysis → pricing & alternative options → final buying verdict → sources.
- "concept" / "historical_topic" / "general_knowledge": clear direct explanation → underlying principles & mechanics → historical / real-world context → key debates or applications → future outlook → sources.

==================================================
INTERLEAVED MEDIA AS EDITORIAL ELEMENTS
==================================================
- Images must NOT simply be dumped at the end. Place relevant images immediately next to the section or paragraph they illustrate.
- Use only the image assets provided in the retrieved information. Never hallucinate or invent image URLs.
- Semantic image sizes:
  - "hero": full content width, primary image of the subject.
  - "large": full content width, important supporting image.
  - "medium": 75-85% content width, secondary visual.
  - "small" / "thumbnail": compact contextual visual.
- Use concise, factual captions (e.g., "Virat Kohli batting during the 2024 T20 World Cup final.").

==================================================
SOURCE / CITATION ATTACHMENT
==================================================
- Attach source references (e.g. ["source_1", "source_2"]) directly to the paragraph, bullet item, image, or table row that makes the claim.
- Never invent source IDs, URLs, or domains. Use the exact source IDs provided in the context.

==================================================
REQUIRED JSON OUTPUT FORMAT
==================================================
You MUST return ONLY valid JSON matching this exact structure:

{
  "title": "Comprehensive Title of Subject",
  "subtitle": "Informative 1-line subtitle or category",
  "query_type": "person | research_paper | comparison | how_to | product | concept | general_knowledge",
  "summary": {
    "content": "Rich 2-4 sentence direct answer or executive overview answering the query immediately with key insights.",
    "sources": ["source_1"]
  },
  "sections": [
    {
      "type": "heading",
      "content": "Specific Descriptive Section Heading"
    },
    {
      "type": "paragraph",
      "content": "Detailed, informative paragraph thoroughly explaining this specific facet of the topic with context and analytical depth.",
      "sources": ["source_1", "source_2"]
    },
    {
      "type": "image",
      "asset_id": "asset_1",
      "url": "https://exact-image-url-from-context",
      "source_url": "https://exact-source-url-from-context",
      "source_name": "Source Name",
      "size": "hero",
      "caption": "Short factual caption.",
      "sources": ["source_1"]
    },
    {
      "type": "bullets",
      "items": [
        {
          "label": "Key Insight / Feature",
          "content": "Detailed factual description, milestone, technical detail, or statistic.",
          "sources": ["source_1"]
        }
      ]
    },
    {
      "type": "table",
      "columns": ["Dimension / Metric", "Details / Value", "Notes"],
      "rows": [
        ["Row 1 Label", "Value 1", "Notes 1"],
        ["Row 2 Label", "Value 2", "Notes 2"]
      ],
      "sources": ["source_1"]
    }
  ],
  "sources": [
    {
      "id": "source_1",
      "title": "Source Page Title",
      "domain": "example.com",
      "url": "https://example.com/...",
      "publisher": "Publisher Name"
    }
  ],
  "follow_ups": [
    "In-depth follow-up question or exploration path 1",
    "In-depth follow-up question or exploration path 2",
    "In-depth follow-up question or exploration path 3"
  ]
}`;

// Provider configurations with verified active models
const PROVIDERS = {
    groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        models: ['qwen/qwen3.8-27b', 'qwen/qwen3.6-27b', 'llama-3.3-70b-versatile'],
        model: 'qwen/qwen3.8-27b',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }),
        envKey: 'GROQ_API_KEY'
    },
    openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        models: ['qwen/qwen-2.5-72b-instruct', 'meta-llama/llama-3.3-70b-instruct'],
        model: 'qwen/qwen-2.5-72b-instruct',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Asteroid AI Search'
        }),
        envKey: 'OPENROUTER_API_KEY'
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
        model: 'gemini-2.0-flash',
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        }),
        envKey: 'GEMINI_API_KEY',
        isGemini: true
    },
    zai: {
        url: 'https://api.zeroai.link/v1/chat/completions',
        models: ['gpt-4o'],
        model: 'gpt-4o',
        getHeaders: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }),
        envKey: 'ZAI_API_KEY'
    }
};

async function callOpenAICompatible(config, apiKey, messages, modelOverride = null) {
    const modelToUse = modelOverride || config.model;
    // Qwen 3.x thinking models need reasoning_format to suppress <think> tags
    const isThinkingModel = /qwen3/i.test(modelToUse);
    try {
        const baseBody = {
            model: modelToUse,
            messages: messages,
            temperature: 0.3,
            max_tokens: 4096,
        };

        // Add reasoning_format for thinking models to avoid <think> tags in output
        if (isThinkingModel) {
            baseBody.reasoning_format = 'hidden';
        }

        const response = await fetch(config.url, {
            method: 'POST',
            headers: config.getHeaders(apiKey),
            body: JSON.stringify({
                ...baseBody,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`${config.envKey} (${modelToUse}) JSON mode failed [${response.status}]:`, errText);
            // Retry without response_format
            const retryRes = await fetch(config.url, {
                method: 'POST',
                headers: config.getHeaders(apiKey),
                body: JSON.stringify(baseBody),
            });
            if (!retryRes.ok) {
                const retryErr = await retryRes.text();
                console.warn(`${config.envKey} (${modelToUse}) retry failed [${retryRes.status}]:`, retryErr);
                return null;
            }
            const retryData = await retryRes.json();
            let content = retryData.choices[0]?.message?.content || '';
            // Strip any <think>...</think> blocks that thinking models may emit
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            return { content, model: retryData.model || modelToUse };
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        // Strip any <think>...</think> blocks just in case
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return { content, model: data.model || modelToUse };
    } catch (err) {
        console.error(`${config.envKey} (${modelToUse}) fetch error:`, err.message);
        return null;
    }
}

async function callGemini(config, apiKey, systemPrompt, userMessage) {
    try {
        const url = config.url.includes('?') ? `${config.url}&key=${apiKey}` : `${config.url}?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json'
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error [', response.status, ']:', errorText);
            return null;
        }

        const data = await response.json();
        return {
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
            model: 'gemini-2.0-flash'
        };
    } catch (err) {
        console.error('Gemini fetch error:', err.message);
        return null;
    }
}

function buildMarkdownFromSections(title, summary, sections) {
    let md = '';
    if (summary?.content) {
        md += `${summary.content}\n\n`;
    }
    for (const s of sections) {
        if (s.type === 'heading') {
            md += `## ${s.content}\n\n`;
        } else if (s.type === 'paragraph') {
            md += `${s.content}\n\n`;
        } else if (s.type === 'bullets') {
            for (const b of s.items || []) {
                if (b.label) {
                    md += `- **${b.label}**: ${b.content}\n`;
                } else {
                    md += `- ${b.content}\n`;
                }
            }
            md += '\n';
        } else if (s.type === 'table' && s.columns && s.rows) {
            md += `| ${s.columns.join(' | ')} |\n`;
            md += `| ${s.columns.map(() => '---').join(' | ')} |\n`;
            for (const row of s.rows) {
                md += `| ${row.join(' | ')} |\n`;
            }
            md += '\n';
        }
    }
    return md.trim();
}

function parseEditorialArticle(rawContent, query, searchResults = [], images = []) {
    let parsed = null;

    // 1. Try direct JSON parse
    try {
        parsed = JSON.parse(rawContent);
    } catch (e) {
        // Try extracting JSON from code block
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[1]);
            } catch (innerErr) {}
        }
    }

    // Build map of provided sources
    const mappedSources = searchResults.map((s, idx) => ({
        id: `source_${idx + 1}`,
        number: idx + 1,
        title: s.title || s.siteName || `Source ${idx + 1}`,
        domain: s.siteName || (s.url ? new URL(s.url).hostname.replace('www.', '') : 'web'),
        url: s.url,
        publisher: s.siteName
    }));

    // If structured JSON was successfully produced:
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
        const markdown = buildMarkdownFromSections(parsed.title, parsed.summary, parsed.sections);
        const keyPoints = parsed.sections
            .find(s => s.type === 'bullets')
            ?.items?.map(i => i.label ? `**${i.label}**: ${i.content}` : i.content) || [];

        // If AI didn't include images, but images were retrieved, interleave up to 4 images between content sections
        const hasMedia = parsed.sections.some(s => s.type === 'image' || s.type === 'gallery');
        let finalSections = [...parsed.sections];
        if (!hasMedia && images && images.length > 0) {
            const validImages = images.slice(0, 4).filter(img => img.src || img.thumbnail);
            let imgIdx = 0;
            let contentCount = 0;
            for (let i = 0; i < finalSections.length && imgIdx < validImages.length; i++) {
                if (finalSections[i].type === 'paragraph' || finalSections[i].type === 'bullets') {
                    contentCount++;
                    // Place an image after every 2nd content section (or after the 1st if only few sections)
                    const totalContent = finalSections.filter(s => s.type === 'paragraph' || s.type === 'bullets').length;
                    const interval = totalContent <= 4 ? 1 : 2;
                    if (contentCount % interval === 0) {
                        finalSections.splice(i + 1, 0, {
                            type: 'image',
                            asset_id: `asset_${imgIdx + 1}`,
                            url: validImages[imgIdx].src || validImages[imgIdx].thumbnail,
                            source_url: validImages[imgIdx].url || '',
                            source_name: validImages[imgIdx].source || 'Web',
                            size: imgIdx === 0 ? 'large' : 'medium',
                            caption: validImages[imgIdx].title || query,
                            sources: []
                        });
                        imgIdx++;
                        i++;
                    }
                }
            }
        }

        return {
            title: parsed.title || query,
            subtitle: parsed.subtitle || '',
            query_type: parsed.query_type || 'general_knowledge',
            summary: parsed.summary || { content: '', sources: [] },
            answer: markdown,
            rawContent: markdown,
            sections: finalSections,
            keyPoints,
            sources: (parsed.sources && parsed.sources.length > 0) ? parsed.sources : mappedSources,
            follow_ups: parsed.follow_ups || [],
            relatedQuestions: parsed.follow_ups || [],
        };
    }

    // Fallback parser if LLM returned Markdown instead of JSON:
    const sections = [];
    const rawLines = rawContent.split('\n');
    let currentParagraph = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const text = currentParagraph.join(' ').trim();
            if (text) {
                sections.push({
                    type: 'paragraph',
                    content: text,
                    sources: []
                });
            }
            currentParagraph = [];
        }
    };

    for (const line of rawLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
            flushParagraph();
            sections.push({
                type: 'heading',
                content: trimmed.replace(/^#+\s*/, '').trim()
            });
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
            flushParagraph();
            const clean = trimmed.replace(/^[-•\d.]\s*/, '').trim();
            const colonIdx = clean.indexOf(':');
            if (colonIdx !== -1) {
                sections.push({
                    type: 'bullets',
                    items: [{
                        label: clean.slice(0, colonIdx).replace(/\*\*/g, '').trim(),
                        content: clean.slice(colonIdx + 1).trim(),
                        sources: []
                    }]
                });
            } else {
                sections.push({
                    type: 'bullets',
                    items: [{ content: clean, sources: [] }]
                });
            }
        } else if (trimmed.length === 0) {
            flushParagraph();
        } else {
            currentParagraph.push(trimmed);
        }
    }
    flushParagraph();

    // Interleave images in between paragraphs (not at the top)
    if (images && images.length > 0) {
        const validImages = images.slice(0, 4).filter(img => img.src || img.thumbnail);
        let imgIdx = 0;
        let contentCount = 0;
        for (let i = 0; i < sections.length && imgIdx < validImages.length; i++) {
            if (sections[i].type === 'paragraph' || sections[i].type === 'bullets') {
                contentCount++;
                // Place an image after every 2nd content section (or every section if few)
                const totalContent = sections.filter(s => s.type === 'paragraph' || s.type === 'bullets').length;
                const interval = totalContent <= 4 ? 1 : 2;
                if (contentCount % interval === 0) {
                    sections.splice(i + 1, 0, {
                        type: 'image',
                        asset_id: `asset_${imgIdx + 1}`,
                        url: validImages[imgIdx].src || validImages[imgIdx].thumbnail,
                        source_url: validImages[imgIdx].url || '',
                        source_name: validImages[imgIdx].source || 'Web',
                        size: imgIdx === 0 ? 'large' : 'medium',
                        caption: validImages[imgIdx].title || query,
                        sources: []
                    });
                    imgIdx++;
                    i++;
                }
            }
        }
    }

    const firstParagraph = sections.find(s => s.type === 'paragraph')?.content || '';
    let summaryContent = '';
    if (firstParagraph) {
        const match = firstParagraph.trim().match(/^([^.!?]+[.!?])/);
        summaryContent = (match && match[1].length >= 35) ? match[1].trim() : firstParagraph;
    } else if (rawContent) {
        const match = rawContent.trim().match(/^([^.!?]+[.!?])/);
        summaryContent = (match && match[1].length >= 35) ? match[1].trim() : rawContent.trim().slice(0, 250);
    }

    return {
        title: query,
        subtitle: '',
        query_type: 'general_knowledge',
        summary: {
            content: summaryContent,
            sources: ['source_1']
        },
        answer: rawContent,
        rawContent: rawContent,
        sections,
        keyPoints: sections.find(s => s.type === 'bullets')?.items?.map(i => i.label ? `**${i.label}**: ${i.content}` : i.content) || [],
        sources: mappedSources,
        follow_ups: [],
        relatedQuestions: [],
    };
}

export async function POST(request) {
    try {
        // ── 1. Rate Limiting ─────────────────────────────
        const { identifier, userId } = await getRateLimitIdentifier(request);
        const rateLimit = await checkRateLimit(identifier, {
            windowMs: 60_000,   // 1 minute
            maxRequests: 5,     // 5 prompts per minute
            prefix: 'rl:ai',
        });

        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit);
        }

        const {
            query,
            searchResults = [],
            images = [],
            model = 'groq',
            contextTitle = '',
            conversationHistory = [],
        } = await request.json();
        const analyticsCtx = { ...extractContext(request), route: 'ai', userId };

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // ── 2. Cache Lookup ──────────────────────────────
        const cacheKey = makeCacheKey('ai_editorial_v2', { query, model, contextTitle: contextTitle || '' });
        const cached = await getCached(cacheKey);

        if (cached) {
            trackEvent(EVENTS.CACHE_HIT, { query, model, route: 'ai' }, analyticsCtx);
            return NextResponse.json({ ...cached, fromCache: true });
        }

        trackEvent(EVENTS.CACHE_MISS, { query, model, route: 'ai' }, analyticsCtx);
        trackEvent(EVENTS.AI_PROMPT, { query, model }, analyticsCtx);

        // Build conversation history context if available
        let historyContext = '';
        if (contextTitle) {
            historyContext += `Primary Conversation Subject: "${contextTitle}"\n`;
        }
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
            historyContext += `Previous Exchanges in this Thread:\n` +
                conversationHistory.map((h, i) => `${i + 1}. User asked: "${h.query}"\n   Answer Summary: ${h.summary || h.answer || ''}`).join('\n\n');
        }

        // Build structured source references
        const sourcesContext = searchResults.slice(0, 12).map((result, index) =>
            `[source_${index + 1}] Title: ${result.title}
Domain: ${result.siteName}
URL: ${result.url}
Snippet: ${result.description}
${result.extraSnippets?.join(' ') || ''}`
        ).join('\n\n---\n\n');

        // Build structured image asset references
        const imagesContext = images.slice(0, 6).map((img, index) =>
            `[asset_${index + 1}] Title: ${img.title || 'Image'}
Image URL: ${img.src || img.thumbnail}
Source URL: ${img.url || ''}
Source Name: ${img.source || ''}`
        ).join('\n');

        const userMessage = `${historyContext ? `CONVERSATION THREAD CONTEXT (Resolve pronouns like "he/she/it/his/they" based on this subject):\n${historyContext}\n\n==================================================\n` : ''}USER QUERY: "${query}"

RETRIEVED SOURCES:
${sourcesContext || 'No external sources available.'}

AVAILABLE IMAGE ASSETS (Interleave ONLY where relevant using exact URLs):
${imagesContext || 'No image assets available.'}

Generate the structured JSON knowledge article according to your instructions.`;

        // ── Provider selection with automatic failover ────────
        const preferredProvider = PROVIDERS[model] || PROVIDERS.groq;
        const orderedProviders = [
            preferredProvider,
            ...Object.values(PROVIDERS).filter((p) => p !== preferredProvider),
        ];

        let result = null;
        let hadAnyKey = false;
        for (const config of orderedProviders) {
            const apiKey = process.env[config.envKey];
            if (!apiKey) continue;
            hadAnyKey = true;

            console.log(`[AI] Trying provider: ${config.envKey} → model: ${config.model}`);

            if (config.isGemini) {
                result = await callGemini(config, apiKey, SYSTEM_PROMPT, userMessage);
            } else {
                const messages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ];
                result = await callOpenAICompatible(config, apiKey, messages);
            }

            if (result?.content) {
                console.log(`[AI] ✓ Success from ${config.envKey} (${result.model}) — content length: ${result.content.length} chars`);
                break;
            } else {
                console.log(`[AI] ✗ ${config.envKey} returned empty content, trying next...`);
            }
        }

        if (!hadAnyKey) {
            return NextResponse.json({ error: 'No AI API keys configured' }, { status: 503 });
        }

        if (!result?.content) {
            return NextResponse.json({ error: 'All AI providers failed to respond' }, { status: 502 });
        }

        // Parse into the master Editorial Article structure
        const article = parseEditorialArticle(result.content, query, searchResults, images);
        console.log(`[AI] Parsed article: ${article.sections?.length || 0} sections, title: "${article.title}", images in search: ${images?.length || 0}`);
        const finalResponse = {
            ...article,
            model: result.model,
            isAI: true,
        };

        // Cache for 6 hours
        await setCache(cacheKey, finalResponse, 21600);

        return NextResponse.json(finalResponse);
    } catch (error) {
        console.error('AI synthesis error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
