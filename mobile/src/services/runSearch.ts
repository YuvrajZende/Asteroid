/**
 * Search orchestration — mirrors the web app's two-call flow:
 *   code intent  → POST /api/code directly
 *   otherwise    → POST /api/search → POST /api/ai
 * Graceful degrade (spec §8): if AI synthesis fails (but it is NOT a
 * rate limit), return ai=null so the UI shows raw web results labelled
 * "AI briefly unavailable". Rate limits propagate to the RateLimitCard.
 */
import { generateCode, searchWeb, synthesize } from '@/services/api';
import { isCodeRequest, isFixRequest } from '@/services/intentDetector';
import type { AIResponse, CodeResponse, ModelId, SearchResponse } from '@/types/api';

export type RunResult =
  | { type: 'search'; search: SearchResponse; ai: AIResponse | null }
  | { type: 'code'; code: CodeResponse };

export async function runSearch(
  query: string,
  model: ModelId,
  contextTitle = '',
  conversationHistory: Array<{ query: string; answer?: string; summary?: string }> = [],
  onProgress?: (stage: 'searching' | 'synthesizing', search?: SearchResponse) => void,
): Promise<RunResult> {
  if (isCodeRequest(query)) {
    const code = await generateCode(query, isFixRequest(query), model);
    return { type: 'code', code };
  }

  // If this is a follow-up query with a parent context topic, contextualize the search
  let webQuery = query.trim();
  if (contextTitle && contextTitle.toLowerCase() !== query.toLowerCase()) {
    const lowerQ = query.toLowerCase();
    const lowerContext = contextTitle.toLowerCase();
    if (!lowerQ.includes(lowerContext)) {
      const hasPronouns = /\b(he|him|his|she|her|it|its|they|them|their|these|those)\b/i.test(query);
      const isShort = query.split(/\s+/).length <= 7;
      if (hasPronouns || isShort) {
        webQuery = `${contextTitle} ${query}`;
      }
    }
  }

  const search = await searchWeb(webQuery);

  // Instantly push the real web sources to the UI so ResearchAgentProgress renders real websites
  onProgress?.('synthesizing', search);

  let ai: AIResponse | null = null;
  try {
    ai = await synthesize(query, search.webResults ?? [], model, search.images ?? [], contextTitle, conversationHistory);
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitError') throw err;
    console.warn(`[runSearch] Primary model ${model} synthesis failed, failing over to Gemini:`, err);
    if (model !== 'gemini') {
      try {
        ai = await synthesize(query, search.webResults ?? [], 'gemini', search.images ?? [], contextTitle, conversationHistory);
      } catch (fallbackErr) {
        console.error('[runSearch] Gemini fallback also failed:', fallbackErr);
        ai = null;
      }
    } else {
      ai = null;
    }
  }

  return { type: 'search', search, ai };
}
