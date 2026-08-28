/**
 * Search (home) — hero input, model picker chip, recent-search chips.
 * Submitting navigates to /search/[libId], which owns the orchestration
 * and staged loading (spec §7).
 */
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { Logo } from '@/components/brand/Logo';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { ModelPicker } from '@/components/ui/ModelPicker';
import { AIModelsOptions } from '@/services/models';
import { useSearchStore, makeId } from '@/stores/useSearchStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const model = useSettingsStore((s) => s.model);
  const recents = useSearchStore((s) => s.recents);
  const isGuest = useGuestStore((s) => s.isGuest);

  const activeModel = AIModelsOptions.find((m) => m.id === model);

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    const libId = makeId();
    Keyboard.dismiss();
    setQuery('');
    router.push({ pathname: '/search/[libId]', params: { libId, query: q } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <GlowBackground />

      <View style={styles.topBar}>
        <View style={styles.wordmarkWrap}>
          <Logo size={34} withWordmark={false} />
          <Text style={styles.wordmark}>Asteroid</Text>
        </View>
        <Pressable style={styles.modelChip} onPress={() => setPickerOpen(true)}>
          <Sparkles size={14} color={colors.accentBright} />
          <Text style={styles.modelChipLabel} numberOfLines={1}>
            {activeModel?.name ?? model}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.tagline}>What do you want to understand?</Text>

        <View style={styles.inputWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={styles.input}
            onSubmitEditing={submit}
            returnKeyType="search"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={submit}
            disabled={!query.trim()}
            style={[styles.send, { opacity: query.trim() ? 1 : 0.4 }]}
          >
            <ArrowUp size={20} color={colors.text} />
          </Pressable>
        </View>

        {!isGuest && recents.length > 0 && (
          <View style={styles.recents}>
            {recents.slice(0, 6).map((r) => (
              <Pressable
                key={r.libId}
                style={({ pressed }) => [styles.recentChip, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() =>
                  router.push({ pathname: '/search/[libId]', params: { libId: r.libId, query: r.query, type: r.type } })
                }
              >
                <Text style={styles.recentLabel} numberOfLines={1}>
                  {r.query}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ModelPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
  },
  wordmarkWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: font.display, fontSize: 20, color: colors.text },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing(1.5),
    height: 34,
    maxWidth: 170,
  },
  modelChipLabel: { fontFamily: font.bodyMedium, fontSize: 12, color: colors.text },
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(3), gap: spacing(3) },
  tagline: { ...type.sectionHeading, textAlign: 'center' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.5),
    gap: spacing(1),
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    fontFamily: font.body,
    fontSize: 16,
    color: colors.text,
    paddingTop: 10,
    paddingBottom: 10,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recents: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), justifyContent: 'center' },
  recentChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing(2),
    paddingVertical: 8,
    maxWidth: '100%',
  },
  recentLabel: { fontFamily: font.body, fontSize: 13, color: colors.textSecondary },
});
