/**
 * Result screen — Answer Presentation Engine Multi-Turn Interface:
 *
 * Implements:
 * CONTENT → STRUCTURE → VISUAL HIERARCHY → SOURCES → MEDIA
 *
 * Multi-Turn Conversation Thread:
 * - Keeps all queries and answers in the same chat thread.
 * - Resolves pronouns (he/she/it/his/they) by contextualizing with parent topic and history.
 * - Renders user question pills followed by rich Editorial Articles sequentially.
 * - Smooth auto-scrolling to new answers as they generate.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { useUser } from '@clerk/expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RateLimitCard } from '@/components/search/RateLimitCard';
import { ResearchAgentProgress } from '@/components/search/ResearchAgentProgress';
import { EditorialArticleRenderer } from '@/components/article/EditorialArticleRenderer';
import { Composer } from '@/components/blocks/Composer';
import { SocialSection } from '@/components/search/SocialSection';
import { isCodeRequest } from '@/services/intentDetector';
import { fetchLibraryEntry, insertLibraryEntry } from '@/services/supabase';
import { runSearch } from '@/services/runSearch';
import { useSearchStore, makeId, type ConversationTurn } from '@/stores/useSearchStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';
import type { EditorialArticle, EditorialSection } from '@/types/article';

function cleanSnippetText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\.{2,}\s*/g, '. ') // replace " ... " or ".." with clean sentence stop
    .replace(/\s*-\s*(?:The\s+Hindu|Times\s+of\s+India|TOI|Reuters|Bloomberg|Mashable|TechCrunch|Forbes)[^.]*$/i, '')
    .replace(/\s*TOI\s*\.?$/i, '')
    .replace(/\[LIVE\]:?/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();
}

function extractCleanCompleteSentence(text: string): string {
  if (!text) return '';
  const cleaned = cleanSnippetText(text);
  // Match the first complete sentence ending in ., !, or ?
  const match = cleaned.match(/^([^.!?]+[.!?])/);
  if (match && match[1].length >= 35) {
    return match[1].trim();
  }
  if (cleaned.length <= 250) return cleaned;
  const spaceIdx = cleaned.lastIndexOf(' ', 220);
  return (spaceIdx > 60 ? cleaned.slice(0, spaceIdx) : cleaned.slice(0, 220)) + '.';
}

function buildArticleFromTurn(turn: ConversationTurn): EditorialArticle | null {
  const ai = turn.ai;
  const search = turn.search;

  if (ai?.sections && Array.isArray(ai.sections) && ai.sections.length > 0) {
    const summaryObj =
      typeof ai.summary === 'object' && ai.summary !== null
        ? ai.summary
        : typeof ai.summary === 'string'
        ? { content: ai.summary, sources: [] }
        : undefined;

    let sections = [...ai.sections] as EditorialSection[];

    // If AI did not include images but search returned images, interleave 2-4 images IN BETWEEN paragraphs
    const hasMedia = sections.some((s) => s.type === 'image' || s.type === 'gallery');
    if (!hasMedia && search?.images && search.images.length > 0) {
      const validImages = search.images.slice(0, 4).filter((img) => img.src || img.thumbnail);
      let imgIdx = 0;
      for (let i = 0; i < sections.length && imgIdx < validImages.length; i++) {
        if (sections[i].type === 'paragraph' || sections[i].type === 'bullets') {
          sections.splice(i + 1, 0, {
            type: 'image',
            url: validImages[imgIdx].src || validImages[imgIdx].thumbnail || '',
            source_url: validImages[imgIdx].url,
            source_name: validImages[imgIdx].source || 'Web',
            size: imgIdx === 0 ? 'large' : 'medium',
            caption: validImages[imgIdx].title || turn.query,
          });
          imgIdx++;
          i++;
        }
      }
    }

    return {
      title: ai.title || turn.query,
      subtitle: ai.subtitle || '',
      query_type: ai.query_type || 'general_knowledge',
      summary: summaryObj,
      sections,
      sources: ai.sources || [],
      follow_ups: ai.follow_ups || ai.relatedQuestions || [],
      rawContent: ai.rawContent,
    };
  }

  // Fallback adaptation when AI synthesis returned unstructured or degraded content
  if (!ai && !search) return null;

  const sections: EditorialSection[] = [];
  const validImages = (search?.images || []).slice(0, 4).filter((img) => img.src || img.thumbnail);
  let imgIdx = 0;

  let rawParagraphs: string[] = [];
  if (ai?.answer || ai?.rawContent) {
    const raw = cleanSnippetText(ai.answer || ai.rawContent || '');
    rawParagraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  } else if (search?.webResults && search.webResults.length > 0) {
    // Build informative paragraphs from top authoritative search results, cleaning snippet ellipses
    rawParagraphs = search.webResults
      .slice(0, 3)
      .map((r) => cleanSnippetText(r.description || ''))
      .filter((text) => text.length > 30);
  }

  if (rawParagraphs.length === 0) {
    const fallbackSnippet = cleanSnippetText(search?.webResults?.[0]?.description || '');
    if (fallbackSnippet) rawParagraphs.push(fallbackSnippet);
  }

  // Interleave: Paragraph 1 FIRST -> then Image 1 -> then Paragraph 2 -> then Image 2 ...
  rawParagraphs.forEach((para) => {
    sections.push({
      type: 'paragraph',
      content: para,
    });

    if (imgIdx < validImages.length) {
      sections.push({
        type: 'image',
        url: validImages[imgIdx].src || validImages[imgIdx].thumbnail || '',
        source_url: validImages[imgIdx].url,
        source_name: validImages[imgIdx].source || 'Web',
        size: imgIdx === 0 ? 'large' : 'medium',
        caption: validImages[imgIdx].title || turn.query,
      });
      imgIdx++;
    }
  });

  if (ai?.keyPoints && ai.keyPoints.length > 0) {
    sections.push({
      type: 'heading',
      content: 'Key takeaways',
    });
    sections.push({
      type: 'bullets',
      items: ai.keyPoints.map((kp) => {
        const match = kp.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (match) {
          return { label: match[1], content: match[2] };
        }
        return { content: kp };
      }),
    });
    if (imgIdx < validImages.length) {
      sections.push({
        type: 'image',
        url: validImages[imgIdx].src || validImages[imgIdx].thumbnail || '',
        source_url: validImages[imgIdx].url,
        source_name: validImages[imgIdx].source || 'Web',
        size: 'medium',
        caption: validImages[imgIdx].title || turn.query,
      });
      imgIdx++;
    }
  }

  return {
    title: turn.query,
    // Do not slice halfway through a sentence; extract a complete sentence or leave blank so paragraph handles it
    summary: undefined,
    sections,
    sources: ai?.sources || [],
    follow_ups: ai?.relatedQuestions || [],
  };
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ libId: string; query?: string; type?: string }>();
  const libId = params.libId ?? makeId();
  const initialQuery = params.query ?? '';

  const model = useSettingsStore((s) => s.model);
  const conversation = useSearchStore((s) => s.conversations[libId]);
  const cacheConversation = useSearchStore((s) => s.cacheConversation);
  const addRecent = useSearchStore((s) => s.addRecent);
  const isGuest = useGuestStore((s) => s.isGuest);
  const { isSignedIn, user } = useUser();

  const [rateLimitSec, setRateLimitSec] = useState(0);
  const running = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  // Compute turns from conversation state
  const turns: ConversationTurn[] = useMemo(() => {
    if (conversation?.turns && conversation.turns.length > 0) {
      return conversation.turns;
    }
    if (conversation && conversation.query) {
      return [
        {
          id: `${conversation.libId}-0`,
          query: conversation.query,
          stage: conversation.stage,
          search: conversation.search,
          ai: conversation.ai,
          code: conversation.code,
          error: conversation.error,
          startedAt: conversation.startedAt,
        },
      ];
    }
    return [];
  }, [conversation]);

  // Initial query execution
  const executeInitial = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRateLimitSec(0);

    let activeQuery = initialQuery;
    if (!activeQuery && libId) {
      const entry = await fetchLibraryEntry(libId);
      if (entry?.searchInput) {
        activeQuery = entry.searchInput;
      }
    }

    if (!activeQuery) {
      running.current = false;
      return;
    }

    const firstTurnId = makeId();
    const firstTurn: ConversationTurn = {
      id: firstTurnId,
      query: activeQuery,
      stage: 'searching',
      startedAt: Date.now(),
    };

    const initialConvo = {
      libId,
      query: activeQuery,
      model,
      type: (isCodeRequest(activeQuery) ? 'code' : 'search') as 'code' | 'search',
      stage: 'searching' as const,
      turns: [firstTurn],
      startedAt: Date.now(),
    };
    cacheConversation(initialConvo);

    try {
      const result = await runSearch(activeQuery, model, '', [], (stage, search) => {
        if (search && search.webResults) {
          cacheConversation({
            ...initialConvo,
            stage: 'synthesizing',
            search,
            turns: [{ ...firstTurn, stage: 'synthesizing', search }],
          });
        }
      });

      const completedTurn: ConversationTurn =
        result.type === 'code'
          ? { ...firstTurn, stage: 'done', code: result.code }
          : { ...firstTurn, stage: 'done', search: result.search, ai: result.ai };

      cacheConversation({
        ...initialConvo,
        stage: 'done',
        turns: [completedTurn],
        search: result.type === 'search' ? result.search : undefined,
        ai: result.type === 'search' ? result.ai : undefined,
        code: result.type === 'code' ? result.code : undefined,
      });

      addRecent({ libId, query: activeQuery, model, type: initialConvo.type, timestamp: Date.now() });
      if (!isGuest && isSignedIn && email) {
        insertLibraryEntry({ searchInput: activeQuery, userEmail: email, type: initialConvo.type, libId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      const isRateLimit = message.startsWith('Rate limited');
      const retryAfter = isRateLimit ? (err as Error & { retryAfterSec?: number }).retryAfterSec ?? 60 : 0;
      if (isRateLimit) setRateLimitSec(retryAfter);

      const errorTurn: ConversationTurn = {
        ...firstTurn,
        stage: 'error',
        error: message,
      };
      cacheConversation({
        ...initialConvo,
        stage: 'error',
        error: message,
        turns: [errorTurn],
      });
    } finally {
      running.current = false;
    }
  }, [initialQuery, libId, model, cacheConversation, addRecent, isGuest, isSignedIn, email]);

  useEffect(() => {
    if (!conversation || (turns.length === 0 && !running.current)) {
      executeInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libId]);

  useFocusEffect(
    useCallback(() => {
      return () => setRateLimitSec(0);
    }, []),
  );

  // Multi-Turn Follow-Up in the SAME chat window
  const handleFollowUpSubmit = async (followUpQuery: string) => {
    const trimmed = followUpQuery.trim();
    if (!trimmed || running.current) return;
    running.current = true;

    const currentTurns = turns.length > 0 ? turns : [];
    const rootQuery = conversation?.query || currentTurns[0]?.query || initialQuery || trimmed;
    const rootTitle = currentTurns[0]?.ai?.title || rootQuery;

    const turnId = makeId();
    const newTurn: ConversationTurn = {
      id: turnId,
      query: trimmed,
      stage: 'searching',
      startedAt: Date.now(),
    };

    const updatedTurns = [...currentTurns, newTurn];

    cacheConversation({
      libId,
      query: rootQuery,
      model,
      type: 'search',
      stage: 'done',
      turns: updatedTurns,
      startedAt: conversation?.startedAt || Date.now(),
    });

    // Auto-scroll down smoothly to the new query
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Build context history for LLM
    const conversationHistory = currentTurns
      .filter((t) => t.stage === 'done' && (t.ai || t.code))
      .map((t) => {
        const summaryText =
          typeof t.ai?.summary === 'object' && t.ai?.summary !== null
            ? t.ai.summary.content
            : typeof t.ai?.summary === 'string'
            ? t.ai.summary
            : '';
        return {
          query: t.query,
          answer: summaryText || t.ai?.answer || '',
          summary: summaryText,
        };
      });

    try {
      const result = await runSearch(trimmed, model, rootTitle, conversationHistory, (stage, search) => {
        if (search && search.webResults) {
          const streamTurns: ConversationTurn[] = updatedTurns.map((t) =>
            t.id === turnId ? { ...newTurn, stage: 'synthesizing' as const, search } : t,
          );
          cacheConversation({
            libId,
            query: rootQuery,
            model,
            type: 'search',
            stage: 'done',
            turns: streamTurns,
            startedAt: conversation?.startedAt || Date.now(),
          });
        }
      });

      const completedTurn: ConversationTurn =
        result.type === 'code'
          ? { ...newTurn, stage: 'done', code: result.code }
          : { ...newTurn, stage: 'done', search: result.search, ai: result.ai };

      const finalTurns = updatedTurns.map((t) => (t.id === turnId ? completedTurn : t));

      cacheConversation({
        libId,
        query: rootQuery,
        model,
        type: 'search',
        stage: 'done',
        turns: finalTurns,
        startedAt: conversation?.startedAt || Date.now(),
      });

      if (!isGuest && isSignedIn && email) {
        insertLibraryEntry({ searchInput: trimmed, userEmail: email, type: 'search', libId: makeId() });
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      const isRateLimit = message.startsWith('Rate limited');
      const retryAfter = isRateLimit ? (err as Error & { retryAfterSec?: number }).retryAfterSec ?? 60 : 0;
      if (isRateLimit) setRateLimitSec(retryAfter);

      const errorTurn: ConversationTurn = {
        ...newTurn,
        stage: 'error',
        error: message,
      };

      const finalTurns = updatedTurns.map((t) => (t.id === turnId ? errorTurn : t));
      cacheConversation({
        libId,
        query: rootQuery,
        model,
        type: 'search',
        stage: 'done',
        turns: finalTurns,
        startedAt: conversation?.startedAt || Date.now(),
      });
    } finally {
      running.current = false;
    }
  };

  const currentTitle = conversation?.turns?.[0]?.ai?.title || conversation?.query || initialQuery;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* ── Fixed Small Top Bar ── */}
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {currentTitle}
        </Text>

        <Pressable hitSlop={12} onPress={() => router.push('/(tabs)/profile')} style={styles.settingsBtn}>
          <Settings size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ── Scrollable Body with Full Conversation Turns ── */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {turns.length === 0 && (
            <View style={styles.loadingWrap}>
              <ResearchAgentProgress
                query={initialQuery || currentTitle}
                stage="searching"
                search={conversation?.search}
                sources={conversation?.search?.webResults}
              />
              <SkeletonCard lines={3} />
            </View>
          )}

          {turns.map((turn, tIdx) => {
            const article = buildArticleFromTurn(turn);
            return (
              <View key={turn.id || tIdx} style={styles.turnContainer}>
                {/* User Query Bubble for Follow-up Turns (tIdx > 0) */}
                {tIdx > 0 && (
                  <View style={styles.userQueryBubbleWrap}>
                    <View style={styles.userQueryBubble}>
                      <Text style={styles.userQueryText}>{turn.query}</Text>
                    </View>
                  </View>
                )}

                {/* Loading state for this turn */}
                {(turn.stage === 'searching' || turn.stage === 'synthesizing') && (
                  <View style={styles.loadingWrap}>
                    <ResearchAgentProgress
                      query={turn.query}
                      stage={turn.stage}
                      sources={turn.search?.webResults}
                      search={turn.search}
                    />
                    <SkeletonCard lines={3} />
                  </View>
                )}

                {/* Error state for this turn */}
                {turn.stage === 'error' && (
                  <View style={styles.errorCard}>
                    <Text style={type.cardTitle}>Something went wrong</Text>
                    <Text style={styles.errorBody}>{turn.error}</Text>
                    <Text style={type.caption}>Check that the Asteroid backend is running.</Text>
                  </View>
                )}

                {/* Completed Editorial Article for this turn */}
                {turn.stage === 'done' && article && (
                  <Animated.View entering={FadeInDown.duration(350)}>
                    <EditorialArticleRenderer
                      article={article}
                      onFollowUpPress={handleFollowUpSubmit}
                    />

                    {/* Social feedback for the primary subject */}
                    {tIdx === 0 && !!turn.query && <SocialSection query={turn.query} />}
                  </Animated.View>
                )}
              </View>
            );
          })}

          {rateLimitSec > 0 && (
            <RateLimitCard retryAfterSec={rateLimitSec} onRetry={executeInitial} />
          )}
        </ScrollView>

        {/* ── Fixed Bottom Composer Bar ── */}
        <Composer
          placeholder="Ask anything..."
          onSubmit={handleFollowUpSubmit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  /* Small Top Bar */
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: font.heading,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing(2),
  },
  settingsBtn: {
    padding: 6,
  },

  /* Scroll Body */
  scrollContent: {
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
    paddingBottom: spacing(12),
  },

  turnContainer: {
    marginBottom: spacing(3),
  },

  /* User Query Pill for follow-up turns */
  userQueryBubbleWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: spacing(2.5),
    paddingTop: spacing(2),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  userQueryBubble: {
    backgroundColor: '#16181C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '85%',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  userQueryText: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    color: '#FFFFFF',
  },

  loadingWrap: {
    gap: spacing(2),
    paddingTop: spacing(1.5),
    marginVertical: spacing(1),
  },

  errorCard: {
    backgroundColor: '#16181C',
    borderRadius: 18,
    padding: spacing(3),
    gap: spacing(1),
    borderWidth: 1,
    borderColor: colors.critical,
    marginVertical: spacing(2),
  },
  errorBody: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
