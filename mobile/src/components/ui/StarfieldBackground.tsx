import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withDelay,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const STAR_COUNT = 60; // More stars

function ShootingStar({ delay, top, left }: { delay: number; top: number; left: number }) {
  const translateX = useSharedValue(-100);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Shoot across the screen
    translateX.value = withDelay(
      delay,
      withRepeat(withTiming(width + 200, { duration: 3000, easing: Easing.linear }), -1, false)
    );
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(height + 200, { duration: 3000, easing: Easing.linear }), -1, false)
    );
    // Fade in and out
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500 }, () => {
          opacity.value = withTiming(0, { duration: 1500 });
        }),
        -1,
        false
      )
    );
  }, [delay, translateX, translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: '45deg' },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.shootingStar, { top, left }, style]} />
  );
}

export function StarfieldBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => {
      // Make them slightly larger and brighter so they are clearly visible
      const size = Math.random() * 3 + 1.5; 
      const top = Math.random() * height;
      const left = Math.random() * width;
      const opacity = Math.random() * 0.6 + 0.2;
      return { size, top, left, opacity, key: i };
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Static Stars */}
      {stars.map((star) => (
        <View
          key={star.key}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#FFFFFF',
            opacity: star.opacity,
          }}
        />
      ))}

      {/* Shooting Stars */}
      <ShootingStar delay={1000} top={height * 0.1} left={-width * 0.2} />
      <ShootingStar delay={4500} top={height * 0.4} left={-width * 0.5} />
      <ShootingStar delay={8000} top={-height * 0.1} left={width * 0.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  shootingStar: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
