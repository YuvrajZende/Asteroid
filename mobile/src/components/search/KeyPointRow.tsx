/** KeyPointRow — checklist-style key takeaway row (spec §7). */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface KeyPointRowProps {
  text: string;
  index: number;
}

export function KeyPointRow({ text, index }: KeyPointRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.indexWrap}>
        <Text style={styles.index}>{index + 1}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    alignItems: 'flex-start',
  },
  indexWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accentBright },
  text: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: colors.text, flex: 1 },
});
