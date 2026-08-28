/** QuestionChip — a related "People also ask" chip that re-runs search. */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface QuestionChipProps {
  question: string;
  onPress: (question: string) => void;
}

export function QuestionChip({ question, onPress }: QuestionChipProps) {
  return (
    <Pressable style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.8 : 1 }]} onPress={() => onPress(question)}>
      <Text style={styles.label} numberOfLines={2}>
        {question}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  label: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.accentBright, lineHeight: 20 },
});
