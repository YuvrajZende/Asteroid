/**
 * Discover — X-style feed reproducing the exact UI from the reference image:
 * Top header with avatar, search pill, and settings gear.
 * Scrollable horizontal text tabs with blue underline.
 * Feed list with hero card first, followed by compact rows and hairlines.
 */
/**
 * Discover — Parity with Asteroid Web Discover & Research:
 *
 * 1) Segmented Views: News & Trends | Research Papers
 * 2) Exact Category mapping matching Web:
 *    - News: Top Stories, Technology, Science, Business, Entertainment, Health, Sports
 *    - Papers: AI & ML, Technology, Physics, Mathematics, Biology, Chemistry, Medicine, Engineering
 * 3) Clicking any news article or research paper automatically launches the Asteroid
 *    AI Search panel (/search/[libId]) to analyze the topic in detail, syncing to Library.
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Newspaper, RefreshCw, Search, Settings } from 'lucide-react-native';
import { useUser } from '@clerk/expo';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { NewsCard, NewsCardHero } from '@/components/discover/NewsCard';
import { DiscoverStoryCard } from '@/components/discover/DiscoverStoryCard';
import { PaperCard } from '@/components/discover/PaperCard';
import { fetchNews, fetchPapers } from '@/services/api';
import { insertLibraryEntry } from '@/services/supabase';
import { makeId } from '@/stores/useSearchStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';
import type { NewsArticle, Paper } from '@/types/api';

const NEWS_CATEGORIES = [
  { id: 'general', label: 'Top Stories' },
  { id: 'technology', label: 'Technology' },
  { id: 'science', label: 'Science' },
  { id: 'business', label: 'Business' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'health', label: 'Health' },
  { id: 'sports', label: 'Sports' },
];

const PAPER_CATEGORIES = [
  { id: 'ai', label: 'AI & ML' },
  { id: 'tech', label: 'Technology' },
  { id: 'physics', label: 'Physics' },
  { id: 'math', label: 'Mathematics' },
  { id: 'biology', label: 'Biology' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'engineering', label: 'Engineering' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const isGuest = useGuestStore((s) => s.isGuest);

  const [section, setSection] = useState<'news' | 'papers'>('news');
  const [activeNewsCategory, setActiveNewsCategory] = useState('general');
  const [activePaperCategory, setActivePaperCategory] = useState('ai');

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const loadNews = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(activeNewsCategory, refresh);
      setArticles(data.articles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load news');
    } finally {
      setLoading(false);
    }
  }, [activeNewsCategory]);

  const loadPapers = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPapers(activePaperCategory, refresh);
      setPapers(data.papers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load research papers');
    } finally {
      setLoading(false);
    }
  }, [activePaperCategory]);

  useEffect(() => {
    if (section === 'news') {
      loadNews();
    } else {
      loadPapers();
    }
  }, [section, loadNews, loadPapers]);

  // Website parity: Clicking news loads search panel for that topic
  const handleNewsClick = (article: NewsArticle) => {
    if (!article.title) return;
    const libId = makeId();

    // Sync to Supabase history if signed in
    if (!isGuest && isSignedIn && email) {
      insertLibraryEntry({
        searchInput: article.title,
        userEmail: email,
        type: 'search',
        libId,
      });
    }

    router.push({
      pathname: '/search/[libId]',
      params: { libId, query: article.title },
    });
  };

  // Website parity: Clicking paper loads search panel for that paper
  const handlePaperClick = (paper: Paper) => {
    if (!paper.title) return;
    const libId = makeId();

    if (!isGuest && isSignedIn && email) {
      insertLibraryEntry({
        searchInput: paper.title,
        userEmail: email,
        type: 'search',
        libId,
      });
    }

    router.push({
      pathname: '/search/[libId]',
      params: { libId, query: `Summarize research paper: "${paper.title}"` },
    });
  };

  const name = user?.fullName ?? email?.split('@')[0] ?? 'Guest';
  const categories = section === 'news' ? NEWS_CATEGORIES : PAPER_CATEGORIES;
  const activeCategoryId = section === 'news' ? activeNewsCategory : activePaperCategory;
  const setActiveCategoryId = section === 'news' ? setActiveNewsCategory : setActivePaperCategory;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
        </Pressable>

        <Pressable style={styles.searchPill} onPress={() => router.push('/(tabs)/search')}>
          <Search size={16} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search Asteroid</Text>
        </Pressable>

        <Pressable hitSlop={12} onPress={() => (section === 'news' ? loadNews(true) : loadPapers(true))}>
          <RefreshCw size={20} color={loading ? colors.accent : colors.text} />
        </Pressable>
      </View>

      {/* Section Toggle: News & Trends | Research Papers */}
      <View style={styles.sectionSwitchWrap}>
        <Pressable
          style={[styles.sectionSwitchBtn, section === 'news' && styles.sectionSwitchBtnActive]}
          onPress={() => setSection('news')}
        >
          <Newspaper size={15} color={section === 'news' ? colors.accentBright : colors.textSecondary} />
          <Text style={[styles.sectionSwitchText, section === 'news' && styles.sectionSwitchTextActive]}>
            News & Trends
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sectionSwitchBtn, section === 'papers' && styles.sectionSwitchBtnActive]}
          onPress={() => setSection('papers')}
        >
          <BookOpen size={15} color={section === 'papers' ? colors.accentBright : colors.textSecondary} />
          <Text style={[styles.sectionSwitchText, section === 'papers' && styles.sectionSwitchTextActive]}>
            Research Papers
          </Text>
        </Pressable>
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      <View style={styles.tabScrollWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsInner}
          renderItem={({ item }) => {
            const active = item.id === activeCategoryId;
            return (
              <Pressable
                onPress={() => setActiveCategoryId(item.id)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Feed List */}
      {section === 'news' ? (
        <FlatList
          data={articles}
          keyExtractor={(item, i) => String(item.id ?? i)}
          ItemSeparatorComponent={() => (
            activeNewsCategory === 'general' ? (
              <View style={styles.separator} />
            ) : (
              <View style={{ height: spacing(1) }} />
            )
          )}
          contentContainerStyle={[
            styles.list,
            activeNewsCategory !== 'general' && { paddingVertical: spacing(1) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadNews(true)}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item, index }) => {
            // Image 1: Only Top Stories ('general') gets the hero banner + compact list layout
            if (activeNewsCategory === 'general') {
              return index === 0 ? (
                <NewsCardHero article={item} onPress={handleNewsClick} />
              ) : (
                <NewsCard article={item} onPress={handleNewsClick} />
              );
            }

            // Image 2: All other sections (Technology, Science, Business, etc.) get the large Perplexity card feed layout
            return <DiscoverStoryCard article={item} onPress={handleNewsClick} />;
          }}
          ListEmptyComponent={
            loading ? (
              <View style={styles.skeletons}>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={3} />
              </View>
            ) : (
              <View style={styles.empty}>
                <Newspaper size={44} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>{error ? 'Could not load news' : 'No articles found'}</Text>
                <Text style={styles.emptyBody}>
                  {error ?? 'Pull down to refresh, or try another category.'}
                </Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={papers}
          keyExtractor={(item, i) => String(item.id ?? i)}
          ItemSeparatorComponent={() => <View style={{ height: spacing(2) }} />}
          contentContainerStyle={[styles.list, { paddingHorizontal: spacing(3), paddingTop: spacing(2) }]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadPapers(true)}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <PaperCard paper={item} onAskAi={handlePaperClick} />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.skeletons}>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={4} />
              </View>
            ) : (
              <View style={styles.empty}>
                <BookOpen size={44} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>{error ? 'Could not load papers' : 'No papers found'}</Text>
                <Text style={styles.emptyBody}>
                  {error ?? 'Pull down to refresh, or try another discipline.'}
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    gap: spacing(2),
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.display, fontSize: 14, color: colors.text },
  searchPill: {
    flex: 1,
    height: 38,
    backgroundColor: colors.surface,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchPlaceholder: {
    fontFamily: font.body,
    fontSize: 14.5,
    color: colors.textSecondary,
  },

  sectionSwitchWrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(1.5),
    gap: spacing(1),
  },
  sectionSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sectionSwitchBtnActive: {
    backgroundColor: colors.elevated,
    borderColor: colors.accent,
  },
  sectionSwitchText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionSwitchTextActive: {
    color: colors.text,
  },

  tabScrollWrap: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
    paddingBottom: spacing(1.5),
  },
  tabsInner: {
    paddingHorizontal: spacing(2),
    gap: spacing(1),
  },
  categoryChip: {
    paddingHorizontal: spacing(2),
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
  },
  categoryLabel: {
    fontFamily: font.bodyMedium,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    fontFamily: font.bodySemi,
    color: '#FFFFFF',
  },

  list: { paddingBottom: spacing(10) },
  separator: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginHorizontal: spacing(3),
  },

  skeletons: { paddingHorizontal: spacing(3), paddingTop: spacing(2), gap: spacing(2) },
  empty: { alignItems: 'center', gap: spacing(2), paddingHorizontal: spacing(4), paddingTop: spacing(12) },
  emptyTitle: { ...type.cardTitle, marginTop: spacing(1) },
  emptyBody: { ...type.caption, textAlign: 'center', lineHeight: 20 },
});
