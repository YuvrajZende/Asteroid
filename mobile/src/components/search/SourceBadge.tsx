/**
 * SourceBadge — pill-shaped [n] citation badge linking to the source URL.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface SourceBadgeProps {
  number: number;
  url?: string;
}

export function SourceBadge({ number, url }: SourceBadgeProps) {
  const open = () => {
    if (!url) return;
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Pressable onPress={open} disabled={!url} style={({ pressed }) => [styles.badge, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={styles.label}>{number}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentGlow,
    borderRadius: radius.button,
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing(0.75),
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accent },
});
