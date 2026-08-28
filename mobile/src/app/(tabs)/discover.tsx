/**
 * Discover — segmented News / Papers surfaces. News lands in Phase 3,
 * Papers in Phase 2; both show designed placeholder states for now
 * (spec §9 P1: "designed coming-soon placeholder states").
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { colors, font, radius, spacing, type } from '@/theme/theme';

const SEGMENTS = [
  { id: 'news', label: 'News', phase: 'Arrives in Phase 3' },
  { id: 'papers', label: 'Papers', phase: 'Arrives in Phase 2' },
] as const;

export default function DiscoverScreen() {
  const [segment, setSegment] = useState<'news' | 'papers'>('news');
  const active = SEGMENTS.find((s) => s.id === segment)!;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={type.pageHeading}>Discover</Text>
      </View>

      <View style={styles.segmentWrap}>
        {SEGMENTS.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: s.id === segment }}
            onPress={() => setSegment(s.id)}
            style={[styles.segment, s.id === segment && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, s.id === segment && styles.segmentLabelActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.placeholderCard}>
        <Text style={type.cardTitle}>{active.label}</Text>
        <Text style={styles.placeholderBody}>
          {active.phase} — wired to the same backend as the web app: live
          headlines and peer-reviewed papers with citation counts.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(3), paddingTop: spacing(3), paddingBottom: spacing(2) },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: spacing(3),
    marginBottom: spacing(3),
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
  placeholderCard: {
    marginHorizontal: spacing(3),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
    gap: spacing(1),
  },
  placeholderBody: { ...type.caption, lineHeight: 20 },
});
