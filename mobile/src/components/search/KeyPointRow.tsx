/** KeyPointRow — sleek Perplexity-style checkmark takeaway item. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface KeyPointRowProps {
  text: string;
  index: number;
}

export function KeyPointRow({ text }: KeyPointRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.checkWrap}>
        <Check size={12} color="#00D2C4" strokeWidth={3} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(1.5),
    paddingVertical: spacing(1),
    alignItems: 'flex-start',
  },
  checkWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 210, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  text: {
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.text,
    flex: 1,
  },
});
