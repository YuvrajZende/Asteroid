/**
 * DetailText — Component 2:
 * Paragraph block for explanations. Bold key terms inline, blue inline citation numbers [2] as tap targets.
 */
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { SourceRef } from '@/types/api';

interface DetailTextProps {
  content: string;
  title?: string;
  sources?: SourceRef[];
  onCitationPress?: (sourceNum: number) => void;
}

export function DetailText({ content, title, sources = [], onCitationPress }: DetailTextProps) {
  if (!content) return null;

  const renderInlineFormatted = (text: string) => {
    // Break into paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph, pIdx) => {
      // Split by bold (**bold**) and citations ([1])
      const tokens = paragraph.split(/(\*\*[^*]+\*\*|\[\d+\])/g);

      return (
        <Text key={pIdx} style={styles.paragraph}>
          {tokens.map((token, tIdx) => {
            if (token.startsWith('**') && token.endsWith('**')) {
              return (
                <Text key={tIdx} style={styles.boldText}>
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
                  key={tIdx}
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

            return <Text key={tIdx}>{token}</Text>;
          })}
        </Text>
      );
    });
  };

  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.cardHeaderTitle}>{title}</Text>}
      {renderInlineFormatted(content)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16181C',
    borderRadius: 18,
    padding: spacing(2.5),
    marginVertical: spacing(1.5),
    gap: spacing(1.5),
  },
  cardHeaderTitle: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  paragraph: {
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 23,
    color: '#D1D5DB',
  },
  boldText: {
    fontFamily: font.bodySemi,
    color: '#FFFFFF',
  },
  citationText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: colors.accent,
  },
});
