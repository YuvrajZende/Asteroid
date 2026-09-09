/**
 * BlockRenderer — Renders distinct structured UI components ("blocks")
 * dynamically based on block.type:
 *
 * 1) key_takeaways -> KeyTakeawaysCard
 * 2) detail -> DetailText
 * 3) fact_grid -> FactGrid
 * 4) category_list -> CategoryList
 * 5) image_gallery -> ImageGalleryStrip
 * 6) product_card -> ProductCard
 * 7) sources -> SourcesRow
 */
import React from 'react';
import { View } from 'react-native';
import type { Block } from '@/types/blocks';
import type { SourceRef } from '@/types/api';
import { KeyTakeawaysCard } from './KeyTakeawaysCard';
import { DetailText } from './DetailText';
import { FactGrid } from './FactGrid';
import { CategoryList } from './CategoryList';
import { ImageGalleryStrip } from './ImageGalleryStrip';
import { ProductCard } from './ProductCard';
import { SourcesRow } from './SourcesRow';

interface BlockRendererProps {
  blocks: Block[];
  sources?: SourceRef[];
  onCitationPress?: (sourceNum: number) => void;
}

export function BlockRenderer({ blocks, sources = [], onCitationPress }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <View style={{ gap: 4 }}>
      {blocks.map((block, index) => {
        if (!block || !block.type) return null;

        switch (block.type) {
          case 'key_takeaways':
            if (!block.items || block.items.length === 0) return null;
            return (
              <KeyTakeawaysCard
                key={index}
                items={block.items}
                sources={sources}
                onCitationPress={onCitationPress}
              />
            );

          case 'detail':
            if (!block.content) return null;
            return (
              <DetailText
                key={index}
                title={block.title}
                content={block.content}
                sources={sources}
                onCitationPress={onCitationPress}
              />
            );

          case 'fact_grid':
            if (!block.facts || block.facts.length === 0) return null;
            return (
              <FactGrid
                key={index}
                title={block.title}
                subtitle={block.subtitle}
                image={block.image}
                facts={block.facts}
              />
            );

          case 'category_list':
            if (!block.categories || block.categories.length === 0) return null;
            return (
              <CategoryList
                key={index}
                title={block.title}
                categories={block.categories}
              />
            );

          case 'image_gallery':
            if (!block.images || block.images.length === 0) return null;
            return <ImageGalleryStrip key={index} images={block.images} />;

          case 'product_card':
            if (!block.product) return null;
            return <ProductCard key={index} {...block.product} />;

          case 'sources':
            if (!block.sources || block.sources.length === 0) return null;
            return <SourcesRow key={index} sources={block.sources} />;

          default:
            return null;
        }
      })}
    </View>
  );
}
