/**
 * Editorial Article Types for Answer Presentation Engine
 */

export type EditorialImageSize = 'hero' | 'large' | 'medium' | 'small' | 'thumbnail';

export interface EditorialBulletItem {
  label?: string;
  content: string;
  sources?: string[];
}

export type EditorialSection =
  | {
      type: 'heading';
      content: string;
    }
  | {
      type: 'paragraph';
      content: string;
      sources?: string[];
    }
  | {
      type: 'bullets';
      items: EditorialBulletItem[];
    }
  | {
      type: 'image';
      asset_id?: string;
      url: string;
      thumbnail_url?: string;
      source_url?: string;
      source_name?: string;
      size?: EditorialImageSize;
      caption?: string;
      sources?: string[];
    }
  | {
      type: 'gallery';
      images: Array<{
        url: string;
        thumbnail_url?: string;
        source_url?: string;
        source_name?: string;
        caption?: string;
      }>;
      sources?: string[];
    }
  | {
      type: 'table';
      columns: string[];
      rows: string[][];
      sources?: string[];
    }
  | {
      type: 'card';
      card_type?: string;
      title?: string;
      content: string;
      sources?: string[];
    };

export interface EditorialSource {
  id: string;
  number?: number;
  title?: string;
  domain?: string;
  url?: string;
  favicon_url?: string;
  publisher?: string;
}

export interface EditorialArticle {
  title: string;
  subtitle?: string;
  query_type?: string;
  summary?: {
    content: string;
    sources?: string[];
  };
  sections: EditorialSection[];
  sources: EditorialSource[];
  follow_ups?: string[];
  rawContent?: string;
  model?: string;
  isAI?: boolean;
}
