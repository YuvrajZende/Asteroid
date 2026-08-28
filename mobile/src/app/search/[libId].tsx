/**
 * Result screen — owns the orchestration and staged loading:
 *   searching → synthesizing → done | error
 * Cached conversations replay instantly; unknown libIds re-run the query
 * (Redis on the server makes re-runs cheap). Rate limits render the
 * RateLimitCard with countdown; AI failure degrades to raw web results
 * (spec §8).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { useUser } from '@clerk/expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { RateLimitCard } from '@/components/search/RateLimitCard';
import { MarkdownRenderer } from '@/components/search/MarkdownRenderer';
import { CodeBlock } from '@/components/search/CodeBlock';
import { KeyPointRow } from '@/components/search/KeyPointRow';
import { ImageCarousel } from '@/components/search/ImageCarousel';
import { QuestionChip } from '@/components/search/QuestionChip';
import { SourceBadge } from '@/components/search/SourceBadge';
import { SocialSection } from '@/components/search/SocialSection';
import { isCodeRequest } from '@/services/intentDetector';
import { insertLibraryEntry } from '@/services/supabase';
import { runSearch } from '@/services/runSearch';
import { useSearchStore, makeId } from '@/stores/useSearchStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ libId: string; query?: string; type?: string }>();
  const libId = params.libId ?? makeId();
  const query = params.query ?? '';

  const model = useSettingsStore((s) => s.model);
  const conversation = useSearchStore((s) => s.conversations[libId]);
  const cacheConversation = useSearchStore((s) => s.cacheConversation);
  const updateConversation = useSearchStore((s) => s.updateConversation);
  const addRecent = useSearchStore((s) => s.addRecent);
  const isGuest = useGuestStore((s) => s.isGuest);
  const { isSignedIn, user } = useUser();

  const [rateLimitSec, setRateLimitSec] = useState(0);
  const running = useRef(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const execute = useCallback(async () => {
    if (!query || running.current) return;
    running.current = true;
    setRateLimitSec(0);

    const convo = {
      libId,
      query,
      model,
      type: (isCodeRequest(query) ? 'code' : 'search') as 'code' | 'search',
      stage: 'searching' as const,
      startedAt: Date.now(),
    };
    cacheConversation(convo);

    try {
      const result = await runSearch(query, model);

      if (result.type === 'code') {
        cacheConversation({ ...convo, stage: 'done', code: result.code });
      } else {
        cacheConversation({
          ...convo,
          stage: 'done',
          search: result.search,
          ai: result.ai,
        });
      }

      // History: shared when signed in, local recents always
      addRecent({ libId, query, model, type: convo.type, timestamp: Date.now() });
      if (!isGuest && isSignedIn && email) {
        insertLibraryEntry({ searchInput: query, userEmail: email, type: convo.type, libId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      const isRateLimit = message.startsWith('Rate limited');
      const retryAfter = isRateLimit ? (err as Error & { retryAfterSec?: number }).retryAfterSec ?? 60 : 0;
      if (isRateLimit) setRateLimitSec(retryAfter);
      updateConversation(libId, { stage: 'error', error: message });
    } finally {
      running.current = false;
    }
  }, [query, libId, model, cacheConversation, updateConversation, addRecent, isGuest, isSignedIn, email]);

  useEffect(() => {
    if (!conversation || conversation.stage === 'error') {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libId]);

  useFocusEffect(
    useCallback(() => {
      return () => setRateLimitSec(0);
    }, []),
  );

  const ai = conversation?.ai ?? null;
  const search = conversation?.search;
  const sources = useMemo(() => ai?.sources ?? [], [ai]);
  const answerText = ai?.answer ?? ai?.rawContent ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityLabel="Go back">
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerQuery} numberOfLines={1}>
          {conversation?.query ?? query}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {(!conversation || conversation.stage === 'searching') && (
          <View style={styles.staged}>
            <Text style={styles.stageLabel}>Searching the web…</Text>
            <SkeletonCard lines={3} />
          </View>
        )}

        {conversation?.stage === 'synthesizing' && (
          <View style={styles.staged}>
            <Text style={styles.stageLabel}>Synthesizing an answer…</Text>
            <SkeletonCard lines={5} />
          </View>
        )}

        {conversation?.stage === 'error' && !rateLimitSec && (
          <View style={styles.errorCard}>
            <Text style={type.cardTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{conversation.error}</Text>
            <Text style={type.caption}>Check that the Asteroid web server is running and reachable.</Text>
          </View>
        )}

        {conversation?.stage === 'error' && !!rateLimitSec && (
          <RateLimitCard retryAfterSec={rateLimitSec} onRetry={execute} />
        )}

        {conversation?.stage === 'done' && conversation.type === 'code' && conversation.code && (
          <CodeResult
            solution={conversation.code.solution}
            explanation={conversation.code.explanation}
            codeBlocks={conversation.code.codeBlocks ?? []}
          />
        )}

        {conversation?.stage === 'done' && conversation.type === 'search' && (
          <SearchResult
            query={conversation.query}
            search={search}
            ai={ai}
            answerText={answerText}
            sources={sources}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SearchResult({
  query,
  search,
  ai,
  answerText,
  sources,
}: {
  query: string;
  search?: import('@/types/api').SearchResponse;
  ai?: import('@/types/api').AIResponse | null;
  answerText: string;
  sources: import('@/types/api').SourceRef[];
}) {
  const router = useRouter();
  const [showAllSources, setShowAllSources] = useState(false);

  const followUp = (question: string) => {
    const libId = makeId();
    router.push({ pathname: '/search/[libId]', params: { libId, query: question } });
  };

  const webResults = search?.webResults ?? [];
  const paa = (search?.peopleAlsoAsk ?? []).filter((p) => p.question);

  return (
    <>
      {!ai && (
        <View style={styles.degradeBanner}>
          <Text style={styles.degradeText}>
            Showing web results — AI synthesis is briefly unavailable.
          </Text>
        </View>
      )}

      {!!ai && !!answerText && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.answerCard}>
          <MarkdownRenderer content={answerText} sources={sources} />
        </Animated.View>
      )}

      {!!ai?.keyPoints?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key takeaways</Text>
          <View style={styles.keyPoints}>
            {ai.keyPoints.slice(0, 5).map((point, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 70).duration(380)}>
                <KeyPointRow text={point} index={i} />
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      {!!ai?.sections?.length && (
        <View style={styles.section}>
          {ai.sections.slice(0, 4).map((section, i) => (
            <View key={i} style={styles.sectionCard}>
              {!!section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
              {!!section.content && <MarkdownRenderer content={section.content} sources={sources} />}
            </View>
          ))}
        </View>
      )}

      {!!search?.images?.length && <ImageCarousel images={search.images} />}

      {!!sources.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>
          <View style={styles.sourcesList}>
            {sources.slice(0, showAllSources ? sources.length : 4).map((source) => (
              <View key={source.number} style={styles.sourceRow}>
                <SourceBadge number={source.number} url={source.url} />
                <Pressable
                  style={styles.sourceText}
                  onPress={() => source.url && Linking.openURL(source.url).catch(() => {})}
                >
                  <Text style={styles.sourceTitle} numberOfLines={1}>
                    {source.title ?? source.url}
                  </Text>
                  <Text style={type.caption}>{source.siteName ?? source.url}</Text>
                </Pressable>
              </View>
            ))}
            {sources.length > 4 && (
              <Pressable onPress={() => setShowAllSources((v) => !v)}>
                <Text style={styles.toggleSources}>
                  {showAllSources ? 'Show less' : `Show all ${sources.length} sources`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {!!paa.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People also ask</Text>
          <View style={styles.chipsWrap}>
            {paa.slice(0, 5).map((p, i) => (
              <QuestionChip key={i} question={p.question!} onPress={followUp} />
            ))}
          </View>
        </View>
      )}

      {!!webResults.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Web results</Text>
          {webResults.slice(0, 8).map((result, i) => (
            <PressableScale
              key={i}
              style={styles.webRow}
              onPress={() => result.url && Linking.openURL(result.url).catch(() => {})}
            >
              <View style={styles.webRowText}>
                <Text style={styles.webTitle} numberOfLines={2}>
                  {result.title ?? result.url}
                </Text>
                <View style={styles.webMeta}>
                  <ExternalLink size={12} color={colors.textSecondary} />
                  <Text style={type.caption} numberOfLines={1}>
                    {' '}
                    {result.siteName ?? result.url}
                  </Text>
                </View>
                {!!result.description && (
                  <Text style={styles.webDescription} numberOfLines={2}>
                    {result.description}
                  </Text>
                )}
              </View>
            </PressableScale>
          ))}
        </View>
      )}

      {!!query && <SocialSection query={query} />}
    </>
  );
}

function CodeResult({
  solution,
  explanation,
  codeBlocks,
}: {
  solution?: string;
  explanation?: string;
  codeBlocks: import('@/types/api').CodeBlock[];
}) {
  return (
    <>
      {!!solution && (
        <View style={styles.answerCard}>
          <Text style={styles.sectionTitle}>Solution</Text>
          <MarkdownRenderer content={solution} />
        </View>
      )}
      {codeBlocks.map((block, i) => (
        <CodeBlock
          key={i}
          codeText={block.code ?? ''}
          language={block.language}
          syntax={block.syntax}
        />
      ))}
      {!!explanation && (
        <View style={styles.answerCard}>
          <Text style={styles.sectionTitle}>Explanation</Text>
          <MarkdownRenderer content={explanation} />
        </View>
      )}
      {codeBlocks.length === 0 && !solution && !explanation && (
        <View style={styles.answerCard}>
          <Text style={type.caption}>No structured code was returned — try rephrasing the request.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerQuery: { ...type.cardTitle, flex: 1 },
  body: { padding: spacing(3), paddingBottom: spacing(6), gap: spacing(3) },
  staged: { gap: spacing(2) },
  stageLabel: { ...type.caption, textAlign: 'center' },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    padding: spacing(3),
    gap: spacing(1),
  },
  errorBody: { ...type.body, fontSize: 14 },
  degradeBanner: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: radius.card,
    padding: spacing(2),
  },
  degradeText: { ...type.caption, color: colors.warning, lineHeight: 19 },
  answerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
  },
  section: { gap: spacing(1.5) },
  sectionTitle: { ...type.sectionHeading, fontSize: 18 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
  },
  keyPoints: { gap: spacing(1) },
  sourcesList: { gap: spacing(1) },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  sourceText: { flex: 1 },
  sourceTitle: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.text },
  toggleSources: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.accentBright, marginTop: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  webRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    gap: 4,
  },
  webRowText: { gap: 2 },
  webTitle: { fontFamily: font.bodySemi, fontSize: 15, color: colors.text },
  webMeta: { flexDirection: 'row', alignItems: 'center' },
  webDescription: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
