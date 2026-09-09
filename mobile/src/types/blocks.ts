/**
 * Blocks Data Model for Perplexity / Asteroid Structured AI Answers
 */
import type { ImageResult, SourceRef } from '@/types/api';
import type { TakeawayItem } from '@/components/blocks/KeyTakeawaysCard';
import type { FactItem } from '@/components/blocks/FactGrid';
import type { CategoryItem } from '@/components/blocks/CategoryList';
import type { ProductCardProps } from '@/components/blocks/ProductCard';

export type Block =
  | {
      type: 'key_takeaways';
      items: (TakeawayItem | string)[];
    }
  | {
      type: 'detail';
      title?: string;
      content: string;
    }
  | {
      type: 'fact_grid';
      title?: string;
      subtitle?: string;
      image?: string;
      facts: FactItem[];
    }
  | {
      type: 'category_list';
      title?: string;
      categories: CategoryItem[];
    }
  | {
      type: 'image_gallery';
      images: ImageResult[];
    }
  | {
      type: 'product_card';
      product: ProductCardProps;
    }
  | {
      type: 'sources';
      sources: SourceRef[];
    };
