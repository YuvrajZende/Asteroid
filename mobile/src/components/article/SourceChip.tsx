/**
 * SourceChip — Compact source reference chip
 * Renders e.g. [ wikipedia ] or [ espncricinfo +1 ] next to claims
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, font, radius } from '@/theme/theme';
import type { EditorialSource } from '@/types/article';

interface SourceChipProps {
  sourceIds?: string[];
  sources?: EditorialSource[];
}

export function SourceChip({ sourceIds = [], sources = [] }: SourceChipProps) {
  if (!sourceIds || sourceIds.length === 0 || !sources || sources.length === 0) return null;

  const matched = sourceIds
    .map((id) => {
      // Find by exact id (e.g. "source_1") or numerical index
      const numMatch = id.match(/(\d+)/);
      const num = numMatch ? parseInt(numMatch[1], 10) : null;
      return (
        sources.find((s) => s.id === id) ||
        (num !== null ? sources.find((s) => s.number === num || s.id === `source_${num}`) : null) ||
        (num !== null && sources[num - 1] ? sources[num - 1] : null)
      );
    })
    .filter(Boolean) as EditorialSource[];

  if (matched.length === 0) return null;

  const first = matched[0];
  const count = matched.length;
  const domain = first.domain || first.publisher || (first.url ? new URL(first.url).hostname.replace('www.', '') : 'source');
  const label = count > 1 ? `${domain} +${count - 1}` : domain;

  const handlePress = () => {
    if (first.url) {
      Haptics.selectionAsync().catch(() => {});
      Linking.openURL(first.url).catch(() => {});
    }
  };

  return (
    <Pressable style={styles.chip} onPress={handlePress} hitSlop={6}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 155, 240, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginHorizontal: 3,
    marginVertical: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(29, 155, 240, 0.3)',
    alignSelf: 'baseline',
  },
  chipText: {
    fontFamily: font.bodyMedium,
    fontSize: 11.5,
    color: colors.accent,
  },
});
