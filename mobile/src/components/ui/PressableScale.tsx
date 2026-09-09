/**
 * PressableScale — press micro-interaction: subtle scale + the platform
 * opacity feedback. Used for premium tactile feel on tappable cards.
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;
}

export function PressableScale({ style, children, scaleTo = 0.975, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 120 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 160 });
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[animated, style]}>{children}</Animated.View>
    </Pressable>
  );
}
