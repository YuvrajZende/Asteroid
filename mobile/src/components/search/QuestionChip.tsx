/** QuestionChip — pill-shaped follow-up question with blue accent text. */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface QuestionChipProps {
  question: string;
  onPress: (question: string) => void;
}

export function QuestionChip({ question, onPress }: QuestionChipProps) {
  return (
    <Pressable style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]} onPress={() => onPress(question)}>
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
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  label: { fontFamily: font.bodyMedium, fontSize: 14, color: colors.accent, lineHeight: 20 },
});
