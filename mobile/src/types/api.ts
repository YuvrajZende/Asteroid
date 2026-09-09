/**
 * API contract types — mirrored 1:1 from the Next.js route handlers
 * (see docs/superpowers/specs/2026-08-28-asteroid-mobile-design.md §3).
 * All list fields are optional: clients parse defensively so a partial
 * backend response degrades visually instead of crashing.
 */

export type ModelId = 'groq' | 'gemini' | 'openrouter' | 'zai';

// ── POST /api/search ──────────────────────────────────────────
export interface WebResult {
  title?: string;
  url?: string;
  description?: string;
  favicon?: string;
  siteName?: string;
  position?: number;
}

export interface ImageResult {
  src?: string;
  thumbnail?: string;
  title?: string;
  url?: string;
  source?: string;
}

export interface AnswerBox {
  title?: string;
  answer?: string;
  source?: string;
}

export interface PaaItem {
  question?: string;
  answer?: string;
  source?: string;
}

export interface KnowledgeGraph {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  attributes?: Record<string, string>;
}

export interface SearchResponse {
  query?: string;
  webResults?: WebResult[];
  images?: ImageResult[];
  knowledgeGraph?: KnowledgeGraph | null;
  relatedSearches?: string[];
  answerBox?: AnswerBox | null;
  peopleAlsoAsk?: PaaItem[];
  totalResults?: number;
}

// ── POST /api/ai ──────────────────────────────────────────────
export interface SourceRef {
  number: number;
  title?: string;
  url?: string;
  siteName?: string;
}

export interface AISection {
  title?: string;
  content?: string;
}

export interface AIResponse {
  title?: string;
  subtitle?: string;
  query_type?: string;
  summary?: {
    content: string;
    sources?: string[];
  } | string;
  answer?: string;
  rawContent?: string;
  sections?: import('./article').EditorialSection[] | AISection[];
  keyPoints?: string[];
  relatedQuestions?: string[];
  sources?: any[];
  blocks?: import('@/types/blocks').Block[];
  follow_ups?: string[];
  isAI?: boolean;
  model?: string;
  fromCache?: boolean;
}

// ── POST /api/code ────────────────────────────────────────────
export interface CodeBlock {
  language?: string;
  syntax?: string;
  code?: string;
}

export interface CodeResponse {
  solution?: string;
  codeBlocks?: CodeBlock[];
  explanation?: string;
  rawContent?: string;
  fromCache?: boolean;
}

// ── GET /api/news ─────────────────────────────────────────────
export interface NewsArticle {
  id?: number;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  source?: string;
  publishedAt?: string;
}

export interface NewsResponse {
  articles?: NewsArticle[];
  totalResults?: number;
  category?: string;
  fetchedAt?: string;
  cached?: boolean;
  stale?: boolean;
  fromCache?: boolean;
}

// ── GET /api/research ─────────────────────────────────────────
export interface Paper {
  id?: number;
  title?: string;
  snippet?: string;
  link?: string;
  authors?: string;
  source?: string;
  citedBy?: number;
  year?: string;
  pdfLink?: string | null;
}

export interface ResearchResponse {
  papers?: Paper[];
  totalResults?: number;
  category?: string;
  fetchedAt?: string;
  cached?: boolean;
  stale?: boolean;
  fromCache?: boolean;
}

// ── POST /api/social ──────────────────────────────────────────
export interface SocialPost {
  title?: string;
  snippet?: string;
  url?: string;
  source?: string;
  subreddit?: string;
  username?: string;
}

export interface SocialResponse {
  reddit?: SocialPost[];
  twitter?: SocialPost[];
  total?: number;
  fromCache?: boolean;
}

// ── Supabase Library (shared with web) ────────────────────────
export type SearchType = 'search' | 'research' | 'code';

export interface LibraryRow {
  id?: number;
  searchInput?: string;
  userEmail?: string;
  type?: string;
  libId?: string;
  created_at?: string;
}
