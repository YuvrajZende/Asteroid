/**
 * Asteroid Official Brand Logo:
 * Renders the actual brand asset from mobile/assets/images/asteroid-logo.png
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, font } from '@/theme/theme';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 80, withWordmark = false }: LogoProps) {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/../assets/images/asteroid-logo.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={150}
      />
      {withWordmark && (
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: Math.max(12, Math.round(size * 0.16)),
              letterSpacing: size * 0.05,
            },
          ]}
        >
          ASTEROID
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: font.techno,
    color: colors.text,
    marginTop: 10,
  },
});
