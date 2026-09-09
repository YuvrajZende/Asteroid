/**
 * KeyTakeawaysCard — Component 1:
 * "Key takeaways" header (small blue dot + label), followed by a stack of cards.
 * Each card has a circular numbered badge (blue, e.g. "1") on the left, and to its right:
 * a bold short title inline with body text, then 1-2 sentences, ending with blue clickable citation numbers.
 */
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { SourceRef } from '@/types/api';

export interface TakeawayItem {
  number?: number;
  title?: string;
  text: string;
}

interface KeyTakeawaysCardProps {
  items: (TakeawayItem | string)[];
  sources?: SourceRef[];
  onCitationPress?: (sourceNum: number) => void;
}

export function KeyTakeawaysCard({ items, sources = [], onCitationPress }: KeyTakeawaysCardProps) {
  if (!items || items.length === 0) return null;

  const renderFormattedText = (rawTitle: string | undefined, rawText: string) => {
    let fullText = (rawText || '').trim();
    let title = rawTitle;

    // If title was in markdown format e.g. **Title**: Body or **Title** - Body
    if (!title && fullText.includes('**')) {
      const match = fullText.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)$/);
      if (match) {
        title = match[1].trim();
        fullText = match[2].trim();
      }
    }

    // Split text by bold (**bold**) and citations ([1])
    const tokens = fullText.split(/(\*\*[^*]+\*\*|\[\d+\])/g);

    return (
      <Text style={styles.bodyText}>
        {!!title && <Text style={styles.titleText}>{title}: </Text>}
        {tokens.map((token, idx) => {
          if (!token) return null;

          if (token.startsWith('**') && token.endsWith('**')) {
            return (
              <Text key={idx} style={styles.inlineBoldText}>
                {token.slice(2, -2)}
              </Text>
            );
          }

          const citeMatch = token.match(/^\[(\d+)\]$/);
          if (citeMatch) {
            const num = parseInt(citeMatch[1], 10);
            const source = sources.find((s) => s.number === num);
            return (
              <Text
                key={idx}
                style={styles.citationText}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  if (onCitationPress) {
                    onCitationPress(num);
                  } else if (source?.url) {
                    Linking.openURL(source.url).catch(() => {});
                  }
                }}
              >
                {' '}[{num}]
              </Text>
            );
          }

          return <Text key={idx}>{token}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with blue dot */}
      <View style={styles.headerRow}>
        <View style={styles.blueDot} />
        <Text style={styles.headerLabel}>Key takeaways</Text>
      </View>

      {/* Stack of distinct cards */}
      <View style={styles.cardsStack}>
        {items.map((item, idx) => {
          const number = typeof item === 'object' ? item.number ?? idx + 1 : idx + 1;
          const text = typeof item === 'object' ? item.text : item;
          const title = typeof item === 'object' ? item.title : undefined;

          return (
            <View key={idx} style={styles.card}>
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>{number}</Text>
              </View>
              <View style={styles.contentWrap}>
                {renderFormattedText(title, text)}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing(1.5),
    gap: spacing(1.5),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  headerLabel: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardsStack: {
    gap: spacing(1.5),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#16181C',
    borderRadius: 18,
    padding: spacing(2.5),
    gap: spacing(2),
    alignItems: 'flex-start',
  },
  badgeWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 155, 240, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  badgeText: {
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    color: colors.accent,
  },
  contentWrap: {
    flex: 1,
  },
  titleText: {
    fontFamily: font.bodySemi,
    fontSize: 14.5,
    color: colors.text,
    lineHeight: 22,
  },
  bodyText: {
    fontFamily: font.body,
    fontSize: 14.5,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  inlineBoldText: {
    fontFamily: font.bodySemi,
    color: '#FFFFFF',
  },
  citationText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: colors.accent,
  },
});
