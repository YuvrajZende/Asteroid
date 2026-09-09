/**
 * Search (Landing Page) — Perplexity-style "Where knowledge begins" UI:
 *
 * 1) Top Bar: User avatar initial (e.g. 'G'), 'asteroid pro' logo, UserPlus icon
 * 2) Center Hero:
 *    - Teal Geometric Knowledge Prism Emblem
 *    - "Where knowledge begins" large title
 * 3) Staggered Suggestion Chips:
 *    - Curated prompt pills with emoji/icons that launch instant searches
 * 4) Bottom Pill Composer:
 *    - Rounded pill input with '+', 'Ask anything...', and waveform mic / send button
 */
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowUp,
  AudioLines,
  History,
  Plus,
  Sparkles,
  UserPlus,
} from 'lucide-react-native';
import { useUser } from '@clerk/expo';
import { Logo } from '@/components/brand/Logo';
import { ModelPicker } from '@/components/ui/ModelPicker';
import { AIModelsOptions } from '@/services/models';
import { useSearchStore, makeId } from '@/stores/useSearchStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing } from '@/theme/theme';

interface SuggestionChip {
  id: string;
  icon: string;
  query: string;
}

const SUGGESTIONS_ROW_1: SuggestionChip[] = [
  { id: '1', icon: '⚡', query: 'What is trolling?' },
  { id: '2', icon: '🏕️', query: 'How to purify water in the wild?' },
  { id: '3', icon: '🔭', query: 'James Webb telescope discoveries' },
];

const SUGGESTIONS_ROW_2: SuggestionChip[] = [
  { id: '4', icon: '🎧', query: 'Noise-cancelling headphones' },
  { id: '5', icon: '🥌', query: 'Is curling hard?' },
  { id: '6', icon: '🏏', query: 'Virat Kohli test career highlights' },
];

const SUGGESTIONS_ROW_3: SuggestionChip[] = [
  { id: '7', icon: '🌊', query: 'What causes tides?' },
  { id: '8', icon: '🍾', query: 'Why is champagne a celebratory drink?' },
  { id: '9', icon: '🎭', query: 'History of Kabuki theater' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const model = useSettingsStore((s) => s.model);
  const recents = useSearchStore((s) => s.recents);
  const isGuest = useGuestStore((s) => s.isGuest);

  const activeModel = AIModelsOptions.find((m) => m.id === model);
  const userInitial = (user?.fullName || user?.primaryEmailAddress?.emailAddress || 'G')
    .charAt(0)
    .toUpperCase();

  const launchSearch = (q: string) => {
    const text = q.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const libId = makeId();
    Keyboard.dismiss();
    setQuery('');
    router.push({ pathname: '/search/[libId]', params: { libId, query: text } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        {/* User avatar initial */}
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.avatarBtn}
        >
          <Text style={styles.avatarText}>{userInitial}</Text>
        </Pressable>

        {/* Center: asteroid pro Logo */}
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>asteroid</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>

        {/* Right: User invite / action icon */}
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.rightActionBtn}
        >
          <UserPlus size={19} color="#9CA3AF" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Center: Asteroid Logo + Tagline ── */}
          <View style={styles.heroWrap}>
            <Logo size={76} withWordmark={false} />
            <Text style={styles.heroTagline}>Where knowledge begins</Text>
          </View>

          {/* ── Suggestion Chips Grid (Staggered horizontal rows) ── */}
          <View style={styles.chipsSection}>
            {/* Row 1 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {SUGGESTIONS_ROW_1.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  onPress={() => launchSearch(item.query)}
                >
                  <Text style={styles.chipIcon}>{item.icon}</Text>
                  <Text style={styles.chipText}>{item.query}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Row 2 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {SUGGESTIONS_ROW_2.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  onPress={() => launchSearch(item.query)}
                >
                  <Text style={styles.chipIcon}>{item.icon}</Text>
                  <Text style={styles.chipText}>{item.query}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Row 3 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {SUGGESTIONS_ROW_3.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  onPress={() => launchSearch(item.query)}
                >
                  <Text style={styles.chipIcon}>{item.icon}</Text>
                  <Text style={styles.chipText}>{item.query}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Recent Conversations (If any) ── */}
          {!isGuest && recents.length > 0 && (
            <View style={styles.recentsSection}>
              <View style={styles.recentsHeader}>
                <History size={13} color={colors.textSecondary} />
                <Text style={styles.recentsTitle}>Recent</Text>
              </View>
              <View style={styles.recentsList}>
                {recents.slice(0, 2).map((r) => (
                  <Pressable
                    key={r.libId}
                    style={({ pressed }) => [styles.recentPill, pressed && styles.chipPressed]}
                    onPress={() =>
                      router.push({
                        pathname: '/search/[libId]',
                        params: { libId: r.libId, query: r.query, type: r.type },
                      })
                    }
                  >
                    <Text style={styles.recentText} numberOfLines={1}>
                      {r.query}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Fixed Bottom Composer Bar ── */}
        <View style={styles.composerWrap}>
          <View style={[styles.inputPill, focused && styles.inputPillFocused]}>
            {/* Plus Attach Button */}
            <Pressable
              hitSlop={8}
              style={styles.plusBtn}
              onPress={() => setPickerOpen(true)}
            >
              <Plus size={18} color="#9CA3AF" />
            </Pressable>

            {/* Text Input */}
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask anything..."
              placeholderTextColor="#8E959E"
              style={styles.input}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={() => launchSearch(query)}
              returnKeyType="search"
            />

            {/* Voice Audio Lines / Send Arrow */}
            {query.trim().length > 0 ? (
              <Pressable
                onPress={() => launchSearch(query)}
                style={styles.sendBtn}
              >
                <ArrowUp size={16} color="#000000" strokeWidth={2.5} />
              </Pressable>
            ) : (
              <Pressable
                hitSlop={8}
                style={styles.micBtn}
                onPress={() => Haptics.selectionAsync().catch(() => {})}
              >
                <AudioLines size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ModelPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  /* Top Bar */
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2.5),
  },
  avatarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  proBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontFamily: font.bodySemi,
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rightActionBtn: {
    padding: 6,
  },

  /* Scroll Body */
  scrollBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
    paddingBottom: 90,
  },

  /* Hero Center */
  heroWrap: {
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  heroTagline: {
    fontFamily: font.display,
    fontSize: 25,
    lineHeight: 32,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  /* Staggered Chips Section */
  chipsSection: {
    gap: spacing(1.5),
    marginVertical: spacing(1),
  },
  chipRow: {
    gap: spacing(1.5),
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16181C',
    borderRadius: 16,
    paddingHorizontal: spacing(2),
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontFamily: font.bodyMedium,
    fontSize: 13.5,
    color: '#D1D5DB',
  },

  /* Recents Section */
  recentsSection: {
    marginTop: spacing(3),
    paddingHorizontal: 4,
  },
  recentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recentsTitle: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '48%',
  },
  recentText: {
    fontFamily: font.body,
    fontSize: 12,
    color: '#9CA3AF',
  },

  /* Fixed Bottom Composer */
  composerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    paddingBottom: spacing(2),
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16181C',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: spacing(1.5),
    gap: spacing(1),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputPillFocused: {
    borderColor: 'rgba(0, 210, 196, 0.6)',
  },
  plusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D2C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    padding: 6,
  },
});
