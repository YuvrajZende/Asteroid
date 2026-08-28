/**
 * SocialSection — Reddit / X discussions for the query (POST /api/social),
 * fetched lazily after results land; renders nothing when empty.
 */
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { fetchSocial } from '@/services/api';
import { colors, font, radius, spacing, type } from '@/theme/theme';
import type { SocialPost } from '@/types/api';

export function SocialSection({ query }: { query: string }) {
  const [loading, setLoading] = useState(true);
  const [reddit, setReddit] = useState<SocialPost[]>([]);
  const [twitter, setTwitter] = useState<SocialPost[]>([]);

  useEffect(() => {
    let alive = true;
    fetchSocial(query)
      .then((data) => {
        if (!alive) return;
        setReddit(data.reddit ?? []);
        setTwitter(data.twitter ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false); // silent — social is supplementary
      });
    return () => {
      alive = false;
    };
  }, [query]);

  if (loading) return <SkeletonCard lines={2} />;
  if (reddit.length === 0 && twitter.length === 0) return null;

  const renderPost = (post: SocialPost, kind: 'reddit' | 'twitter') => (
    <PressableScale
      key={post.url}
      style={styles.card}
      onPress={() => post.url && Linking.openURL(post.url).catch(() => {})}
    >
      <View style={styles.metaRow}>
        {kind === 'reddit' ? (
          <MessageCircle size={13} color={colors.accentBright} />
        ) : (
          <Text style={styles.xGlyph}>𝕏</Text>
        )}
        <Text style={styles.handle} numberOfLines={1}>
          {kind === 'reddit' ? post.subreddit ?? 'reddit' : post.username ?? 'X'}
        </Text>
        <Text style={styles.kindLabel}>{kind}</Text>
      </View>
      {!!post.title && <Text style={styles.title} numberOfLines={2}>{post.title}</Text>}
      {!!post.snippet && <Text style={styles.snippet} numberOfLines={3}>{post.snippet}</Text>}
    </PressableScale>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Discussions</Text>
      {reddit.map((p) => renderPost(p, 'reddit'))}
      {twitter.map((p) => renderPost(p, 'twitter'))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(1.5) },
  sectionTitle: { ...type.sectionHeading, fontSize: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    gap: 6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accentBright, flex: 1 },
  xGlyph: { fontSize: 12, lineHeight: 14, color: colors.accentBright },
  kindLabel: { fontFamily: font.body, fontSize: 11, color: colors.textSecondary },
  title: { fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 20, color: colors.text },
  snippet: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
