/**
 * Button — X/Grok-inspired variants:
 * primary: white fill, black text (Grok CTA style)
 * secondary: dark surface + subtle border
 * ghost: text-only with blue accent
 * All variants use pill shape (radius.button = 24).
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
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
  primary: { bg: '#FFFFFF', border: 'transparent', text: '#000000', loaderColor: '#000000' },
  secondary: { bg: colors.surface, border: colors.border, text: colors.text, loaderColor: colors.text },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.accent, loaderColor: colors.accent },
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
          { backgroundColor: v.bg, borderColor: v.border, opacity: blocked ? 0.5 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.loaderColor} />
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
