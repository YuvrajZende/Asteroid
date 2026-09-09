/**
 * NewsCard — Two variants matching X's Explore feed:
 *
 * 1) `hero` — first item: full-width image with title overlaid at bottom
 * 2) `row`  — remaining items: compact horizontal row, text left, small
 *    thumbnail right, separated by hairline dividers (handled by parent)
 *
 * Parity with website: Tapping a card launches the Asteroid AI Search
 * panel for that news headline, giving comprehensive analysis and sources.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ExternalLink, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { NewsArticle } from '@/types/api';

export function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

interface NewsCardProps {
  article: NewsArticle;
  onPress: (article: NewsArticle) => void;
}

/* ─── Hero variant ────────────────────────────────────────────── */

export function NewsCardHero({ article, onPress }: NewsCardProps) {
  const openExternal = (e: any) => {
    e.stopPropagation?.();
    if (article.url) Linking.openURL(article.url).catch(() => {});
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <PressableScale onPress={() => onPress(article)} style={heroStyles.card}>
        {!!article.image && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image
            source={{ uri: article.image }}
            style={heroStyles.image}
            contentFit="cover"
            transition={180}
            accessibilityLabel={article.title ?? 'Featured article'}
          />
        )}
        <View style={heroStyles.overlay}>
          <Text style={heroStyles.title} numberOfLines={3}>
            {article.title}
          </Text>
          <View style={heroStyles.bottomRow}>
            <View style={heroStyles.meta}>
              {!!article.source && <Text style={heroStyles.source}>{article.source}</Text>}
              {!!article.publishedAt && (
                <Text style={heroStyles.time}>{formatRelativeTime(article.publishedAt)}</Text>
              )}
            </View>
            <View style={heroStyles.actionPill}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={heroStyles.actionText}>Search topic</Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
    height: 220,
    backgroundColor: colors.surface,
    marginHorizontal: spacing(2),
    marginBottom: spacing(1),
  },
  image: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.elevated,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: spacing(2.5),
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  title: { fontFamily: font.bodySemi, fontSize: 18, lineHeight: 24, color: '#FFFFFF' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  source: { fontFamily: font.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  time: { fontFamily: font.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(29, 155, 240, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.accent,
  },
  actionText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
  },
});

/* ─── Row variant (default) ───────────────────────────────────── */

export function NewsCard({ article, onPress }: NewsCardProps) {
  const openExternal = () => {
    if (article.url) Linking.openURL(article.url).catch(() => {});
  };

  return (
    <PressableScale onPress={() => onPress(article)} style={rowStyles.row}>
      <View style={rowStyles.textCol}>
        <View style={rowStyles.meta}>
          {!!article.source && <Text style={rowStyles.source}>{article.source}</Text>}
          {!!article.publishedAt && (
            <Text style={rowStyles.time}>
              {article.source ? ' · ' : ''}
              {formatRelativeTime(article.publishedAt)}
            </Text>
          )}
        </View>

        <Text style={rowStyles.title} numberOfLines={2}>
          {article.title}
        </Text>

        {!!article.description && (
          <Text style={rowStyles.description} numberOfLines={2}>
            {article.description}
          </Text>
        )}

        <View style={rowStyles.actionsRow}>
          <View style={rowStyles.searchAction}>
            <Sparkles size={11} color={colors.accent} />
            <Text style={rowStyles.searchActionText}>Analyze in search</Text>
          </View>
          {!!article.url && (
            <Pressable hitSlop={8} onPress={openExternal} style={rowStyles.externalBtn}>
              <ExternalLink size={12} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {!!article.image && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          source={{ uri: article.image }}
          style={rowStyles.thumb}
          contentFit="cover"
          transition={120}
          accessibilityLabel={article.title ?? 'Article thumbnail'}
        />
      )}
    </PressableScale>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    gap: spacing(2),
  },
  textCol: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  source: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accent },
  time: { fontFamily: font.body, fontSize: 12, color: colors.textSecondary },
  title: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: colors.text },
  description: { fontFamily: font.body, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  searchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchActionText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: colors.accent,
  },
  externalBtn: {
    padding: 2,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    marginTop: 2,
  },
});
