/**
 * Discover — full parity with the web app's Discover/Research surfaces:
 * News (GNews, per category, pull-to-refresh, stale fallback banner) and
 * Papers (Google Scholar via /api/research, citation-sorted, PDF links,
 * Ask-AI follow-up). Segmented control with premium cards.
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Newspaper } from 'lucide-react-native';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { NewsCard } from '@/components/discover/NewsCard';
import { PaperCard } from '@/components/discover/PaperCard';
import { fetchNews, fetchPapers } from '@/services/api';
import { makeId } from '@/stores/useSearchStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';
import type { NewsArticle, Paper } from '@/types/api';

const NEWS_CATEGORIES = ['general', 'technology', 'science', 'business', 'health', 'sports', 'entertainment'];
const RESEARCH_CATEGORIES = ['ai', 'tech', 'physics', 'math', 'biology', 'chemistry', 'medicine', 'engineering'];

type Segment = 'news' | 'papers';

export default function DiscoverScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('news');
  const [newsCategory, setNewsCategory] = useState('general');
  const [researchCategory, setResearchCategory] = useState('ai');

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = segment === 'news' ? newsCategory : researchCategory;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStale(false);
    try {
      if (segment === 'news') {
        const data = await fetchNews(category);
        setArticles(data.articles ?? []);
        setStale(Boolean(data.stale));
      } else {
        const data = await fetchPapers(category);
        setPapers(data.papers ?? []);
        setStale(Boolean(data.stale));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load content');
    } finally {
      setLoading(false);
    }
  }, [segment, category]);

  useEffect(() => {
    load();
  }, [load]);

  const askAi = (paper: Paper) => {
    const query = `Explain the key findings and significance of the research paper "${paper.title}"`;
    router.push({ pathname: '/search/[libId]', params: { libId: makeId(), query } });
  };

  const categories = segment === 'news' ? NEWS_CATEGORIES : RESEARCH_CATEGORIES;
  const activeCategory = segment === 'news' ? newsCategory : researchCategory;
  const setCategory = segment === 'news' ? setNewsCategory : setResearchCategory;

  const renderItem =
    segment === 'news'
      ? ({ item }: { item: NewsArticle }) => <NewsCard article={item} />
      : ({ item }: { item: Paper }) => <PaperCard paper={item} onAskAi={askAi} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={type.pageHeading}>Discover</Text>
      </View>

      <View style={styles.segmentWrap}>
        {(['news', 'papers'] as Segment[]).map((s) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: s === segment }}
            onPress={() => setSegment(s)}
            style={[styles.segment, s === segment && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, s === segment && styles.segmentLabelActive]}>
              {s === 'news' ? 'News' : 'Papers'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chipsInner}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategory(item)}
              style={[styles.categoryChip, item === activeCategory && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryText, item === activeCategory && styles.categoryTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {stale && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>Showing slightly older content — live sources are catching up.</Text>
        </View>
      )}

      <FlatList
        data={segment === 'news' ? articles : papers}
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={renderItem as never}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accentBright} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Newspaper size={40} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>{error ? 'Could not load' : 'Nothing here yet'}</Text>
              <Text style={styles.emptyBody}>
                {error ?? 'Pull to refresh, or try a different category.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(3), paddingTop: spacing(3), paddingBottom: spacing(2) },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.button - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentLabel: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.textSecondary },
  segmentLabelActive: { color: colors.text },
  chipsRow: { height: 40, marginBottom: spacing(2) },
  chipsInner: { paddingHorizontal: spacing(3), gap: spacing(1), alignItems: 'center' },
  categoryChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing(2),
    height: 32,
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: colors.elevated, borderColor: colors.accent },
  categoryText: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.textSecondary },
  categoryTextActive: { color: colors.accentBright },
  staleBanner: {
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: radius.input,
    padding: spacing(1.5),
  },
  staleText: { ...type.caption, color: colors.warning },
  list: { paddingHorizontal: spacing(3), paddingBottom: spacing(4), gap: spacing(2) },
  skeletons: { paddingHorizontal: spacing(3), gap: spacing(2) },
  empty: { alignItems: 'center', gap: spacing(2), paddingHorizontal: spacing(4), paddingTop: spacing(12) },
  emptyTitle: { ...type.cardTitle, marginTop: spacing(1) },
  emptyBody: { ...type.caption, textAlign: 'center', lineHeight: 20 },
});
