/**
 * SourcesRow — Component 7:
 * Small horizontal row of circular favicon/source icons (matches Image 4).
 * Tappable to expand detailed source list.
 */
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ExternalLink, ListFilter } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { SourceRef } from '@/types/api';

interface SourcesRowProps {
  sources: SourceRef[];
}

export function SourcesRow({ sources }: SourcesRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.headerRow}>
        <View style={styles.left}>
          <ListFilter size={15} color={colors.textSecondary} />
          <Text style={styles.sourcesLabel}>Sources</Text>
          <View style={styles.faviconsRow}>
            {sources.slice(0, 4).map((s, idx) => (
              <View key={idx} style={styles.faviconCircle}>
                <Text style={styles.faviconText}>
                  {(s.siteName || s.title || 'W').charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.countText}>{sources.length} sources</Text>
        </View>

        <ChevronDown
          size={15}
          color={colors.textSecondary}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.expandedScroll}
        >
          {sources.map((s, idx) => (
            <Pressable
              key={idx}
              style={styles.sourceCard}
              onPress={() => s.url && Linking.openURL(s.url).catch(() => {})}
            >
              <Text style={styles.cardTitle} numberOfLines={2}>
                {s.title || s.siteName || s.url}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardSite} numberOfLines={1}>
                  {s.siteName || s.url}
                </Text>
                <View style={styles.cardBadge}>
                  <Text style={styles.badgeText}>{s.number ?? idx + 1}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16181C',
    borderRadius: 16,
    padding: spacing(2),
    marginVertical: spacing(1.5),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourcesLabel: {
    fontFamily: font.bodySemi,
    fontSize: 13.5,
    color: colors.text,
  },
  faviconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faviconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faviconText: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    color: colors.accent,
  },
  countText: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  expandedScroll: {
    paddingTop: spacing(2),
    gap: spacing(1.5),
  },
  sourceCard: {
    width: 160,
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: spacing(2),
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontFamily: font.bodyMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSite: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  cardBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    color: colors.accent,
  },
});
