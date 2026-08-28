/**
 * SocialButton — icon + label on a dark card with hairline border (v1 spec §5).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface SocialButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SocialButton({ label, icon, onPress, disabled = false, style }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.spacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
  },
  icon: { width: 28, alignItems: 'flex-start' },
  label: { flex: 1, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 15, color: colors.text },
  spacer: { width: 28 },
});
