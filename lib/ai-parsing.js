/**
 * Parses a structured AI response with markdown headers into sections,
 * summary, key points, and related questions.
 * 
 * @param {string} content Raw AI response content
 * @returns {object} Structured response data
 */
export function parseAIResponse(content) {
    const sections = [];
    let summary = '';
    let keyPoints = [];
    let relatedQuestions = [];

    if (!content) return { summary: '', sections: [], keyPoints: [], relatedQuestions: [], rawContent: '' };

    // Try to parse structured response with ## headers
    // We filter for lines that start with ## (case-insensitive for comparison)
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
        rawContent: content
    };
}
