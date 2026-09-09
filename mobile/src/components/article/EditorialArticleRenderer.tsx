/**
 * EditorialArticleRenderer — Answer Presentation Engine for Mobile
 *
 * Implements:
 * CONTENT → STRUCTURE → VISUAL HIERARCHY → SOURCES → MEDIA
 *
 * 1) Continuous editorial prose directly on the canvas (no over-carding)
 * 2) Meaningful section headings
 * 3) Concise bullet collections with bold labels
 * 4) Interleaved image assets at exact semantic sizes (hero, large, medium) with captions
 * 5) Structured comparison / data tables
 * 6) Compact source chips [ wikipedia +1 ]
 * 7) Actionable follow-up suggestion chips
 */
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ChevronRight, ExternalLink, Sparkles } from 'lucide-react-native';
import { SourceChip } from './SourceChip';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { EditorialArticle, EditorialSection, EditorialSource } from '@/types/article';

interface EditorialArticleRendererProps {
  article: EditorialArticle;
  onFollowUpPress?: (query: string) => void;
}

export function EditorialArticleRenderer({
  article,
  onFollowUpPress,
}: EditorialArticleRendererProps) {
  if (!article) return null;

  const sources: EditorialSource[] = article.sources || [];
  const sections: EditorialSection[] = article.sections || [];
  const summary = article.summary;
  const followUps = article.follow_ups || [];

  const renderInlineFormatted = (text: string) => {
    if (!text) return null;
    const tokens = text.split(/(\*\*[^*]+\*\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <Text key={idx} style={styles.boldText}>
            {token.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={idx}>{token}</Text>;
    });
  };

  return (
    <View style={styles.container}>
      {/* ── Summary / Lead Overview ── */}
      {!!summary?.content && (
        <View style={styles.leadWrap}>
          <Text style={styles.leadText}>
            {renderInlineFormatted(summary.content)}
            {summary.sources && summary.sources.length > 0 && (
              <SourceChip sourceIds={summary.sources} sources={sources} />
            )}
          </Text>
        </View>
      )}

      {/* ── Editorial Sections Flow ── */}
      {sections.map((section, sIdx) => {
        if (!section || !section.type) return null;

        switch (section.type) {
          case 'heading':
            return (
              <View key={sIdx} style={styles.headingWrap}>
                <Text style={styles.headingText}>{section.content}</Text>
              </View>
            );

          case 'paragraph': {
            // Avoid duplicate rendering if summary already displayed this content
            const isDuplicateOfSummary = !!summary?.content && (
              section.content.trim() === summary.content.trim() ||
              summary.content.trim().startsWith(section.content.trim()) ||
              section.content.trim().startsWith(summary.content.trim())
            );
            if (isDuplicateOfSummary) return null;

            return (
              <View key={sIdx} style={styles.paragraphWrap}>
                <Text style={styles.paragraphText}>
                  {renderInlineFormatted(section.content)}
                  {section.sources && section.sources.length > 0 && (
                    <SourceChip sourceIds={section.sources} sources={sources} />
                  )}
                </Text>
              </View>
            );
          }

          case 'bullets':
            if (!section.items || section.items.length === 0) return null;
            return (
              <View key={sIdx} style={styles.bulletsWrap}>
                {section.items.map((item, bIdx) => (
                  <View key={bIdx} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>
                      {!!item.label && <Text style={styles.bulletLabel}>{item.label}: </Text>}
                      {renderInlineFormatted(item.content)}
                      {item.sources && item.sources.length > 0 && (
                        <SourceChip sourceIds={item.sources} sources={sources} />
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            );

          case 'gallery':
            if (!section.images || section.images.length === 0) return null;
            return (
              <View key={sIdx} style={styles.gallerySection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {section.images.map((img, imgIdx) => (
                    <Pressable
                      key={imgIdx}
                      style={({ pressed }) => [
                        styles.galleryCard,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}
                      onPress={() => {
                        const target = img.source_url || img.url;
                        if (target) Linking.openURL(target).catch(() => {});
                      }}
                    >
                      <Image
                        source={{ uri: img.url || img.thumbnail_url }}
                        style={styles.galleryImage}
                        contentFit="cover"
                        transition={200}
                      />
                      {(!!img.caption || !!img.source_name) && (
                        <View style={styles.galleryCaptionPill}>
                          <Text style={styles.galleryCaptionText} numberOfLines={1}>
                            {img.caption || img.source_name}
                          </Text>
                          {!!img.source_name && (
                            <Text style={styles.gallerySourceText} numberOfLines={1}>
                              {img.source_name}
                            </Text>
                          )}
                        </View>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );

          case 'image':
            if (!section.url) return null;
            const size = section.size || 'large';
            const isHero = size === 'hero';
            const isMedium = size === 'medium';
            const isSmall = size === 'small' || size === 'thumbnail';

            return (
              <View
                key={sIdx}
                style={[
                  styles.imageSection,
                  isMedium && styles.imageSectionMedium,
                  isSmall && styles.imageSectionSmall,
                ]}
              >
                <Pressable
                  style={[
                    styles.imageWrap,
                    isHero ? styles.imageWrapHero : isMedium ? styles.imageWrapMedium : isSmall ? styles.imageWrapSmall : styles.imageWrapLarge,
                  ]}
                  onPress={() => {
                    const target = section.source_url || section.url;
                    if (target) Linking.openURL(target).catch(() => {});
                  }}
                >
                  <Image
                    source={{ uri: section.url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                </Pressable>

                {/* Factual Caption */}
                {(!!section.caption || !!section.source_name) && (
                  <View style={styles.captionRow}>
                    <Text style={styles.captionText} numberOfLines={2}>
                      {section.caption || ''}
                      {!!section.source_name && (
                        <Text style={styles.captionSource}> ({section.source_name})</Text>
                      )}
                    </Text>
                    {section.sources && section.sources.length > 0 && (
                      <SourceChip sourceIds={section.sources} sources={sources} />
                    )}
                  </View>
                )}
              </View>
            );

          case 'table':
            if (!section.columns || section.columns.length === 0 || !section.rows) return null;
            return (
              <View key={sIdx} style={styles.tableSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                      {section.columns.map((col, cIdx) => (
                        <Text key={cIdx} style={styles.tableHeaderCell}>
                          {col}
                        </Text>
                      ))}
                    </View>

                    {/* Body Rows */}
                    {section.rows.map((row, rIdx) => (
                      <View
                        key={rIdx}
                        style={[
                          styles.tableRow,
                          rIdx % 2 === 1 && styles.tableRowAlt,
                        ]}
                      >
                        {row.map((cell, cellIdx) => (
                          <Text key={cellIdx} style={styles.tableCell}>
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );

          case 'card':
            return (
              <View key={sIdx} style={styles.calloutCard}>
                {!!section.title && <Text style={styles.calloutTitle}>{section.title}</Text>}
                <Text style={styles.calloutText}>
                  {renderInlineFormatted(section.content)}
                  {section.sources && section.sources.length > 0 && (
                    <SourceChip sourceIds={section.sources} sources={sources} />
                  )}
                </Text>
              </View>
            );

          default:
            return null;
        }
      })}

      {/* ── Follow-Up Directions ── */}
      {followUps.length > 0 && (
        <View style={styles.followUpsSection}>
          <Text style={styles.followUpsTitle}>Explore further</Text>
          <View style={styles.followUpsList}>
            {followUps.map((q, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.followUpChip, pressed && styles.followUpPressed]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onFollowUpPress?.(q);
                }}
              >
                <Text style={styles.followUpText}>{q}</Text>
                <ChevronRight size={15} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing(1.5),
  },

  /* Lead Summary */
  leadWrap: {
    marginBottom: spacing(2.5),
  },
  leadText: {
    fontFamily: font.editorial,
    fontSize: 16.5,
    lineHeight: 26,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  /* Section Heading */
  headingWrap: {
    marginTop: spacing(3.5),
    marginBottom: spacing(1.25),
  },
  headingText: {
    fontFamily: font.heading,
    fontSize: 21,
    lineHeight: 28,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  /* Paragraph */
  paragraphWrap: {
    marginVertical: spacing(0.75),
  },
  paragraphText: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 24.5,
    color: '#D1D5DB',
  },
  boldText: {
    fontFamily: font.bodySemi,
    color: '#FFFFFF',
  },

  /* Bullets */
  bulletsWrap: {
    marginVertical: spacing(1.25),
    gap: spacing(1.25),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 22.5,
    color: '#D1D5DB',
  },
  bulletLabel: {
    fontFamily: font.bodySemi,
    color: '#FFFFFF',
  },

  /* Interleaved Images */
  imageSection: {
    marginVertical: spacing(2),
    gap: 6,
  },
  imageSectionMedium: {
    width: '85%',
    alignSelf: 'center',
  },
  imageSectionSmall: {
    width: '60%',
    alignSelf: 'flex-start',
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#16181C',
  },
  imageWrapHero: {
    height: 220,
  },
  imageWrapLarge: {
    height: 190,
  },
  imageWrapMedium: {
    height: 160,
  },
  imageWrapSmall: {
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  captionText: {
    fontFamily: font.body,
    fontSize: 12,
    color: '#8E959E',
    flex: 1,
  },
  captionSource: {
    color: '#6B7280',
  },

  /* Multi-Image Gallery */
  gallerySection: {
    marginVertical: spacing(2),
    marginHorizontal: -spacing(1),
  },
  galleryScroll: {
    paddingHorizontal: spacing(1),
    gap: 12,
  },
  galleryCard: {
    width: 220,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#16181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryCaptionPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(10, 14, 23, 0.88)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  galleryCaptionText: {
    fontFamily: font.bodyMedium,
    fontSize: 11,
    color: '#F1F5F9',
    flex: 1,
  },
  gallerySourceText: {
    fontFamily: font.body,
    fontSize: 10,
    color: '#94A3B8',
  },

  /* Table (Structured Data & Technical Values with JetBrains Mono) */
  tableSection: {
    marginVertical: spacing(2),
    backgroundColor: '#16181C',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  table: {
    minWidth: 320,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableHeaderCell: {
    flex: 1,
    minWidth: 100,
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableCell: {
    flex: 1,
    minWidth: 100,
    fontFamily: font.mono,
    fontSize: 12.5,
    color: '#D1D5DB',
  },

  /* Callout Card */
  calloutCard: {
    backgroundColor: '#16181C',
    borderRadius: 16,
    padding: spacing(2),
    marginVertical: spacing(1.5),
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    gap: 6,
  },
  calloutTitle: {
    fontFamily: font.heading,
    fontSize: 15,
    color: '#FFFFFF',
  },
  calloutText: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#D1D5DB',
  },

  /* Follow-ups */
  followUpsSection: {
    marginTop: spacing(4),
    paddingTop: spacing(2),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing(1.5),
  },
  followUpsTitle: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  followUpsList: {
    gap: spacing(1),
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16181C',
    borderRadius: 14,
    paddingHorizontal: spacing(2),
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  followUpPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  followUpText: {
    fontFamily: font.bodyMedium,
    fontSize: 13.5,
    color: '#D1D5DB',
    flex: 1,
  },
});
