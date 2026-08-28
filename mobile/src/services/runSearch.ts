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

export async function runSearch(query: string, model: ModelId): Promise<RunResult> {
  if (isCodeRequest(query)) {
    const code = await generateCode(query, isFixRequest(query), model);
    return { type: 'code', code };
  }

  const search = await searchWeb(query);

  let ai: AIResponse | null = null;
  try {
    ai = await synthesize(query, search.webResults ?? [], model);
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitError') throw err;
    // Degrade: show web results without synthesis
    ai = null;
  }

  return { type: 'search', search, ai };
}
