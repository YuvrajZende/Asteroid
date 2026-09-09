/**
 * ResearchAgentProgress — Grok (x.com) & Emil Kowalski / Apple-grade Researching Agent Component:
 *
 * - Live dynamic sub-searches breakdown matching X.com / Grok "Thoughts" view
 * - Real dynamic scraped domain pills with Google favicons (never hardcoded/static fallbacks)
 * - Animated 6-dot matrix thinking beacon
 * - Expandable "Thoughts" view (Cards view like Screenshot 2) & Compact view (like Screenshot 3)
 * - Stepped research progress timeline
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, ChevronUp, ExternalLink, Search, Sparkles } from 'lucide-react-native';
import { colors, font, spacing } from '@/theme/theme';
import type { SearchResponse, WebResult } from '@/types/api';

interface ResearchAgentProgressProps {
  query: string;
  stage: 'searching' | 'synthesizing' | 'done' | 'error';
  sources?: WebResult[];
  search?: SearchResponse;
  activeStepIndex?: number;
}

const RESEARCH_STEPS = [
  { id: 'plan', title: 'Deconstructing inquiry & identifying research angles' },
  { id: 'index', title: 'Querying global web indices & real-time feeds' },
  { id: 'scrape', title: 'Extracting key findings from authoritative sources' },
  { id: 'synth', title: 'Synthesizing verified editorial report with citations' },
];

function extractDomain(url?: string, siteName?: string): string {
  if (siteName && siteName.trim()) {
    return siteName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getFaviconUrl(url?: string, siteName?: string): string {
  const domain = extractDomain(url, siteName);
  if (!domain) return 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

// 6-Dot Matrix Icon with smooth breathing glow (X / Grok thoughts beacon)
function DotMatrix() {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    // Simple breathing: animate from 0.35 → 1 then reverse, repeat forever
    pulse.value = withRepeat(
      withTiming(1, { duration: 900 }),
      -1, // infinite
      true, // reverse (auto ping-pong between 0.35 and 1)
    );
    return () => {
      // Cancel animation on unmount
      pulse.value = 0.35;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pulse.value,
      transform: [{ scale: 0.94 + pulse.value * 0.08 }],
    };
  });

  return (
    <Animated.View style={[styles.dotGrid, animatedStyle]}>
      <View style={styles.dotRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <View style={styles.dotRow}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </Animated.View>
  );
}

export function ResearchAgentProgress({
  query,
  stage,
  sources = [],
  search,
}: ResearchAgentProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Progressive simulated stepping for real-time agent feel
  useEffect(() => {
    if (stage === 'searching') {
      setCurrentStep(0);
      const t1 = setTimeout(() => {
        setCurrentStep(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 1200);
      const t2 = setTimeout(() => {
        setCurrentStep(2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (stage === 'synthesizing') {
      setCurrentStep(3);
    }
  }, [stage]);

  // Clean deduplicated real sources from API
  const cleanSources = useMemo(() => {
    const rawList = (sources && sources.length > 0) ? sources : (search?.webResults ?? []);
    const seen = new Set<string>();
    const list: Array<{ domain: string; url?: string; title?: string }> = [];

    for (const s of rawList) {
      const dom = extractDomain(s.url, s.siteName);
      if (dom && !seen.has(dom) && dom.length > 2) {
        seen.add(dom);
        list.push({ domain: dom, url: s.url, title: s.title });
      }
    }
    return list;
  }, [sources, search]);

  // Construct dynamic sub-searches matching X.com / Grok "Thoughts" multi-query layout
  const subSearches = useMemo(() => {
    // Determine 2-4 realistic sub-query angles
    const related = search?.relatedSearches ?? [];
    const paa = search?.peopleAlsoAsk ?? [];

    const queries: string[] = [query];

    if (related.length > 0) {
      queries.push(related[0]);
      if (related.length > 1) queries.push(related[1]);
    } else if (paa.length > 0) {
      queries.push(paa[0].question || `${query} key insights`);
    } else {
      // Dynamic contextual angles derived from user query
      const words = query.trim().split(/\s+/);
      if (words.length > 3) {
        queries.push(`"${words.slice(0, 3).join(' ')}" key background & context`);
        queries.push(`"${query}" latest authoritative analysis`);
      } else {
        queries.push(`"${query}" comprehensive overview & facts`);
        queries.push(`"${query}" latest updates & developments`);
      }
    }

    // Partition actual scraped sources across the sub-queries
    const chunkSize = Math.max(2, Math.ceil(cleanSources.length / queries.length));
    return queries.slice(0, 3).map((subQ, idx) => ({
      query: subQ,
      sources: cleanSources.slice(idx * chunkSize, (idx + 1) * chunkSize),
    }));
  }, [query, search, cleanSources]);

  const openSource = (url?: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (url) Linking.openURL(url).catch(() => {});
  };

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsExpanded((prev) => !prev);
  };

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.cardWrapper}>
      <LinearGradient
        colors={['#0F1420', '#090C14', '#06080E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Specular glass top accent border */}
        <View style={styles.specularTopBorder} />

        {/* ── Header: Thoughts / Thinking Beacon ── */}
        <Pressable onPress={toggleExpand} style={styles.headerRow}>
          <View style={styles.beaconWrap}>
            <DotMatrix />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.thinkingTitle}>Thinking about your request</Text>
            <View style={styles.statusRow}>
              <Search size={12} color="#38BDF8" strokeWidth={2.5} />
              <Text style={styles.searchingSubtitle}>
                {stage === 'synthesizing' ? 'Synthesizing report' : 'Searching the web'}
              </Text>
            </View>
          </View>
          <View style={styles.expandChevronWrap}>
            {isExpanded ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </View>
        </Pressable>

        {/* ── Compact View (Matching Screenshot 3) ── */}
        {!isExpanded && (
          <View style={styles.compactSourcesRow}>
            {cleanSources.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.compactScrollContent}
              >
                {cleanSources.slice(0, 5).map((item, idx) => (
                  <Pressable
                    key={`${item.domain}-${idx}`}
                    onPress={() => openSource(item.url)}
                    style={styles.pill}
                  >
                    <Image
                      source={{ uri: getFaviconUrl(item.url, item.domain) }}
                      style={styles.pillFavicon}
                      contentFit="cover"
                    />
                    <Text style={styles.pillDomain} numberOfLines={1}>
                      {item.domain}
                    </Text>
                  </Pressable>
                ))}
                {cleanSources.length > 5 && (
                  <Pressable onPress={toggleExpand} style={[styles.pill, styles.morePill]}>
                    <Text style={styles.morePillText}>+{cleanSources.length - 5} more</Text>
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <View style={styles.scanningPillsRow}>
                <View style={styles.scanningPill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.scanningText}>Querying web indices...</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Expanded View: X.com / Grok Sub-Search Cards (Matching Screenshot 2) ── */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {subSearches.map((sub, sIdx) => {
              // Stagger appearance of secondary sub-searches as step progresses
              if (sIdx > 0 && currentStep < sIdx && cleanSources.length === 0) {
                return null;
              }

              return (
                <Animated.View
                  key={`${sub.query}-${sIdx}`}
                  entering={FadeInDown.delay(sIdx * 80).duration(240)}
                  style={styles.subSearchCard}
                >
                  <View style={styles.subSearchHeader}>
                    <Search size={13} color="#94A3B8" strokeWidth={2.2} />
                    <Text style={styles.subSearchQueryText} numberOfLines={1}>
                      Searched for "{sub.query}"
                    </Text>
                  </View>

                  {/* Scraped Source Pills */}
                  {sub.sources.length > 0 ? (
                    <View style={styles.pillsWrap}>
                      {sub.sources.map((item, pIdx) => (
                        <Pressable
                          key={`${item.domain}-${pIdx}`}
                          onPress={() => openSource(item.url)}
                          style={({ pressed }) => [
                            styles.pill,
                            pressed && styles.pillPressed,
                          ]}
                        >
                          <Image
                            source={{ uri: getFaviconUrl(item.url, item.domain) }}
                            style={styles.pillFavicon}
                            contentFit="cover"
                          />
                          <Text style={styles.pillDomain} numberOfLines={1}>
                            {item.domain}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    /* Dynamic scanning pill while waiting for real results */
                    <View style={styles.scanningPillsRow}>
                      <View style={styles.scanningPill}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.scanningText}>
                          {sIdx === 0 ? 'Scanning web index...' : 'Retrieving related sources...'}
                        </Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })}

            {/* ── Connected Stepped Research Timeline ── */}
            <View style={styles.timelineWrap}>
              {RESEARCH_STEPS.map((step, stepIdx) => {
                const isDone = currentStep > stepIdx;
                const isActive = currentStep === stepIdx;
                const isLast = stepIdx === RESEARCH_STEPS.length - 1;

                return (
                  <View key={step.id} style={styles.timelineRow}>
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.nodeIcon,
                          isDone && styles.nodeIconDone,
                          isActive && styles.nodeIconActive,
                        ]}
                      >
                        {isDone ? (
                          <Check size={11} color="#10B981" strokeWidth={3} />
                        ) : isActive ? (
                          <View style={styles.activeGlowRing}>
                            <View style={styles.activeInnerDot} />
                          </View>
                        ) : (
                          <View style={styles.idleNodeDot} />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.connectorTrail,
                            isDone && styles.connectorTrailDone,
                            isActive && styles.connectorTrailActive,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stepTextWrap}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                          isDone && styles.stepLabelDone,
                        ]}
                      >
                        {step.title}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: spacing(2),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing(2.5),
    gap: spacing(2),
  },
  specularTopBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  beaconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGrid: {
    width: 17,
    height: 13,
    justifyContent: 'space-between',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  dotActive: {
    backgroundColor: '#38BDF8',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  thinkingTitle: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchingSubtitle: {
    fontFamily: font.bodyMedium,
    fontSize: 12.5,
    color: '#38BDF8',
    letterSpacing: 0.1,
  },
  expandChevronWrap: {
    padding: 4,
  },

  /* Compact View */
  compactSourcesRow: {
    marginTop: 2,
  },
  compactScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },

  /* Expanded Section */
  expandedSection: {
    gap: spacing(1.5),
  },

  /* Sub-Search Cards (Matching X.com / Grok Thoughts format) */
  subSearchCard: {
    backgroundColor: 'rgba(18, 24, 38, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  subSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subSearchQueryText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: '#E2E8F0',
    flex: 1,
  },

  /* Source Pills (X / Grok style rounded pill badges) */
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  pillFavicon: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pillDomain: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    color: '#F1F5F9',
  },
  morePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  morePillText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: '#94A3B8',
  },

  /* Live Scanning Shimmers */
  scanningPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  scanningText: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: '#94A3B8',
  },

  /* Connected Stepped Research Timeline */
  timelineWrap: {
    marginTop: 4,
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 32,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 20,
  },
  nodeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeIconDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  nodeIconActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  activeGlowRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  idleNodeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  connectorTrail: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 2,
  },
  connectorTrailDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  connectorTrailActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  stepTextWrap: {
    flex: 1,
    paddingTop: 1.5,
  },
  stepLabel: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#F0F9FF',
    fontFamily: font.bodySemi,
  },
  stepLabelDone: {
    color: '#94A3B8',
  },
});
