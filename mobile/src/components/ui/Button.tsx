/**
 * Button — variants per v1 spec §5: primary (teal fill), secondary
 * (dark card + hairline), ghost. Loading state disables double submits;
 * light haptic on primary presses.
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, font, motion, radius, spacing } from '@/theme/theme';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANTS = {
  primary: { bg: colors.accent, border: 'transparent', text: colors.text },
  secondary: { bg: colors.surface, border: colors.border, text: colors.text },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.textSecondary },
} as const;

export function Button({
  title,
  variant = 'primary',
  onPress,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const blocked = disabled || loading;

  const handlePress = () => {
    if (blocked) return;
    if (variant === 'primary') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Animated.View entering={FadeInDown.duration(motion.entrance)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked, busy: loading }}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.base,
          { backgroundColor: v.bg, borderColor: v.border, opacity: blocked ? 0.6 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <Text style={[styles.label, { color: v.text }]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
  },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 16,
  },
});
