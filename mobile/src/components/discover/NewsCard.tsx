/**
 * NewsCard — premium headline card: thumbnail, source, relative time.
 */
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
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

export function NewsCard({ article }: { article: NewsArticle }) {
  const open = () => article.url && Linking.openURL(article.url).catch(() => {});

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <PressableScale onPress={open} style={styles.card}>
        {!!article.image && (
          // eslint-disable-next-line jsx-a11y/alt-text -- native Image has no alt prop; a11y via accessibilityLabel
          <Image
            source={{ uri: article.image }}
            style={styles.image}
            contentFit="cover"
            transition={180}
            accessibilityLabel={article.title ?? 'News article image'}
          />
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={3}>
            {article.title}
          </Text>
          {!!article.description && (
            <Text style={styles.description} numberOfLines={2}>
              {article.description}
            </Text>
          )}
          <View style={styles.meta}>
            {!!article.source && <Text style={styles.source}>{article.source}</Text>}
            {!!article.publishedAt && <Text style={styles.time}>{formatRelativeTime(article.publishedAt)}</Text>}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 150, backgroundColor: colors.elevated },
  body: { padding: spacing(2.5), gap: 6 },
  title: { fontFamily: font.bodySemi, fontSize: 15.5, lineHeight: 22, color: colors.text },
  description: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  source: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accentBright },
  time: { fontFamily: font.body, fontSize: 12, color: colors.textSecondary },
});
