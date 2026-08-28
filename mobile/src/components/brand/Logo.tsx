/**
 * Asteroid brand mark: an orbiting moon on an elliptical path around the
 * asteroid core, with optional wordmark. Pure vector — scales crisply.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { colors, font } from '@/theme/theme';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 96, withWordmark = true }: LogoProps) {
  const core = size * 0.28;
  const moon = size * 0.07;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.46}
          ry={size * 0.2}
          fill="none"
          stroke={colors.accentBright}
          strokeWidth={1.5}
          opacity={0.7}
          transform={`rotate(-24 ${size / 2} ${size / 2})`}
        />
        <Circle cx={size / 2} cy={size / 2} r={core} fill={colors.accent} />
        <Circle cx={size / 2 + core * 0.35} cy={size / 2 - core * 0.35} r={core * 0.3} fill={colors.accentBright} opacity={0.8} />
        <Circle cx={size * 0.82} cy={size * 0.33} r={moon} fill={colors.text} opacity={0.9} />
      </Svg>
      {withWordmark && (
        <Text style={[styles.wordmark, { fontSize: Math.round(size * 0.3) }]}>Asteroid</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordmark: {
    fontFamily: font.display,
    color: colors.text,
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
