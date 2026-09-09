/**
 * SkeletonCard — borderless pulsing placeholder on dark surface, X-style.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme/theme';

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.card}>
      <Animated.View style={[pulse, styles.bar, styles.title]} />
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[pulse, styles.bar, { width: i === lines - 1 ? '55%' : '100%' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(3),
    gap: spacing(1.5),
  },
  bar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.elevated,
  },
  title: { width: '40%', height: 20 },
});
